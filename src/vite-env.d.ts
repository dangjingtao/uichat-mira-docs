/// <reference types="vite-plugin-pwa/client" />

declare module "virtual:page-directories" {
  const directories: string[];
  export default directories;
}

interface ImportMetaEnv {
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  readonly glob: (pattern: string, options?: { eager?: boolean; query?: string; import?: string }) => Record<string, unknown>;
}
