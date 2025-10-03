/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Allow cross-origin requests from Safe Apps
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.safe.global https://app.safe.global;",
          },
        ],
      },
    ];
  },

  // Allow development from different origins (handled by headers)

  webpack: (config, { isServer, webpack }) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
      '@react-native-async-storage/async-storage': false,
    };
    config.externals.push('pino-pretty', 'lokijs', 'encoding');

    // Add global polyfills for SSR
    if (isServer) {
      // Provide mock implementations for browser APIs during SSR
      config.plugins.push(
        new webpack.DefinePlugin({
          'globalThis.indexedDB': 'undefined',
          'global.indexedDB': 'undefined',
          'indexedDB': 'undefined',
        })
      );
    }

    return config;
  },
};

module.exports = nextConfig;