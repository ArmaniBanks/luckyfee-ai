/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  async rewrites() {
    return [
      { source: '/bags-api/:path*', destination: 'https://public-api-v2.bags.fm/api/v1/:path*' },
    ];
  },
};
module.exports = nextConfig;
