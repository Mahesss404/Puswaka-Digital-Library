import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file to access VITE_ vars in vite.config (process.env not available for VITE_ vars)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
        react(),
        tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        // Proxy: /midtrans-api/* → https://app.sandbox.midtrans.com/*
        // Server Key is added server-side here, never exposed to the browser
        '/midtrans-api': {
          target: 'https://app.sandbox.midtrans.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/midtrans-api/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              const serverKey = env.VITE_MIDTRANS_SERVER_KEY || '';
              const encoded = Buffer.from(serverKey + ':').toString('base64');
              proxyReq.setHeader('Authorization', 'Basic ' + encoded);
              proxyReq.setHeader('Content-Type', 'application/json');
              proxyReq.setHeader('Accept', 'application/json');
            });
          },
        },
      },
    },
  };
})

