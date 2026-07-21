import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export type SitemapGalaxyDocument = {
  title: string;
  path: string;
  description?: string;
  date?: string;
};

export type SitemapGalaxySection = {
  key: string;
  title: string;
  description?: string;
  path: string;
  docs: SitemapGalaxyDocument[];
};

export type SitemapGalaxyData = {
  root: string;
  sections: SitemapGalaxySection[];
};

type GalaxyNode = {
  id: string;
  type: "root" | "section" | "document";
  title: string;
  description: string;
  date?: string;
  path: string;
  group?: string;
  color: number;
  position: THREE.Vector3;
  docCount?: number;
  mesh?: THREE.Mesh;
  glow?: THREE.Sprite;
};

const palette = [
  0xcc785c, 0xe8a55a, 0x5db8a6, 0x6b8fb0, 0x9b8bc4,
  0xc9738f, 0xd4b16a, 0xa9583e, 0x7fae8f,
];

function fibonacciSphere(
  count: number,
  radius: number,
  center = new THREE.Vector3(),
  verticalScale = 0.72,
) {
  const points: THREE.Vector3[] = [];
  const offset = 2 / Math.max(count, 1);
  const increment = Math.PI * (3 - Math.sqrt(5));
  for (let index = 0; index < count; index += 1) {
    const y = index * offset - 1 + offset / 2;
    const radial = Math.sqrt(Math.max(0, 1 - y * y));
    const phi = index * increment;
    points.push(new THREE.Vector3(
      Math.cos(phi) * radial * radius,
      y * radius * verticalScale,
      Math.sin(phi) * radial * radius,
    ).add(center));
  }
  return points;
}

function makeGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.Texture();
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,.9)");
  gradient.addColorStop(.4, "rgba(255,255,255,.35)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

function colorString(color: number) {
  return `#${color.toString(16).padStart(6, "0")}`;
}

export function SitemapGalaxy({
  data,
  theme = "dark",
  onSelectNode,
}: {
  data: SitemapGalaxyData;
  theme?: "dark" | "light";
  onSelectNode?: (node: GalaxyNode) => void;
}) {
  const sections = data.sections;
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<(id: string) => void>(() => undefined);
  const selectedRef = useRef<GalaxyNode | null>(null);
  const [selected, setSelected] = useState<GalaxyNode | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    const scene = new THREE.Scene();
    const colors = theme === "light"
      ? { background: 0xfaf9f5, ring: 0x141413, line: 0x141413, text: "#141413", secondary: "#6c6a64" }
      : { background: 0x181715, ring: 0xffffff, line: 0xe8e0d2, text: "#faf9f5", secondary: "#a09d96" };
    scene.fog = new THREE.FogExp2(colors.background, theme === "light" ? .006 : .012);
    const camera = new THREE.PerspectiveCamera(50, 1, .1, 200);
    camera.position.set(2, 6, 20);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(colors.background, 1);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = .08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = .35;
    controls.minDistance = 6;
    controls.maxDistance = 40;

    const ringGroup = new THREE.Group();
    [6, 10, 14, 18].forEach((radius) => {
      const curve = new THREE.EllipseCurve(0, 0, radius, radius * .72, 0, Math.PI * 2, false, 0);
      const geometry = new THREE.BufferGeometry().setFromPoints(
        curve.getPoints(96).map((point) => new THREE.Vector3(point.x, 0, point.y)),
      );
      ringGroup.add(new THREE.LineLoop(geometry, new THREE.LineBasicMaterial({
        color: colors.ring, transparent: true, opacity: theme === "light" ? .045 : .035,
      })));
    });
    ringGroup.rotation.x = .15;
    scene.add(ringGroup);

    const root: GalaxyNode = {
      id: "__root__", type: "root", title: "网站地图", description: "", path: "",
      color: theme === "light" ? 0x141413 : 0xffffff, position: new THREE.Vector3(),
    };
    const nodes: GalaxyNode[] = [root];
    const sectionPositions = fibonacciSphere(sections.length, 7.5);
    sections.forEach((section, sectionIndex) => {
      const color = palette[sectionIndex % palette.length];
      const sectionNode: GalaxyNode = {
        id: `section:${section.key}`, type: "section", title: section.title,
        description: section.description || "", path: section.path, color,
        position: sectionPositions[sectionIndex], docCount: section.docs.length,
      };
      nodes.push(sectionNode);
      const documentPositions = fibonacciSphere(
        Math.max(section.docs.length, 1),
        1.6 + Math.min(section.docs.length * .09, 1.6),
        sectionNode.position,
      );
      section.docs.forEach((doc, documentIndex) => nodes.push({
        id: doc.path, type: "document", title: doc.title,
        description: doc.description || "", date: doc.date, path: doc.path,
        group: section.title, color, position: documentPositions[documentIndex],
      }));
    });

    const group = new THREE.Group();
    scene.add(group);
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const pickable: THREE.Mesh[] = [];
    const glowTexture = makeGlowTexture();
    const linePositions: number[] = [];
    const addLine = (from: THREE.Vector3, to: THREE.Vector3) => {
      linePositions.push(from.x, from.y, from.z, to.x, to.y, to.z);
    };

    nodes.forEach((node) => {
      const radius = node.type === "root" ? .26 : node.type === "section" ? .19 : .085;
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 16, 16),
        new THREE.MeshBasicMaterial({ color: node.color }),
      );
      mesh.position.copy(node.position);
      mesh.userData.node = node;
      group.add(mesh);
      node.mesh = mesh;
      if (node.type !== "root") pickable.push(mesh);

      const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTexture, color: node.color, transparent: true,
        opacity: node.type === "document" ? .35 : .55,
        depthWrite: false, blending: THREE.AdditiveBlending,
      }));
      const glowSize = radius * (node.type === "document" ? 9 : 7);
      glow.scale.set(glowSize, glowSize, 1);
      glow.position.copy(node.position);
      group.add(glow);
      node.glow = glow;

      if (node.type === "section") addLine(root.position, node.position);
      if (node.type === "document") {
        const parent = sections.find((section) => section.docs.some((doc) => doc.path === node.path));
        const parentNode = parent && nodeById.get(`section:${parent.key}`);
        if (parentNode) addLine(parentNode.position, node.position);
      }
    });

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
    const lines = new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({
      color: colors.line, transparent: true, opacity: theme === "light" ? .16 : .22,
    }));
    scene.add(lines);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hovered: GalaxyNode | null = null;
    let animationFrame = 0;
    const setPointer = (event: { clientX: number; clientY: number }) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      return (raycaster.intersectObjects(pickable, false)[0]?.object.userData.node || null) as GalaxyNode | null;
    };
    const handleClick = (event: MouseEvent) => {
      const node = setPointer(event);
      if (!node) return;
      focusNode(node);
      selectedRef.current = node;
      setSelected(node);
      onSelectNode?.(node);
    };
    const handleMove = (event: PointerEvent) => {
      hovered = setPointer(event);
      canvas.style.cursor = hovered ? "pointer" : "grab";
      const tooltip = tooltipRef.current;
      if (!tooltip) return;
      if (hovered) {
        const rect = stage.getBoundingClientRect();
        tooltip.style.left = `${event.clientX - rect.left}px`;
        tooltip.style.top = `${event.clientY - rect.top}px`;
        tooltip.textContent = hovered.title;
        tooltip.style.opacity = "1";
      } else {
        tooltip.style.opacity = "0";
      }
    };
    let panFrom = new THREE.Vector3();
    let panTo = new THREE.Vector3();
    let panProgress = 1;
    const focusNode = (node: GalaxyNode | undefined) => {
      if (!node) return;
      panFrom.copy(controls.target);
      panTo.copy(node.position);
      panProgress = 0;
    };
    focusRef.current = (id: string) => focusNode(nodeById.get(id));
    canvas.addEventListener("pointermove", handleMove);
    canvas.addEventListener("click", handleClick);

    const resize = () => {
      const rect = stage.getBoundingClientRect();
      camera.aspect = rect.width / Math.max(rect.height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(rect.width, rect.height, false);
    };
    const clock = new THREE.Clock();
    const animate = () => {
      animationFrame = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.elapsedTime;
      if (panProgress < 1) {
        panProgress = Math.min(1, panProgress + delta * 1.6);
        const eased = 1 - Math.pow(1 - panProgress, 3);
        controls.target.lerpVectors(panFrom, panTo, eased);
      }
      nodes.forEach((node) => {
        if (!node.mesh) return;
        const active = node === hovered || node === selectedRef.current;
        const targetScale = active ? 1.7 : 1;
        node.mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), .2);
        if (node.glow) {
          const targetOpacity = active ? .8 : node.type === "document" ? .35 : .55;
          node.glow.material.opacity += (targetOpacity - node.glow.material.opacity) * .2;
        }
      });
      root.mesh?.scale.setScalar(1 + Math.sin(time * 1.2) * .08);
      controls.update();
      renderer.render(scene, camera);
    };
    resize();
    animate();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
    return () => {
      resizeObserver.disconnect();
      canvas.removeEventListener("pointermove", handleMove);
      canvas.removeEventListener("click", handleClick);
      cancelAnimationFrame(animationFrame);
      controls.dispose();
      lineGeometry.dispose();
      (lines.material as THREE.Material).dispose();
      ringGroup.traverse((object) => {
        if (object instanceof THREE.LineLoop) {
          object.geometry.dispose();
          (object.material as THREE.Material).dispose();
        }
      });
      nodes.forEach((node) => {
        node.mesh?.geometry.dispose();
        (node.mesh?.material as THREE.Material | undefined)?.dispose();
        node.glow?.material.map?.dispose();
        node.glow?.material.dispose();
      });
      glowTexture.dispose();
      renderer.dispose();
    };
  }, [sections, theme, onSelectNode]);

  const totalDocuments = sections.reduce((total, section) => total + section.docs.length, 0);
  return (
    <section className={`sitemap-galaxy sitemap-galaxy-${theme}`} aria-label="网站地图星图">
      <div ref={stageRef} className="sitemap-galaxy-stage">
        <canvas ref={canvasRef} className="sitemap-galaxy-canvas" aria-label="可交互的网站地图" />
        <div ref={tooltipRef} className="sitemap-galaxy-tooltip" aria-hidden="true" />
        <header className="sitemap-galaxy-title">
          <span className="eyebrow">SITE MAP · 星图</span>
          <h2>{data.root}</h2>
          <p>{sections.length} 个分区 · {totalDocuments} 篇文档</p>
        </header>
        <div className="sitemap-galaxy-legend" aria-label="网站分区">
          <strong>分区</strong>
          {sections.map((section, index) => (
            <button
              key={section.key}
              type="button"
              className="sitemap-galaxy-legend-item"
              onClick={() => focusRef.current(`section:${section.key}`)}
            >
              <span style={{ backgroundColor: colorString(palette[index % palette.length]) }} />
              {section.title}
              <small>{section.docs.length}</small>
            </button>
          ))}
        </div>
        {selected && (
          <aside className="sitemap-galaxy-info">
            <button type="button" onClick={() => setSelected(null)} aria-label="关闭信息">×</button>
            <span style={{ color: colorString(selected.color) }}>
              {selected.type === "section" ? `分区 · ${selected.docCount} 篇` : selected.group}
            </span>
            <h3>{selected.title}</h3>
            <p>{selected.description || "暂无描述"}</p>
            <div>
              {selected.date && <span>{selected.date}</span>}
              {selected.path && <a href={selected.path}>打开文档 →</a>}
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}
