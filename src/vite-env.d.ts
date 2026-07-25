/// <reference types="vite-plugin-pwa/client" />

declare module "virtual:mira-docs/content" {
  import type { MiraDoc } from "@uichat-mira/docs";

  const docs: MiraDoc[];
  export const roots: string[];
  export default docs;
}

interface ImportMetaEnv {
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
