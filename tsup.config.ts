import { defineConfig } from 'tsup'

export default defineConfig({
  esbuildOptions(options) {
    options.supported ??= {}
    options.supported['import-meta'] = true
  },
})
