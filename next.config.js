/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  images: {
    domains: [
      'bcciplayerimages.s3.ap-south-1.amazonaws.com',
      'ui-avatars.com',
      'assets.iplt20.com'
    ]
  },
  
  // Add Content Security Policy headers with improved blob support for Web Workers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' *;
              style-src 'self' 'unsafe-inline' *;
              connect-src 'self' https://*.ankr.com https://*.monad.xyz wss://*.ankr.com wss://*.monad.xyz https://* ws://* http://localhost:* http://127.0.0.1:*;
              worker-src 'self' blob: data:;
              img-src 'self' data: https:;
              font-src 'self' data: https: https://fonts.googleapis.com https://fonts.gstatic.com;
              frame-src 'self' https:;
            `.replace(/\s+/g, ' ').trim()
          }
        ],
      },
    ];
  },
};

module.exports = nextConfig;