import { describe, expect, it } from 'vitest'
import { resolveOptions } from '../src/core/options'
import { createMarkdown } from '../src/core/markdown'

describe('router link transforms', async () => {
  const optionsNoLink = resolveOptions({})
  const optionsWithCustomLink = resolveOptions({
    routerLinkComponent: 'MyCustomRouterLink',
  })
  const options = resolveOptions({
    routerLinkComponent: 'RouterLink',
  })

  const markdownToVue = await createMarkdown(options)
  const mdWithoutRouterLink = await createMarkdown(optionsNoLink)
  const mdWithCustomLink = await createMarkdown(optionsWithCustomLink)

  it('transforms internal links to router links', () => {
    const md = `
# Internal links to Router links!

[test](/)
[test 1234](/test/1234)
[test slug](/blog/this-is-my-test-slug-12345)
    `

    expect(markdownToVue('', md).code).toMatchSnapshot()
  })

  it('does not transform non-internal links to router links', () => {
    const md = `
# Non-internal links

[test](https://example.com)
[test 1234](#header1234)
[test url with long path](https://example.com/this/is/a/really/long/path)
    `
    expect(markdownToVue('', md).code).toMatchSnapshot()
    expect(mdWithCustomLink('', md).code).toMatchSnapshot()
  })

  it ('supports custom router link components', () => {
    const md = `
# Internal links to Router links!

[test](/)
[test 1234](/test/1234)
[test slug](/blog/this-is-my-test-slug-12345)
    `
    expect(mdWithCustomLink('', md).code).toMatchSnapshot()
  })

  it('does not convert to router links if router link option is not provided', () => {
    const md = `
# Internal links to Router links!

[test](/)
[test 1234](/test/1234)
[test slug](/blog/this-is-my-test-slug-12345)
    `
    expect(mdWithoutRouterLink('', md)).toMatchSnapshot()
  })
})
