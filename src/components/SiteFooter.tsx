import { BrandLogo } from "./BrandLogo";

export function SiteFooter({ className = "" }: { className?: string }) {
  return (
    <footer className={className}>
      <div className="wrap footer-simple">
        <p className="footer-copy">
          <span className="brand" style={{ color: "#fff" }}>
            <BrandLogo />
            UIChat Mira
          </span>
          <span>Released under the MIT License.</span>
        </p>
        <p className="footer-copyright">Copyright © 2026 Tomz Dang</p>
      </div>
    </footer>
  );
}
