import { toArray } from '@antfu/utils'
import { preprocessHead } from './head'
import type { Frontmatter, Options, ResolvedOptions } from './types'
import { getVueVersion } from './utils'

export function resolveOptions(userOptions: Options): ResolvedOptions {
  const defaultOptions: Omit<ResolvedOptions, 'frontmatterPreprocess'> = {
    headEnabled: false,
    headField: '',
    frontmatter: true,
    excerpt: false,
    exposeFrontmatter: true,
    exposeExcerpt: false,
    escapeCodeTagInterpolation: true,
    customSfcBlocks: ['route', 'i18n', 'style'],
    componentOptions: {},
    frontmatterOptions: {},
    markdownItOptions: {},
    markdownItUses: [],
    markdownItSetup: () => {},
    wrapperComponent: null,
    transforms: {},
    vueVersion: userOptions.vueVersion || getVueVersion(),
    wrapperClasses: 'markdown-body',
    include: null,
    exclude: null,
  }
  const options = userOptions.frontmatterPreprocess
    ? { ...defaultOptions, ...userOptions }
    : {
        ...defaultOptions,
        ...userOptions,
        frontmatterPreprocess: (frontmatter: Frontmatter, options: ResolvedOptions) => {
          const head = preprocessHead(frontmatter, options)
          return { head, frontmatter }
        },
      }

  options.wrapperClasses = toArray(options.wrapperClasses)
    .filter((i?: string) => i)
    .join(' ')

  return options as ResolvedOptions
}
