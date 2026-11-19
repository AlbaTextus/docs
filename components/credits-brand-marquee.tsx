import type { ReactNode } from "react"

interface BrandItem {
  id: string
  name: string
  href: string
  wordmarkClass?: string
  icon: ReactNode
}

const BRANDS: BrandItem[] = [
  {
    id: "cloudflare",
    name: "Cloudflare",
    href: "https://www.cloudflare.com/",
    wordmarkClass: "is-cloudflare",
    icon: (
      <svg viewBox="0 0 341 156" fill="none" aria-hidden="true" className="is-wide">
        <path
          d="M275.125 68.25C311.507 68.25 341 97.9335 341 134.55C341 141.077 340.063 147.385 338.317 153.343C337.848 154.943 336.363 156 334.706 156H243.056C241.697 156 240.76 154.628 241.247 153.351L242.999 148.76C248.595 134.03 264.56 121.963 279.331 121.256L307.33 119.813C308.826 119.736 310 118.492 310 116.985C310 115.485 308.838 114.245 307.351 114.157L281.059 112.601C266.924 111.877 260.018 99.2932 263.82 86.179L268.195 71.0866C268.64 69.5514 269.971 68.4343 271.557 68.3476C272.738 68.2831 273.928 68.25 275.125 68.25Z"
          fill="#FAAE40"
        />
        <path
          d="M184.062 0C222 0 253.868 26.1297 262.882 61.4824C263.26 62.967 263.142 64.5333 262.601 65.9662L255.383 85.0897C249.787 99.8196 235.406 112.593 219.134 112.593L93.7928 114.043C92.2801 114.061 91.063 115.3 91.0625 116.823C91.0625 118.344 92.2776 119.585 93.789 119.605L217.365 121.248C231.531 121.248 238.406 134.556 234.606 147.671L233.011 153.189C232.53 154.855 231.014 156 229.291 156H3.90889C1.98075 156 0.330745 154.574 0.17634 152.64C0.0594555 151.175 0 149.695 0 148.2C0 119.723 21.6617 96.3403 49.306 93.8266C48.7387 91.2419 48.4375 88.5564 48.4375 85.8C48.4375 65.3379 64.919 48.75 85.25 48.75C93.3413 48.75 100.822 51.3789 106.897 55.8321C117.716 23.3806 148.176 0 184.062 0Z"
          fill="#F38020"
        />
      </svg>
    ),
  },
  {
    id: "maple-mono",
    name: "Maple Mono",
    href: "https://github.com/subframe7536/maple-font",
    wordmarkClass: "is-maple",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2.8 14.3 7l3.9-1.4-1.4 3.8 4.2 1.8-3.4 2.4.8 3.2-4.8-.9V21h-3.2v-5.1l-4.8.9.8-3.2L3 11.2l4.2-1.8-1.4-3.8L9.7 7 12 2.8Z"
          fill="color-mix(in srgb, var(--docs-orange) 16%, transparent)"
          stroke="var(--docs-orange)"
          strokeWidth="1.65"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
]

const REPEAT_COUNT = 3

function BrandTrack({ hidden = false }: { hidden?: boolean }) {
  const repeated = Array.from({ length: REPEAT_COUNT }, (_, groupIndex) =>
    BRANDS.map((brand) => ({ ...brand, key: `${brand.id}-${groupIndex}` })),
  ).flat()

  return (
    <ul className="credits-marquee-track" aria-hidden={hidden || undefined}>
      {repeated.map((brand) => (
        <li key={brand.key} className="credits-marquee-item">
          <a
            href={brand.href}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={hidden ? -1 : undefined}
            className="credits-brand-logo"
          >
            <span className="credits-brand-mark">{brand.icon}</span>
            <span className={`credits-brand-wordmark ${brand.wordmarkClass ?? ""}`}>
              {brand.name}
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}

export function CreditsBrandMarquee() {
  return (
    <section className="credits-marquee-section" aria-label="致谢品牌：Cloudflare 与开源字体">
      <div className="credits-marquee-viewport">
        <div className="credits-marquee-rail">
          <BrandTrack />
          <BrandTrack hidden />
        </div>
      </div>
    </section>
  )
}
