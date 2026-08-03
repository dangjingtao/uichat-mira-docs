import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ComicReader from "./ComicReader";
import {
  coverAssetUrl,
  pageNumbers,
  readSavedPage,
  work,
  workRoute,
} from "./work";

function measureHeaderOffset() {
  const topNav = document.querySelector<HTMLElement>(".top-nav");
  const mobileBar = document.querySelector<HTMLElement>(".docs-mobile-bar");
  const topNavHeight = topNav?.getBoundingClientRect().height ?? 0;
  const mobileBarHeight = mobileBar && window.getComputedStyle(mobileBar).display !== "none"
    ? mobileBar.getBoundingClientRect().height
    : 0;
  document.documentElement.style.setProperty(
    "--works-header-offset",
    `${Math.round(topNavHeight + mobileBarHeight)}px`,
  );
}

export default function WorksExperience() {
  const location = useLocation();
  const navigate = useNavigate();
  const [reading, setReading] = useState(false);
  const [preferFullscreen, setPreferFullscreen] = useState(false);
  const savedPage = readSavedPage();
  const hasProgress = savedPage !== pageNumbers[0];
  const active = location.pathname === "/works" || location.pathname === workRoute;

  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    const previousOverflow = document.body.style.overflow;
    root.classList.add("works-route");
    document.body.style.overflow = "hidden";

    const observedElements = [
      document.querySelector<HTMLElement>(".top-nav"),
      document.querySelector<HTMLElement>(".docs-mobile-bar"),
    ].filter((element): element is HTMLElement => Boolean(element));
    const resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(measureHeaderOffset);
    observedElements.forEach((element) => resizeObserver?.observe(element));
    window.addEventListener("resize", measureHeaderOffset);
    window.requestAnimationFrame(measureHeaderOffset);

    return () => {
      root.classList.remove("works-route");
      root.style.removeProperty("--works-header-offset");
      document.body.style.overflow = previousOverflow;
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measureHeaderOffset);
    };
  }, [active]);

  useEffect(() => {
    setReading(false);
    setPreferFullscreen(false);
  }, [location.pathname]);

  async function startReading(fullscreen: boolean) {
    if (fullscreen) {
      try {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
          await document.documentElement.requestFullscreen({ navigationUI: "hide" });
        }
      } catch {
        // Fullscreen is progressive enhancement; the reader still uses 100dvh.
      }
      try {
        const orientation = screen.orientation as ScreenOrientation & {
          lock?: (value: "landscape") => Promise<void>;
        };
        await orientation.lock?.("landscape");
      } catch {
        // iOS Safari and some embedded browsers do not allow orientation locking.
      }
    }
    setPreferFullscreen(fullscreen);
    setReading(true);
  }

  if (!active) return null;

  if (location.pathname === "/works") {
    return (
      <div className="works-experience">
        <section className="works-library" aria-labelledby="works-library-title">
          <header className="works-library-header">
            <div>
              <span>WORKS / 画册</span>
              <h1 id="works-library-title">画册馆</h1>
              <p>Mira 与 Tomz 共同完成的连环画与图像叙事。</p>
            </div>
            <div className="works-library-count">01</div>
          </header>
          <div className="works-shelf">
            <button className="work-book-card" type="button" onClick={() => navigate(workRoute)}>
              <span className="work-book-cover">
                <img src={coverAssetUrl} alt={`《${work.title}：${work.subtitle}》封面预览`} />
                <span className="work-book-status">{work.status}</span>
              </span>
              <span className="work-book-copy">
                <span className="work-book-kicker">成人彩色连环画</span>
                <span className="work-book-title-line">
                  <strong>{work.title}</strong>
                  <em>{work.subtitle}</em>
                </span>
                <span className="work-book-meta-line">
                  <small>Tomz × Mira · {work.pageCount} 页</small>
                  <span className="work-book-action">
                    {hasProgress ? `继续第 ${savedPage} 页` : "打开画册"} →
                  </span>
                </span>
              </span>
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={`works-experience${reading ? " is-reading" : ""}`}>
      <section className="work-detail" aria-labelledby="work-detail-title">
        {reading ? (
          <ComicReader
            initialPage={savedPage}
            preferFullscreen={preferFullscreen}
            onClose={() => setReading(false)}
          />
        ) : (
          <>
            <button className="works-back" type="button" onClick={() => navigate("/works")}>
              ← 返回画册馆
            </button>
            <div className="work-detail-grid">
              <div className="work-detail-cover">
                <img src={coverAssetUrl} alt={`《${work.title}：${work.subtitle}》`} />
              </div>
              <div className="work-detail-copy">
                <div className="work-detail-main">
                  <span className="work-detail-kicker">80 年代大陆成人彩色连环画 · 实验预览</span>
                  <h1 id="work-detail-title">{work.title}</h1>
                  <h2>{work.subtitle}</h2>
                  <p>{work.description}</p>
                  <dl>
                    <div><dt>作者</dt><dd>{work.authors}</dd></div>
                    <div><dt>版本</dt><dd>{work.edition}</dd></div>
                    <div><dt>内容</dt><dd>{work.pageCount} 张已完成页面 / 缺第 22 页</dd></div>
                  </dl>
                </div>
                <div className="work-detail-footer">
                  <div className="work-detail-actions">
                    <button className="work-primary-action" type="button" onClick={() => void startReading(false)}>
                      {hasProgress ? `继续第 ${savedPage} 页` : "开始阅读"}
                    </button>
                    <button className="work-landscape-action" type="button" onClick={() => void startReading(true)}>
                      横屏全屏阅读
                    </button>
                  </div>
                  <p className="work-detail-note">
                    PC 阅读会进入关灯模式；手机会请求全屏与横屏。浏览器不允许锁定方向时，仍可手动旋转阅读。
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
