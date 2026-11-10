import { strToU8, zipSync } from 'fflate'
import { describe, expect, it } from 'vitest'
import { officeText } from './officeText'

describe('officeText', () => {
  it('reads paragraphs from a Word document, joining runs and decoding entities', () => {
    const xml = '<w:document><w:body><w:p><w:r><w:t>Essay 1 </w:t></w:r><w:r><w:t xml:space="preserve">due Nov 18</w:t></w:r></w:p><w:p><w:r><w:t>Q&amp;A session</w:t></w:r></w:p><w:p></w:p></w:body></w:document>'
    const zip = zipSync({ 'word/document.xml': strToU8(xml) })
    expect(officeText(zip, 'docx')).toBe('Essay 1 due Nov 18\nQ&A session')
  })

  it('reads slides in numeric order from a PowerPoint file', () => {
    const slide = (t: string) => strToU8(`<p:sld><a:p><a:r><a:t>${t}</a:t></a:r></a:p></p:sld>`)
    const zip = zipSync({ 'ppt/slides/slide10.xml': slide('Final exam Dec 15'), 'ppt/slides/slide2.xml': slide('Quiz 1 Nov 12'), 'ppt/slides/slide1.xml': slide('Welcome') })
    expect(officeText(zip, 'pptx')).toBe('Welcome\nQuiz 1 Nov 12\nFinal exam Dec 15')
  })

  it('explains when the file is the wrong kind', () => {
    const zip = zipSync({ 'other.xml': strToU8('<x/>') })
    expect(() => officeText(zip, 'docx')).toThrow('Word document')
    expect(() => officeText(zip, 'pptx')).toThrow('PowerPoint')
  })
})
