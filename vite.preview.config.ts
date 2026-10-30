import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const root = path.dirname(fileURLToPath(import.meta.url));

/** Offline preview has no login and no Supabase client. */
function stripCloud(): Plugin {
  return {
    name: "strip-cloud",
    enforce: "pre",
    resolveId(source) {
      if (source.includes("lib/supabaseBrowser") || source === "@supabase/supabase-js") {
        return path.resolve(root, "src/lib/supabase-stub.ts");
      }
      return null;
    },
    load(id) {
      if (id.endsWith("/src/lib/cloud.ts") || id.endsWith("\\src\\lib\\cloud.ts")) {
        return [
          "export function startCloud() {",
          "  return {",
          "    signIn() { return Promise.resolve() },",
          "    signOut() { return Promise.resolve() },",
          "    deleteCloud() { return Promise.resolve() },",
          "    retry() {},",
          "    dispose() {}",
          "  }",
          "}"
        ].join("\n");
      }
      return null;
    }
  };
}

// Preview-only config: bundles the whole app (fonts included) into one HTML file.
export default defineConfig({
  define: {
    __OFFLINE_PREVIEW__: "true"
  },
  plugins: [stripCloud(), react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@supabase/supabase-js": path.resolve(root, "src/lib/supabase-stub.ts")
    }
  },
  build: {
    outDir: "dist-preview",
    assetsInlineLimit: 100000000
  }
});
