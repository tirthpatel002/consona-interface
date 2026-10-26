import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const interfaceSrc = fileURLToPath(new URL('../src', import.meta.url))
const interfaceRoot = fileURLToPath(new URL('..', import.meta.url))
const demoRoot = fileURLToPath(new URL('.', import.meta.url))
const repoRoot = fileURLToPath(new URL('../..', import.meta.url))
const interfaceNm = fileURLToPath(new URL('../node_modules', import.meta.url))

import { docCodeExtractorPlugin } from './vite-plugins/doc-code-extractor'

export default defineConfig({
  plugins: [docCodeExtractorPlugin(), react(), tailwindcss()] as any,
  resolve: {
    alias: [
      {
        find: '@consona/interface/styles.css',
        replacement: `${interfaceSrc}/theme/styles.css`,
      },
      {
        find: '@consona/interface/registry',
        replacement: `${interfaceSrc}/registry/index.ts`,
      },
      {
        find: /^@consona\/interface$/,
        replacement: `${interfaceSrc}/index.ts`,
      },
      {
        find: '@consona/interface/gantt',
        replacement: `${interfaceSrc}/modules/gantt/index.ts`,
      },
      {
        find: /^@consona\/interface\/(.*)$/,
        replacement: `${interfaceSrc}/$1`,
      },
      {
        find: /^@registry$/,
        replacement: `${interfaceSrc}/registry/index.ts`,
      },
      {
        find: /^@registry\/(.*)$/,
        replacement: `${interfaceSrc}/registry/$1`,
      },
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url)),
      },
      {
        find: '@heroicons/react',
        replacement: `${interfaceNm}/@heroicons/react`,
      },
      {
        find: 'react-aria-components',
        replacement: `${interfaceNm}/react-aria-components`,
      },
      {
        find: 'input-otp',
        replacement: `${interfaceNm}/input-otp`,
      },
    ],
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: [
      'input-otp',
      '@heroicons/react/24/outline',
      'react-aria-components',
      'maplibre-gl',
      '@nivo/core',
      '@nivo/bar',
      '@nivo/bump',
      '@nivo/chord',
      '@nivo/funnel',
      '@nivo/heatmap',
      '@nivo/line',
      '@nivo/pie',
      '@nivo/radar',
      '@nivo/radial-bar',
      '@nivo/sankey',
      '@nivo/scatterplot',
      '@nivo/stream',
      '@nivo/sunburst',
      '@nivo/treemap',
      'd3-format',
      'd3-scale',
      'd3-shape',
      '@dnd-kit/core',
      '@dnd-kit/modifiers',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
      'embla-carousel-react',
      'motion',
      'sonner',
    ],
    exclude: ['react-router-dom'],
  },
  build: {
    chunkSizeWarningLimit: 1200,
  },
  server: {
    host: true,
    port: 5174,
    allowedHosts: true,
    fs: {
      allow: [demoRoot, interfaceRoot, repoRoot],
    },
  },
})
