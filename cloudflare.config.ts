import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  accountId: "7bef9937e70279293076bfb4eda44598",
  worker: defineWorker({
    name: "albatextus-docs",
    domains: ["docs.albatextus.com"],
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-11-12",
    observability: {
      enabled: true,
      traces: { enabled: true, headSamplingRate: 0.01 },
    },
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
    },
  }),
});
