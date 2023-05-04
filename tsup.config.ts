import { defineConfig } from 'tsup'

export default defineConfig({
  banner(ctx) {
    if (ctx.format === 'esm') {
      return {
        js: `
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
`.trim(),
      }
    }
  },
  external: ['vue', '@unhead/vue'],
})
