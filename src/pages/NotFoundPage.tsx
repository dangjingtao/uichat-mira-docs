import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { decodedPathname } from "../lib/path";
import { SiteFooter } from "../components/SiteFooter";

export default function NotFoundPage({ onSearch }: { onSearch: () => void }) {
  const location = useLocation();
  const requestedPath = decodedPathname(location.pathname);

  useEffect(() => {
    const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previousRobots = robots?.content;
    robots?.setAttribute("content", "noindex,nofollow");

    return () => {
      if (robots && previousRobots) robots.content = previousRobots;
    };
  }, []);

  return (
    <>
      <main className="not-found-page">
        <div className="not-found-glow" aria-hidden="true" />
        <div className="not-found-card">
          <div className="not-found-number" aria-hidden="true">404</div>
          <h1>这条路径没有内容</h1>
          <p>
            页面可能已经移动、被删除，或者地址输入有误。你可以返回首页，
            也可以搜索站内已有的文档与博客。
          </p>
          <code className="not-found-path">{requestedPath}</code>
          <div className="not-found-actions">
            <Link className="btn btn-primary" to="/">
              返回首页
            </Link>
            <button className="btn btn-secondary" type="button" onClick={onSearch}>
              搜索站内内容
            </button>
            <Link className="not-found-doc-link" to="/guide/about/origin">
              查看 Mira 文档 →
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
