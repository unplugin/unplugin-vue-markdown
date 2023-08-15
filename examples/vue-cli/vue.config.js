const { defineConfig } = require('@vue/cli-service')
const Markdown = require('unplugin-vue-markdown/webpack')
const prism = require('markdown-it-prism')

module.exports = defineConfig({
  transpileDependencies: true,
  chainWebpack: (config) => {
    config.module
      .rule('vue')
      .test(/\.(vue|md)$/)
  },
  configureWebpack(config) {
    config.plugins.unshift(
      Markdown({
        markdownItUses: [
          prism,
        ],
      }),
    )
  },
})
