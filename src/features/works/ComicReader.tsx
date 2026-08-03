import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  pageNumbers,
  progressKey,
  type PageNumber,
  work,
} from "./work";
import { useComicAssets } from "./useComicAssets";

type Props = {
  initialPage: number;
  preferFullscreen: boolean;
  onClose: () => void;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

type PageSpriteProps = {
  number: number;
  spriteUrl: string;
  manifest: NonNullable<ReturnType<typeof useComicAssets>["manifest"]>;
  className?: string;
  style?: CSSProperties;
};

function PageSprite({ number, spriteUrl, manifest, className = "", style }: PageSpriteProps) {
  const page = manifest.pages.find((candidate) => candidate.number === number);
  if (!page) return null;
  const x = manifest.columns <= 1 ? 0 : (page.col / (manifest.columns - 1)) * 100;
  const y = manifest.rows <= 1 ? 0 : (page.row / (manifest.rows - 1)) * 100;
  return (
    <span
      role="img"
      aria-label={`第 ${number} 页`}
      className={`comic-page-sprite ${className}`.trim()}
      style={{
        aspectRatio: `${manifest.tileWidth} / ${manifest.tileHeight}`,
        backgroundImage: `url(${spriteUrl})`,
        backgroundSize: `${manifest.columns * 100}% ${manifest.rows * 100}%`,
        backgroundPosition: `${x}% ${y}%`,
        ...style,
      }}
    />
  );
}

export default function ComicReader({ initialPage, preferFullscreen, onClose }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<number | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);
  const initialIndex = Math.max(0, pageNumbers.indexOf(initialPage as PageNumber));
  const [index, setIndex] = useState(initialIndex);
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const page = pageNumbers[index];
  const { manifest, spriteUrl, loading, error } = useComicAssets();

  const directoryEntries = useMemo(
    () => Array.from({ length: 30 }, (_, offset) => {
      const number = offset + 1;
      const pageIndex = pageNumbers.indexOf(number as PageNumber);
      return { number, index: pageIndex, missing: pageIndex < 0 };
    }),
    [],
  );

  useEffect(() => {
    window.localStorage.setItem(progressKey, String(page));
  }, [page]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPrevious();
      } else if (event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault();
        showNext();
      } else if (event.key === "Escape") {
        if (directoryOpen) setDirectoryOpen(false);
        else if (zoom > 1) resetZoom();
        else void close();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  useEffect(() => {
    revealControls();
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, [directoryOpen]);

  useEffect(() => {
    if (preferFullscreen) void requestLandscapeFullscreen();
  }, [preferFullscreen]);

  function revealControls() {
    setControlsVisible(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    if (!directoryOpen) {
      hideTimerRef.current = window.setTimeout(() => setControlsVisible(false), 2600);
    }
  }

  function resetZoom() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function goToPage(nextIndex: number) {
    setIndex(Math.max(0, Math.min(nextIndex, pageNumbers.length - 1)));
    resetZoom();
    revealControls();
  }

  function showPrevious() {
    if (zoom <= 1) goToPage(index - 1);
  }

  function showNext() {
    if (zoom <= 1) goToPage(index + 1);
  }

  async function requestLandscapeFullscreen() {
    const node = rootRef.current;
    try {
      if (node?.requestFullscreen && !document.fullscreenElement) {
        await node.requestFullscreen({ navigationUI: "hide" });
      }
    } catch {
      // Fullscreen is progressive enhancement; 100dvh still provides a reader shell.
    }
    try {
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (value: "landscape") => Promise<void>;
      };
      await orientation.lock?.("landscape");
    } catch {
      // iOS Safari and embedded browsers often reject orientation locking.
    }
  }

  async function close() {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // The browser may already have left fullscreen.
      }
    }
    onClose();
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    revealControls();
    if (zoom > 1) {
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: pan.x,
        originY: pan.y,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    swipeRef.current = { x: event.clientX, y: event.clientY };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    revealControls();
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setPan({
      x: drag.originX + event.clientX - drag.startX,
      y: drag.originY + event.clientY - drag.startY,
    });
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (drag?.pointerId === event.pointerId) {
      dragRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
      return;
    }
    const start = swipeRef.current;
    swipeRef.current = null;
    if (!start || zoom > 1) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) > 54 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
      suppressClickRef.current = true;
      window.setTimeout(() => { suppressClickRef.current = false; }, 0);
      if (deltaX < 0) showNext();
      else showPrevious();
    }
  }

  function handleClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (suppressClickRef.current || zoom > 1) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    if (ratio < 0.25) showPrevious();
    else if (ratio > 0.75) showNext();
    else setControlsVisible((visible) => !visible);
  }

  const messageStyle = { display: "grid", placeItems: "center", alignContent: "center", gap: 16 } as const;
  if (loading) return <div className="comic-reader" style={messageStyle}>正在准备画册……</div>;
  if (error || !manifest || !spriteUrl) return <div className="comic-reader" style={messageStyle}>{error || "画册资源不完整"}<button type="button" onClick={onClose}>返回</button></div>;

  return (
    <div
      ref={rootRef}
      className={`comic-reader${controlsVisible || directoryOpen ? " controls-visible" : ""}`}
      onPointerMove={revealControls}
    >
      <div
        className={`comic-stage${zoom > 1 ? " is-zoomed" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => { dragRef.current = null; swipeRef.current = null; }}
        onClick={handleClick}
        onDoubleClick={() => zoom > 1 ? resetZoom() : setZoom(2)}
      >
        <PageSprite
          number={page}
          spriteUrl={spriteUrl}
          manifest={manifest}
          style={{ transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})` }}
        />
      </div>

      <header className="comic-toolbar comic-toolbar-top">
        <button type="button" onClick={() => void close()}>退出阅读</button>
        <strong>{work.title}：{work.subtitle}</strong>
        <button type="button" onClick={() => void requestLandscapeFullscreen()}>全屏</button>
      </header>

      <footer className="comic-toolbar comic-toolbar-bottom">
        <button type="button" disabled={index <= 0} onClick={showPrevious}>←</button>
        <button className="comic-page-indicator" type="button" onClick={() => setDirectoryOpen(true)}>
          第 {page} 页 · {index + 1}/{pageNumbers.length}
        </button>
        <button type="button" onClick={() => setDirectoryOpen(true)}>目录</button>
        <button type="button" onClick={() => zoom > 1 ? resetZoom() : setZoom(2)}>
          {zoom > 1 ? "复原" : "放大"}
        </button>
        <button type="button" disabled={index >= pageNumbers.length - 1} onClick={showNext}>→</button>
      </footer>

      {directoryOpen ? (
        <div className="comic-directory-backdrop" role="presentation" onClick={() => setDirectoryOpen(false)}>
          <aside className="comic-directory" role="dialog" aria-modal="true" aria-label="页码目录" onClick={(event) => event.stopPropagation()}>
            <div className="comic-directory-head">
              <div><span>PAGE DIRECTORY</span><h3>页码目录</h3></div>
              <button type="button" onClick={() => setDirectoryOpen(false)}>关闭</button>
            </div>
            <div className="comic-directory-grid">
              {directoryEntries.map((entry) => (
                <button
                  className={`${entry.index === index ? "active" : ""}${entry.missing ? " missing" : ""}`}
                  type="button"
                  key={entry.number}
                  disabled={entry.missing}
                  onClick={() => {
                    if (entry.index < 0) return;
                    goToPage(entry.index);
                    setDirectoryOpen(false);
                  }}
                >
                  {entry.missing ? <span>缺页</span> : <PageSprite number={entry.number} spriteUrl={spriteUrl} manifest={manifest} />}
                  <small>{String(entry.number).padStart(2, "0")}</small>
                </button>
              ))}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
