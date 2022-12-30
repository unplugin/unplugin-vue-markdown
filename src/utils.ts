export function getVueVersion(defaultVersion = '3.2.0') {
  try {
    const _require = require
    let v = _require('vue')
    if (v.default)
      v = v.default
    return v.version || defaultVersion
  }
  catch (e) {
    return defaultVersion
  }
}
