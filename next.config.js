/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'images.unsplash.com',
      'localhost',
      'www.tirangaaerospace.com',
      'idmstiranga.online',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'idmstiranga.online',
        pathname: '/api/**',
      },
      {
        protocol: 'https',
        hostname: 'idmstiranga.online',
        port: '8080',
        pathname: '/api/**',
      },
    ],
  },
  eslint: {
    // ✅ Allows production builds to succeed
    // even if there are ESLint errors
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
