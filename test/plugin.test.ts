import { describe, expect, it } from 'vitest'
import { unpluginFactory } from '../src/index'

describe('plugin transform', () => {
  const plugin = unpluginFactory({}, { framework: 'vite' } as any)
  const ctx = {
    error(e: any) {
      throw e
    },
  }

  async function transform(raw: string, id: string) {
    // @ts-expect-error transform hook signature
    return plugin.transform.call(ctx, raw, id)
  }

  // https://github.com/unplugin/unplugin-vue-markdown/issues/53
  it('does not re-process Vue SFC sub-block requests (?vue&type=)', async () => {
    // This is roughly what @vitejs/plugin-vue passes back for the compiled
    // `<script setup lang="ts">` block of a `.md` file.
    const compiledScript = [
      `import { defineComponent as _defineComponent } from 'vue'`,
      `export default _defineComponent({ setup() { return {} } })`,
    ].join('\n')

    const id = '/x/Test.md?vue&type=script&setup=true&lang.ts'
    const result = await transform(compiledScript, id)

    const code = typeof result === 'string' ? result : result?.code ?? null

    // The plugin must leave the already-compiled script untouched (return
    // nullish). Re-wrapping it produces `<template>...<p>import { defineComponent`
    // which then fails esbuild during build.
    expect(code ?? compiledScript).not.toContain('markdown-body')
    expect(code ?? compiledScript).not.toContain('<template>')
  })

  it('still transforms regular .md files', async () => {
    const result = await transform('# Hello\n', '/x/Test.md')
    const code = typeof result === 'string' ? result : result?.code
    expect(code).toContain('<template>')
    expect(code).toContain('<h1>Hello</h1>')
  })
})
