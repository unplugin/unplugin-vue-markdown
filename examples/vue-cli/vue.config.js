const { defineConfig } = require('@vue/cli-service')
const Markdown = require('unplugin-vue-markdown/webpack')
const prism = require('markdown-it-prism')

module.exports = defineConfig({
  transpileDependencies: true,
  parallel: false,
  chainWebpack: (config) => {
    config.module
      .rule('vue')
      .test(/\.(vue|md)$/)

    config
      .plugin('markdown')
      .use(Markdown({
        markdownItUses: [
          prism,
        ],
      }))
  },
})
