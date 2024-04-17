import { describe, expect, it } from 'vitest'
import { createMarkdown } from '../src/core/markdown'
import { resolveOptions } from '../src/core/options'

describe('transform', async () => {
  const options = resolveOptions({})
  const markdownToVue = await createMarkdown(options)

  it('basic', () => {
    const md = `---
title: Hey
---

# Hello

- A
- B
- C
`
    expect(markdownToVue('', md).code).toMatchSnapshot()
  })

  it('style', () => {
    const md = `
# Hello

<style>h1 { color: red }</style>
`
    expect(markdownToVue('', md).code).toMatchSnapshot()
  })

  it('script setup', () => {
    const md = `
# Hello

<script setup lang="ts">
import Foo from './Foo.vue'
</script>
`
    expect(markdownToVue('', md).code).toMatchSnapshot()
  })

  it('exposes frontmatter', () => {
    const md = `---
title: Hey
---

# Hello`
    expect(markdownToVue('', md).code).toMatchSnapshot()
  })

  it('couldn\'t expose frontmatter', () => {
    const md = `---
title: Hey
---

<script setup>
defineExpose({ test: 'test'})
</script>
`
    expect(markdownToVue('', md).code).toMatchSnapshot()
  })

  it('escapeCodeTagInterpolation', () => {
    const md = `
<div>{{hello}}</div>

\`\`\`ts
<div>{{hello}}</div>
\`\`\`
`
    expect(markdownToVue('', md).code).toMatchSnapshot()
  })

  it('frontmatter interpolation', () => {
    const md = `
---
name: 'My Cool App'
---

# Hello World

This is {{frontmatter.name}}
`
    expect(markdownToVue('', md).code).toMatchSnapshot()
  })

  it('vue directives', () => {
    const md = `
---
name: 'My Cool App'
---

<script setup lang="ts">
function onClick() {
  // ...
}
</script>

<button @click="onClick"></button>
`
    expect(markdownToVue('', md).code).toMatchSnapshot()
  })

  it('export keyword frontmatters', () => {
    const md = `
---
class: 'text'
default: 'foo'
---

Hello
`
    expect(markdownToVue('', md).code).toMatchSnapshot()
  })

  it('code escape', () => {
    const md = `
Hello \`{{ world }}\`

\`\`\`js
console.log(\`{{ world }}\`)
\`\`\`
`
    expect(markdownToVue('', md).code).toMatchSnapshot()
  })
})
