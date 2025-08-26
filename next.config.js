/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "images.unsplash.com",
      "localhost",
      "www.tirangaaerospace.com",
      "idmstiranga.online",
      "res.cloudinary.com", // ✅ Added Cloudinary
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
    ],
    deviceSizes: [320, 640, 1024, 1920], // ✅ Added 1920 for your case
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
