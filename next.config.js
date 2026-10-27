/** @type {import('next').NextConfig} */
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8090/api";
const apiHostname = new URL(apiBaseUrl).hostname;

const nextConfig = {
  reactStrictMode: true,
  images: {
    // Allows next/image to load hadith images served from the API host.
    // Add any additional CDN/media hostnames here as they come into use.
    remotePatterns: [
      {
        protocol: apiBaseUrl.startsWith("https") ? "https" : "http",
        hostname: apiHostname,
      },
    ],
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
