import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const interfaceRoot = fileURLToPath(new URL('..', import.meta.url))
const packagesRoot = fileURLToPath(new URL('../packages', import.meta.url))
const toolsRegistry = fileURLToPath(new URL('../tools/registry', import.meta.url))
const demoRoot = fileURLToPath(new URL('.', import.meta.url))
const repoRoot = fileURLToPath(new URL('../..', import.meta.url))
const interfaceNm = fileURLToPath(new URL('../node_modules', import.meta.url))

import { docCodeExtractorPlugin } from './vite-plugins/doc-code-extractor'

function pkg(name: string) {
  return `${packagesRoot}/${name}/src`
}

export default defineConfig({
  plugins: [docCodeExtractorPlugin(), react(), tailwindcss()] as any,
  resolve: {
    alias: [
      {
        find: '@consona/interface/styles.css',
        replacement: `${pkg('core')}/theme/styles.css`,
      },
      {
        find: '@consona/interface/registry',
        replacement: `${toolsRegistry}/index.ts`,
      },
      {
        find: '@consona/interface-core',
        replacement: `${pkg('core')}/index.ts`,
      },
      {
        find: /^@consona\/interface-(media|orb|sound|dnd|overlay|onboarding|composites|charts|map|gantt|glass|interaction|navigation)$/,
        replacement: `${packagesRoot}/$1/src/index.ts`,
      },
      {
        find: /^@consona\/interface$/,
        replacement: `${pkg('interface')}/index.ts`,
      },
      {
        find: '@consona/interface/audio',
        replacement: `${pkg('media')}/index.ts`,
      },
      {
        find: /^@consona\/interface\/(core|media|orb|sound|dnd|overlay|onboarding|composites|charts|map|gantt|glass|interaction|navigation)$/,
        replacement: `${packagesRoot}/$1/src/index.ts`,
      },
      {
        find: '@registry/registry.json',
        replacement: `${interfaceRoot}/registry/registry.json`,
      },
      {
        find: '@registry/metadata-registry.json',
        replacement: `${interfaceRoot}/registry/metadata-registry.json`,
      },
      {
        find: /^@registry$/,
        replacement: `${toolsRegistry}/index.ts`,
      },
      {
        find: /^@registry\/(.*)$/,
        replacement: `${toolsRegistry}/$1`,
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
    port: 5180,
    strictPort: true,
    allowedHosts: true,
    fs: {
      allow: [demoRoot, interfaceRoot, repoRoot, packagesRoot, toolsRegistry],
    },
  },
})
