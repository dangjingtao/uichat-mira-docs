import type { SyntheticEvent } from "react";
import { logoUrl } from "../site.config";

const appBase = import.meta.env.BASE_URL;
const localLogoSrc = `${appBase}mira-logo.png`;
const logoSrc = logoUrl.trim() || localLogoSrc;

function handleLogoError(event: SyntheticEvent<HTMLImageElement>) {
  if (event.currentTarget.dataset.logoFallbackApplied) return;
  event.currentTarget.dataset.logoFallbackApplied = "true";
  event.currentTarget.src = localLogoSrc;
}

export function BrandLogo() {
  return (
    <img
      className="brand-logo"
      src={logoSrc}
      onError={handleLogoError}
      alt=""
    />
  );
}
