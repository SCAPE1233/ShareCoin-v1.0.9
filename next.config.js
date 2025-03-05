/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Remove or comment this line
  assetPrefix: './',
  trailingSlash: true,
  reactStrictMode: false,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // This key tells Next.js not to generate production source maps
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;

