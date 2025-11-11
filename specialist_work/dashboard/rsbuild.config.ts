import {defineConfig} from '@rsbuild/core';
import {pluginReact} from '@rsbuild/plugin-react';
import {tanstackRouter} from '@tanstack/router-plugin/rspack';
import tailwindcssPostcss from '@tailwindcss/postcss';

export default defineConfig({
  plugins: [pluginReact()],
  resolve: {
    alias: {
      '@': './src',
    },
  },
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3001,
    publicDir: {
      name: 'public',
      copyOnBuild: true,
    },
  },
  tools: {
    rspack: {
      plugins: [
        tanstackRouter({
          target: 'react',
          autoCodeSplitting: false,
        }),
      ],
    },
    postcss: {
      postcssOptions: (context) => {
        return context.resourcePath.endsWith('.css') ? {plugins: [tailwindcssPostcss]} : {};
      },
    },
  },
});
