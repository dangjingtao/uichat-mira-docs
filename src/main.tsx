import React from "react";
import ReactDOM from "react-dom/client";
import {BrowserRouter} from "react-router-dom";
import {registerSW} from "virtual:pwa-register";
import "@fontsource/public-sans/400.css";
import "@fontsource/public-sans/500.css";
import "@fontsource/public-sans/600.css";
import "@fontsource/public-sans/700.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import App from "./App";
import "./claude.theme.css";
import "./apple.theme.css";
import "./Supabase.theme.css";
import "./tailwind.css";
import "./styles.css";
import "./home.css";
import "./blog-list.css";
import "./markdown.css";
import "./blog-detail.css";
import "./claude-visual.css";

const themeKey = "mira-color-theme";
const defaultTheme = "claude";
const savedTheme =
  typeof window !== "undefined" ? window.localStorage.getItem(themeKey) : null;
const initialTheme =
  savedTheme === "claude" || savedTheme === "apple" || savedTheme === "supabase"
    ? savedTheme
    : defaultTheme;

// Keep the deployment root aligned with BrowserRouter's basename. GitHub Pages
// mounts the app at /uichat-mira-docs/; stripping that final slash makes the
// basename fail to match and React renders an empty shell.
const buildBase = import.meta.env.BASE_URL;
const normalizedBuildBase = buildBase === "/" ? "/" : buildBase.replace(/\/+$/, "");

if (normalizedBuildBase !== "/" && window.location.pathname === normalizedBuildBase) {
  window.history.replaceState(
    null,
    "",
    `${normalizedBuildBase}/${window.location.search}${window.location.hash}`,
  );
} else {
  const isDeploymentRoot =
    window.location.pathname === "/" ||
    (normalizedBuildBase !== "/" && window.location.pathname === `${normalizedBuildBase}/`);

  if (!isDeploymentRoot && window.location.pathname.endsWith("/")) {
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname.replace(/\/+$/, "")}${window.location.search}${window.location.hash}`,
    );
  }
}

document.documentElement.dataset.theme = initialTheme;

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    window.dispatchEvent(new Event("mira:pwa-update-available"));
  },
});

window.addEventListener("mira:pwa-update-confirmed", () => {
  void updateSW();
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={buildBase}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);