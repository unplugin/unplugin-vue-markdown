import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import Markdown from 'vite-plugin-vue-markdown'
import prism from 'markdown-it-prism'
import Pages from 'vite-plugin-pages'
import Inspect from 'vite-plugin-inspect'

export default defineConfig({
  plugins: [
    Vue({
      include: [/\.vue$/, /\.md$/],
    }),
    Markdown({
      headEnabled: true,
      markdownItUses: [
        prism,
      ],
    }),
    Pages({
      pagesDir: 'pages',
      extensions: ['vue', 'md'],
    }),
    Inspect(),
  ],
  build: {
    sourcemap: true,
  },
})
