import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { createHash } from "node:crypto";
import { patchCssModules } from "vite-css-modules";
import path from "node:path";
import tailwindcss from "@tailwindcss/postcss";

export default defineConfig({
  resolve: {
    alias: {
      "@/lib/content-source": path.resolve(import.meta.dirname, "lib/content-source.cloudflare.ts"),
    },
  },
  build: {
    outDir: "release/cloudflare",
  },
  cacheDir: "temp/vite",
  plugins: [
    patchCssModules({ exportMode: "default" }),
    vinext(),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
  css: {
    postcss: {
      plugins: [
        tailwindcss(),
        {
          postcssPlugin: "docs-font-paths",
          OnceExit(root) {
            // Tailwind inlines these stylesheets before Vite resolves their URLs.
            root.walkDecls("src", declaration => {
              declaration.value = declaration.value.replace(
                /\.\/fonts\/(400|500)\//g,
                `${path.resolve(import.meta.dirname, "fonts/maple-mono-cn/fonts").replaceAll("\\", "/")}/$1/`,
              );
            });
          },
        },
      ],
    },
    modules: {
      generateScopedName(name: string, filename: string) {
        const relativePath = path.relative(import.meta.dirname, filename.replace(/\?.*$/, "")).replaceAll("\\", "/");
        return `_${name}_${createHash("sha256").update(relativePath).digest("hex").slice(0, 7)}`;
      },
    },
  },
});
