import type { Doc } from "../content/mira-docs-adapter";

const appBase = import.meta.env.BASE_URL;

function seedFromString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let value = seed;
  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let temp = Math.imul(value ^ (value >>> 15), 1 | value);
    temp = (temp + Math.imul(temp ^ (temp >>> 7), 61 | temp)) ^ temp;
    return ((temp ^ (temp >>> 14)) >>> 0) / 4294967296;
  };
}

function range(rand: () => number, min: number, max: number) {
  return min + rand() * (max - min);
}

function generateOrbitCoverSvg(seed: string) {
  const rand = mulberry32(seedFromString(seed));
  const width = 1200;
  const height = 520;
  const cx = width / 2;
  const cy = height * 0.52;
  const accentColors = ["#cc785c", "#5db8a6", "#e8a55a", "#6b8fb0"];
  const accent = accentColors[Math.floor(rand() * accentColors.length)];
  const neutralRing = "#d9cfbd";
  const ringA = {
    rx: range(rand, width * 0.32, width * 0.42),
    ry: range(rand, height * 0.16, height * 0.24),
    rot: range(rand, -18, 18),
    dur: Math.round(range(rand, 40, 70)),
    dir: rand() > 0.5 ? "normal" : "reverse",
  };
  const ringB = {
    rx: range(rand, width * 0.22, width * 0.3),
    ry: range(rand, height * 0.22, height * 0.32),
    rot: range(rand, -18, 18),
    dur: Math.round(range(rand, 40, 70)),
    dir: rand() > 0.5 ? "normal" : "reverse",
  };
  const badgeR = width * 0.07;
  const dotAngle = range(rand, 0, Math.PI * 2);
  const dotR = badgeR * 0.28;
  const dotX = cx + Math.cos(dotAngle) * badgeR * 0.4;
  const dotY = cy + Math.sin(dotAngle) * badgeR * 0.4;
  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .ring { transform-box: fill-box; transform-origin: center; fill: none; }
    @keyframes spin-n { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes spin-r { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
  </style>
  <ellipse class="ring" style="animation:${ringA.dir === "normal" ? "spin-n" : "spin-r"} ${ringA.dur}s linear infinite" cx="${cx}" cy="${cy}" rx="${ringA.rx.toFixed(1)}" ry="${ringA.ry.toFixed(1)}" stroke="${neutralRing}" stroke-width="1.2" transform="rotate(${ringA.rot.toFixed(1)} ${cx} ${cy})"/>
  <ellipse class="ring" style="animation:${ringB.dir === "normal" ? "spin-n" : "spin-r"} ${ringB.dur}s linear infinite" cx="${cx}" cy="${cy}" rx="${ringB.rx.toFixed(1)}" ry="${ringB.ry.toFixed(1)}" stroke="${accent}" stroke-width="1.6" transform="rotate(${ringB.rot.toFixed(1)} ${cx} ${cy})"/>
  <circle cx="${cx}" cy="${cy}" r="${badgeR.toFixed(1)}" fill="none" stroke="${accent}" stroke-width="1.8"/>
  <circle cx="${dotX.toFixed(1)}" cy="${dotY.toFixed(1)}" r="${dotR.toFixed(1)}" fill="${accent}"/>
</svg>`;
}

export function resolveCoverSource(doc: Doc) {
  const cover = doc.cover?.trim();
  if (cover) {
    if (/^https?:\/\//i.test(cover) || /^data:image\//i.test(cover)) return cover;
    if (cover.startsWith("/")) return `${appBase}${cover.replace(/^\/+/, "")}`;
    return cover;
  }
  const fallbackSvg = generateOrbitCoverSvg(doc.path || doc.title);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(fallbackSvg)}`;
}
