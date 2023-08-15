import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export function getVueVersion(defaultVersion = '3.2.0') {
  try {
    let v = require('vue')
    if (v.default)
      v = v.default
    return v.version || defaultVersion
  }
  catch (e) {
    return defaultVersion
  }
}

export function isUnheadVueInstalled() {
  try {
    require('@unhead/vue')
    return true
  }
  catch {
    return false
  }
}
