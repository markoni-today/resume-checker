/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Поддержка Python API routes для Vercel
    serverComponentsExternalPackages: [],
  },
  
  // Конфигурация для работы с файлами
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },

  // Настройки для деплоя на Vercel
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },

  // Увеличиваем лимит размера тела запроса для файлов
  serverRuntimeConfig: {
    maxFileSize: '5mb',
  },
};

module.exports = nextConfig;