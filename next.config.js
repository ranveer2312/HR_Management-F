/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        // This pathname allows images from the specific folder and subfolders
        pathname: '/daju0j8vi/image/upload/**', 
      },
    ],
    // The deviceSizes array is also good to keep for responsive images
    deviceSizes: [320, 640, 1024, 1920],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;