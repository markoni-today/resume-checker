/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Отключаем turbopack для совместимости с mammoth.js
  // experimental: {
  //   turbo: false
  // },
  // Настройки для serverless functions
  serverRuntimeConfig: {
    // Увеличиваем лимиты для обработки файлов
    maxDuration: 10
  },
  // Настройки webpack для pdfjs-dist
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Конфигурация для серверных модулей
      config.externals = config.externals || [];
      config.externals.push({
        'canvas': 'canvas',
        'jsdom': 'jsdom'
      });
      
      // Настройки для pdfjs-dist
      config.resolve.alias = {
        ...config.resolve.alias,
        'pdfjs-dist/build/pdf.worker.entry': false
      };
    }
    return config;
  }
};

module.exports = nextConfig;
