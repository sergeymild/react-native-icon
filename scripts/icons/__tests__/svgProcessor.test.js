const { processSvgContent } = require('../svgProcessor')

const svg = (inner, rootAttrs = 'fill="none"') =>
  `<svg width="24" height="24" ${rootAttrs}>${inner}</svg>`

describe('processSvgContent', () => {
  it('detects fill-only icons and hoists fill to root', () => {
    const { type, content } = processSvgContent(svg('<path d="M0 0" fill="#123456"/>'))
    expect(type).toBe('fill')
    expect(content).toMatch(/<svg[^>]*fill="#123456"/)
  })

  it('detects stroke-only icons and keeps fill="none" on root', () => {
    const { type, content } = processSvgContent(svg('<path d="M0 0" stroke="#123456"/>'))
    expect(type).toBe('stroke')
    expect(content).toMatch(/<svg[^>]*fill="none"/)
    expect(content).toMatch(/<svg[^>]*stroke="#123456"/)
  })

  it('detects "both" when root has explicit fill and stroke colors', () => {
    const { type } = processSvgContent(
      svg('<path d="M0 0"/>', 'fill="#111111" stroke="#222222"')
    )
    expect(type).toBe('both')
  })

  it('respects explicit root fill="none" + stroke color as stroke-only', () => {
    const { type } = processSvgContent(
      svg('<path d="M0 0"/>', 'fill="none" stroke="#222222"')
    )
    expect(type).toBe('stroke')
  })

  it('does NOT strip fill from children that have fill-opacity', () => {
    const { content } = processSvgContent(
      svg('<circle fill="#123456" fill-opacity="0.5"/>')
    )
    expect(content).toMatch(/fill="#123456"/)
  })

  it('does NOT strip stroke from children that have stroke-opacity', () => {
    const { content } = processSvgContent(
      svg('<path stroke="#123456" stroke-opacity="0.5"/>')
    )
    expect(content).toMatch(/stroke="#123456"/)
  })

  it('removes <filter> blocks and filter attributes', () => {
    const { content } = processSvgContent(
      svg('<path d="M0 0" fill="#123456" filter="url(#f)"/><filter id="f"><feGaussianBlur/></filter>')
    )
    expect(content).not.toMatch(/<filter/)
    expect(content).not.toMatch(/filter="url\(#f\)"/)
  })

  it('keeps clipPath (supported by react-native-svg)', () => {
    const { content } = processSvgContent(
      svg('<clipPath id="c"><rect/></clipPath><path d="M0 0" fill="#123456" clip-path="url(#c)"/>')
    )
    expect(content).toMatch(/clipPath/)
    expect(content).toMatch(/clip-path="url\(#c\)"/)
  })

  it('handles color values containing regex special chars without throwing', () => {
    expect(() =>
      processSvgContent(svg('<path d="M0 0" fill="url(#grad)"/>'))
    ).not.toThrow()
  })

  it('is idempotent: re-processing produces identical output', () => {
    const first = processSvgContent(svg('<path d="M0 0" stroke="#123456"/>'))
    const second = processSvgContent(first.content)
    expect(second.content).toBe(first.content)
  })

  it('returns modified=false and original content when no <svg> tag', () => {
    const input = '<not-svg/>'
    const { modified, content, type } = processSvgContent(input)
    expect(modified).toBe(false)
    expect(content).toBe(input)
    expect(type).toBe('fill')
  })
})
