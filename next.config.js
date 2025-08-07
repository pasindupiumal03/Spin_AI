/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true,
    domains: [],
  },
  compiler: {
    // Enable styled-components if you're using it
    // styledComponents: true,
  },
  // Enable React Strict Mode
  reactStrictMode: true,
  // Enable SWC minification
  swcMinify: true,
  // Optimize CSS loading
  experimental: {
    optimizeCss: true,  // Now enabled with critters installed
    scrollRestoration: true,
  },
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Add any necessary webpack configurations here
    return config;
  },
};

module.exports = nextConfig;
