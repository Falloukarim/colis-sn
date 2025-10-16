import type { NextConfig } from "next";

// Configuration de base
const nextConfig: NextConfig = {
  eslint: {
    // Attention: ne pas utiliser en production
    ignoreDuringBuilds: true,
  },
};

// Configuration PWA uniquement en production
if (process.env.NODE_ENV === 'production') {
  const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'supabase-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 // 24 heures
          }
        }
      }
    ]
  });
  
  module.exports = withPWA(nextConfig);
} else {
  module.exports = nextConfig;
}

export default nextConfig;