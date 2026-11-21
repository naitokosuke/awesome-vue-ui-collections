import { defineConfig } from "void/config";

// Two prebuilt pages and their assets, no worker: unknown URLs get a plain 404, not index.html.
export default defineConfig({
  inference: { appType: "static", build: "vp run build", outputDir: "dist" },
  routing: { notFound: "none" },
});
