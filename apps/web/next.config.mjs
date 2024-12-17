/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack(config, { isServer }) {
      // Exclude .node files from being bundled
      if (!isServer) {
        config.module.rules.push({
          test: /\.node$/,
          use: 'noop-loader',  // No operation loader to skip processing
        });
      }
      return config;
    },
  };

  export default nextConfig;
  