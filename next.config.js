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
  // Ensure CSS is properly extracted in production
  experimental: {
    optimizeCss: true,
  },
  // Enable CSS modules
  cssModules: true,
  // Ensure CSS is properly loaded
  webpack: (config, { isServer }) => {
    // Important: return the modified config
    return config;
  },
};

module.exports = nextConfig;
