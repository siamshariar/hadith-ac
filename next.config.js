/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  // The analytics ID is read in the browser too (route-change page views),
  // so it is inlined at build time; empty means no analytics.
  env: {
    GOOGLE_ANALYTICS_ID: process.env.GOOGLE_ANALYTICS_ID || "",
  },
  images: {
    // The site's images are small static files (logos), so next/image serves
    // them as they are. This also switches off the /_next/image optimizer,
    // whose known vulnerabilities (DoS, cache confusion, remote code execution
    // with crafted AVIF/SVG) have no fix in Next.js 13.
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
