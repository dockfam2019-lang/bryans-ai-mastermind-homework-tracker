// Plain text from .docx and .pptx files (both are zip files of XML). Runs locally, nothing is sent anywhere.
import { strFromU8, unzipSync } from 'fflate'

const decode = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')

function runs(xml: string, tag: 'w:t' | 'a:t', paragraph: 'w:p' | 'a:p'): string {
  return xml
    .split(new RegExp(`</${paragraph}>`))
    .map((p) => [...p.matchAll(new RegExp(`<${tag}(?:\\s[^>]*)?>([^<]*)</${tag}>`, 'g'))].map((m) => decode(m[1])).join(''))
    .filter((line) => line.trim())
    .join('\n')
}

export function officeText(bytes: Uint8Array, kind: 'docx' | 'pptx'): string {
  const files = unzipSync(bytes)
  if (kind === 'docx') {
    const doc = files['word/document.xml']
    if (!doc) throw new Error('This does not look like a Word document.')
    return runs(strFromU8(doc), 'w:t', 'w:p')
  }
  const slides = Object.keys(files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]))
  if (slides.length === 0) throw new Error('This does not look like a PowerPoint file.')
  return slides.map((n) => runs(strFromU8(files[n]), 'a:t', 'a:p')).join('\n')
}
