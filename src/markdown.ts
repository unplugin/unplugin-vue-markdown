import MarkdownIt from 'markdown-it'
import { toArray, uniq } from '@antfu/utils'
import { componentPlugin } from '@mdit-vue/plugin-component'
import { frontmatterPlugin } from '@mdit-vue/plugin-frontmatter'
import type { MarkdownEnv, ResolvedOptions } from './types'

const scriptSetupRE = /<\s*script([^>]*)\bsetup\b([^>]*)>([\s\S]*)<\/script>/mg
const defineExposeRE = /defineExpose\s*\(/mg

interface ScriptMeta {
  code: string
  attr: string
}

function extractScriptSetup(html: string) {
  const scripts: ScriptMeta[] = []
  html = html.replace(scriptSetupRE, (_, attr1, attr2, code) => {
    scripts.push({
      code,
      attr: `${attr1} ${attr2}`.trim(),
    })
    return ''
  })

  return { html, scripts }
}

function extractCustomBlock(html: string, options: ResolvedOptions) {
  const blocks: string[] = []
  for (const tag of options.customSfcBlocks) {
    html = html.replace(new RegExp(`<${tag}[^>]*\\b[^>]*>[^<>]*<\\/${tag}>`, 'mg'), (code) => {
      blocks.push(code)
      return ''
    })
  }

  return { html, blocks }
}

export function createMarkdown(options: ResolvedOptions) {
  const isVue2 = options.vueVersion.startsWith('2.')

  const markdown = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    ...options.markdownItOptions,
  })

  markdown.use(componentPlugin, options.componentOptions)

  if (options.frontmatter || options.excerpt) {
    markdown.use(frontmatterPlugin, {
      ...options.frontmatterOptions,
      grayMatterOptions: {
        excerpt: options.excerpt,
        ...options.frontmatterOptions.grayMatterOptions,
      },
    })
  }

  markdown.linkify.set({ fuzzyLink: false })

  options.markdownItUses.forEach((e) => {
    const [plugin, options] = toArray(e)

    markdown.use(plugin, options)
  })

  options.markdownItSetup(markdown)

  return (id: string, raw: string) => {
    const { wrapperClasses, wrapperComponent, transforms, headEnabled, frontmatterPreprocess } = options

    raw = raw.trimStart()

    if (transforms.before)
      raw = transforms.before(raw, id)

    const env: MarkdownEnv = { id }
    let html = markdown.render(raw, env)
    const { excerpt = '', frontmatter: data = null } = env

    if (wrapperClasses)
      html = `<div class="${wrapperClasses}">${html}</div>`
    else
      html = `<div>${html}</div>`
    if (wrapperComponent)
      html = `<${wrapperComponent}${options.frontmatter ? ' :frontmatter="frontmatter"' : ''}${options.excerpt ? ' :excerpt="excerpt"' : ''}>${html}</${wrapperComponent}>`
    if (transforms.after)
      html = transforms.after(html, id)

    if (options.escapeCodeTagInterpolation) {
      // escape curly brackets interpolation in <code>, #14
      html = html.replace(/<code(.*?)>/g, '<code$1 v-pre>')
    }

    const hoistScripts = extractScriptSetup(html)
    html = hoistScripts.html
    const customBlocks = extractCustomBlock(html, options)
    html = customBlocks.html

    const scriptLines: string[] = []
    let frontmatterExportsLines: string[] = []
    let excerptExportsLine = ''
    let excerptKeyOverlapping = false

    function hasExplicitExports() {
      return defineExposeRE.test(hoistScripts.scripts.map(i => i.code).join(''))
    }

    if (options.frontmatter) {
      if (options.excerpt && data) {
        if (data.excerpt !== undefined)
          excerptKeyOverlapping = true
        data.excerpt = excerpt
      }

      const { head, frontmatter } = frontmatterPreprocess(data || {}, options)

      if (options.excerpt && !excerptKeyOverlapping && frontmatter.excerpt !== undefined)
        delete frontmatter.excerpt

      scriptLines.push(`const frontmatter = ${JSON.stringify(frontmatter)}`)

      frontmatterExportsLines = Object.entries(frontmatter).map(([key, value]) => `export const ${key} = ${JSON.stringify(value)}`)

      if (!isVue2 && options.exposeFrontmatter && !hasExplicitExports())
        scriptLines.push('defineExpose({ frontmatter })')

      if (!isVue2 && headEnabled && head) {
        scriptLines.push(`const head = ${JSON.stringify(head)}`)
        scriptLines.unshift('import { useHead } from "@vueuse/head"')
        scriptLines.push('useHead(head)')
      }
    }

    if (options.excerpt) {
      scriptLines.push(`const excerpt = ${JSON.stringify(excerpt)}`)

      if (!excerptKeyOverlapping)
        excerptExportsLine = `export const excerpt = ${JSON.stringify(excerpt)}\n`

      if (!isVue2 && options.exposeExcerpt && !hasExplicitExports())
        scriptLines.push('defineExpose({ excerpt })')
    }

    scriptLines.push(...hoistScripts.scripts.map(i => i.code))

    let attrs = uniq(hoistScripts.scripts.map(i => i.attr)).join(' ').trim()
    if (attrs)
      attrs = ` ${attrs}`

    const scripts = isVue2
      ? [
        `<script${attrs}>`,
        ...scriptLines,
        ...frontmatterExportsLines,
        excerptExportsLine,
        'export default { data() { return { frontmatter } } }',
        '</script>',
        ]
      : [
        `<script setup${attrs}>`,
        ...scriptLines,
        '</script>',
        ...((frontmatterExportsLines.length || excerptExportsLine)
          ? [
            `<script${attrs}>`,
            ...frontmatterExportsLines,
            excerptExportsLine,
            '</script>',
            ]
          : []),
        ]

    return [
      `<template>${html}</template>`,
      ...scripts.map(i => i.trim()).filter(Boolean),
      ...customBlocks.blocks,
    ].join('\n')
  }
}
