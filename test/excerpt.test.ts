import { describe, expect, it } from 'vitest'
import { createMarkdown } from '../src/markdown'
import { resolveOptions } from '../src/options'

describe('excerpt', () => {
  it('rendered excerpt', () => {
    const options = resolveOptions({
      excerpt: true,
      frontmatterOptions: {
        grayMatterOptions: {
          excerpt: true,
          excerpt_separator: '<!-- more -->',
        },
      },
    })
    const markdownToVue = createMarkdown(options)
    const md = `---
title: Hey
---

This is an excerpt which has been rendered to **HTML**.

<!-- more -->

# Hello

- A
- B
- C`
    expect(markdownToVue('', md)).toMatchSnapshot()
  })

  it('raw excerpt', () => {
    const options = resolveOptions({
      excerpt: true,
      frontmatterOptions: {
        renderExcerpt: false,
        grayMatterOptions: {
          excerpt: true,
          excerpt_separator: '<!-- more -->',
        },
      },
    })
    const markdownToVue = createMarkdown(options)
    const md = `---
title: Hey
---

This is an excerpt which is kept as **raw Markdown**.

<!-- more -->

# Hello

- A
- B
- C`
    expect(markdownToVue('', md)).toMatchSnapshot()
  })
})
