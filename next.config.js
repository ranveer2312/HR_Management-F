/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "images.unsplash.com",
      "localhost",
      "www.tirangaaerospace.com",
      "idmstiranga.online",
      "res.cloudinary.com", // ✅ Cloudinary allowed
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "idmstiranga.online",
        pathname: "/api/**",
      },
      {
        protocol: "https",
        hostname: "idmstiranga.online",
        port: "8080",
        pathname: "/api/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com", // ✅ Cloudinary rule
        pathname: "/**", 
      },
    ],
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
