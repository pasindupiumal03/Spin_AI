/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  transpilePackages: ['@codesandbox/sandpack-react'],
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // Add a rule to handle .d.ts files
    config.module.rules.push({
      test: /\.d\.ts$/,
      use: 'raw-loader',
    });
    
    return config;
  },
};

module.exports = nextConfig;
