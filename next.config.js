/** @type {import('next').NextConfig} */
const nextConfig = {
  // Silence the @opentelemetry/instrumentation warning
  webpack: (config) => {
    config.ignoreWarnings = [
      { module: /node_modules\/@opentelemetry\/instrumentation/ }
    ];
    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },

  experimental: {
    // Enable server actions which are required for the application
    serverActions: true,
    serverComponents: true,
  }
};