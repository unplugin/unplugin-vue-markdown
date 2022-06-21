// ported from https://github.com/vuejs/vitepress/blob/d0fdda69045bb280dbf39e035f1f8474247196a6/src/node/markdown/plugins/component.ts

import type MarkdownIt from 'markdown-it'
import blockNames from 'markdown-it/lib/common/html_blocks'

/**
 * Vue reserved tags
 *
 * @see https://vuejs.org/api/built-in-components.html
 */
const vueReservedTags = [
  'template',
  'component',
  'transition',
  'transition-group',
  'keep-alive',
  'slot',
  'teleport',
]

/**
 * According to markdown spec, all non-block html tags are treated as "inline"
 * tags (wrapped with <p></p>), including those "unknown" tags.
 *
 * Therefore, markdown-it processes "inline" tags and "unknown" tags in the
 * same way, and does not care if a tag is "inline" or "unknown".
 *
 * As we want to take those "unknown" tags as custom components, we should
 * treat them as "block" tags.
 *
 * So we have to distinguish between "inline" and "unknown" tags ourselves.
 *
 * The inline tags list comes from MDN.
 *
 * @see https://spec.commonmark.org/0.29/#raw-html
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Inline_elements
 */
const inlineTags = [
  'a',
  'abbr',
  'acronym',
  'audio',
  'b',
  'bdi',
  'bdo',
  'big',
  'br',
  'button',
  'canvas',
  'cite',
  'code',
  'data',
  'datalist',
  'del',
  'dfn',
  'em',
  'embed',
  'i',
  // iframe is treated as HTML blocks in markdown spec
  // 'iframe',
  'img',
  'input',
  'ins',
  'kbd',
  'label',
  'map',
  'mark',
  'meter',
  'noscript',
  'object',
  'output',
  'picture',
  'progress',
  'q',
  'ruby',
  's',
  'samp',
  'script',
  'select',
  'slot',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'svg',
  'template',
  'textarea',
  'time',
  'u',
  'tt',
  'var',
  'video',
  'wbr',
]

// replacing the default htmlBlock rule to allow using custom components at
// root level
//
// an array of opening and corresponding closing sequences for html tags,
// last argument defines whether it can terminate a paragraph or not
const HTML_SEQUENCES: [RegExp, RegExp, boolean][] = [
  [/^<(script|pre|style)(?=(\s|>|$))/i, /<\/(script|pre|style)>/i, true],
  [/^<!--/, /-->/, true],
  [/^<\?/, /\?>/, true],
  [/^<![A-Z]/, />/, true],
  [/^<!\[CDATA\[/, /\]\]>/, true],

  // MODIFIED HERE: treat vue reserved tags as block tags
  [
    new RegExp(`^</?(${vueReservedTags.join('|')})(?=(\\s|/?>|$))`, 'i'),
    /^$/,
    true,
  ],

  // MODIFIED HERE: treat unknown tags as block tags (custom components),
  // excluding known inline tags
  [
    new RegExp(
      `^</?(?!(${inlineTags.join('|')})(?![\\w-]))\\w[\\w-]*[\\s/>]`,
    ),
    /^$/,
    true,
  ],

  [
    new RegExp(`^</?(${blockNames.join('|')})(?=(\\s|/?>|$))`, 'i'),
    /^$/,
    true,
  ],

  [
    // eslint-disable-next-line no-control-regex
    /^(?:<[A-Za-z][A-Za-z0-9\-]*(?:\s+[a-zA-Z_:@][a-zA-Z0-9:._-]*(?:\s*=\s*(?:[^"'=<>`\x00-\x20]+|'[^']*'|"[^"]*"))?)*\s*\/?>|<\/[A-Za-z][A-Za-z0-9\-]*\s*>)/,
    /^$/,
    true,
  ],
]

export const componentPlugin = (md: MarkdownIt) => {
  md.block.ruler.at('html_block', (state, startLine, endLine, silent): boolean => {
    let i, nextLine, lineText
    let pos = state.bMarks[startLine] + state.tShift[startLine]
    let max = state.eMarks[startLine]

    // if it's indented more than 3 spaces, it should be a code block
    if (state.sCount[startLine] - state.blkIndent >= 4)
      return false

    if (!state.md.options.html)
      return false

    if (state.src.charCodeAt(pos) !== 0x3C /* < */)
      return false

    lineText = state.src.slice(pos, max)

    for (i = 0; i < HTML_SEQUENCES.length; i++) {
      if (HTML_SEQUENCES[i][0].test(lineText))
        break
    }

    if (i === HTML_SEQUENCES.length)
      return false

    if (silent) {
      // true if this sequence can be a terminator, false otherwise
      return HTML_SEQUENCES[i][2]
    }

    nextLine = startLine + 1

    // if we are here - we detected HTML block. let's roll down till block end
    if (!HTML_SEQUENCES[i][1].test(lineText)) {
      for (; nextLine < endLine; nextLine++) {
        if (state.sCount[nextLine] < state.blkIndent)
          break

        pos = state.bMarks[nextLine] + state.tShift[nextLine]
        max = state.eMarks[nextLine]
        lineText = state.src.slice(pos, max)

        if (HTML_SEQUENCES[i][1].test(lineText)) {
          if (lineText.length !== 0)
            nextLine++
          break
        }
      }
    }

    state.line = nextLine

    const token = state.push('html_block', '', 0)
    token.map = [startLine, nextLine]
    token.content = state.getLines(startLine, nextLine, state.blkIndent, true)

    return true
  })
}
