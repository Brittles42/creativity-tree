/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'delivery-us1.bfl.ai',
        port: '',
        pathname: '/results/**',
      },
    ],
    unoptimized: true,
  },
}

module.exports = nextConfig 