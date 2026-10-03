import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";

export function ShareButton({ title, text }: { title: string; text?: string }) {
  const [label, setLabel] = useState("分享");

  const resetLabelSoon = () => {
    window.setTimeout(() => setLabel("分享"), 1800);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = { title, text: text || title, url };

    if (typeof navigator.share === "function") {
      try {
        await navigator.share(shareData);
        setLabel("已分享");
        resetLabelSoon();
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement("textarea");
        input.value = url;
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        input.remove();
      }
      setLabel("链接已复制");
      resetLabelSoon();
    } catch {
      setLabel("复制失败");
      resetLabelSoon();
    }
  };

  return (
    <button
      className="btn btn-secondary share-button"
      type="button"
      onClick={handleShare}
      aria-label={label}
    >
      <Share2 size={15} strokeWidth={1.8} aria-hidden="true" />
      {label}
    </button>
  );
}

export function PwaUpdatePrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showPrompt = () => setVisible(true);
    window.addEventListener("mira:pwa-update-available", showPrompt);
    return () => window.removeEventListener("mira:pwa-update-available", showPrompt);
  }, []);

  if (!visible) return null;

  return (
    <div className="pwa-update-overlay" role="presentation">
      <section
        className="pwa-update-dialog"
        role="dialog"
        aria-modal="false"
        aria-labelledby="pwa-update-title"
      >
        <div>
          <span className="eyebrow">版本更新</span>
          <h2 id="pwa-update-title">网站有新版本</h2>
          <p>更新网站数据后即可使用最新内容，当前页面不会自动刷新。</p>
        </div>
        <div className="pwa-update-actions">
          <button type="button" className="pwa-update-later" onClick={() => setVisible(false)}>
            稍后
          </button>
          <button
            type="button"
            className="pwa-update-confirm"
            onClick={() => {
              setVisible(false);
              window.dispatchEvent(new Event("mira:pwa-update-confirmed"));
            }}
          >
            更新网站
          </button>
        </div>
      </section>
    </div>
  );
}
