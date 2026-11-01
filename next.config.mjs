import { fileURLToPath } from "node:url"

export default phase => ({
  outputFileTracingRoot: fileURLToPath(new URL("..", import.meta.url)),
  distDir: phase === "phase-development-server" ? "temp/next" : "release/next",
  devIndicators: false,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
    ] }]
  },
})
