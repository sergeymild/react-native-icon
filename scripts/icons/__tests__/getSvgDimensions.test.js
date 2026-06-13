const { getSvgDimensions } = require('../getSvgDimensions')

describe('getSvgDimensions', () => {
  it('reads dimensions from viewBox', () => {
    expect(
      getSvgDimensions('<svg viewBox="0 0 40 20"><path/></svg>')
    ).toEqual({ width: 40, height: 20 })
  })

  it('prefers viewBox over width/height attributes', () => {
    expect(
      getSvgDimensions('<svg width="24" height="24" viewBox="0 0 48 16"></svg>')
    ).toEqual({ width: 48, height: 16 })
  })

  it('falls back to width/height attributes when no viewBox', () => {
    expect(
      getSvgDimensions('<svg width="32" height="64"></svg>')
    ).toEqual({ width: 32, height: 64 })
  })

  it('strips units (px) from width/height attributes', () => {
    expect(
      getSvgDimensions('<svg width="32px" height="16px"></svg>')
    ).toEqual({ width: 32, height: 16 })
  })

  it('handles decimal viewBox values', () => {
    expect(
      getSvgDimensions('<svg viewBox="0 0 40.5 20.25"></svg>')
    ).toEqual({ width: 40.5, height: 20.25 })
  })

  it('returns null when no dimensions are present', () => {
    expect(getSvgDimensions('<svg><path/></svg>')).toBeNull()
  })

  it('returns null for non-svg / empty input', () => {
    expect(getSvgDimensions('not an svg')).toBeNull()
  })

  it('ignores a viewBox with zero/invalid size and falls back', () => {
    expect(
      getSvgDimensions('<svg width="10" height="20" viewBox="0 0 0 0"></svg>')
    ).toEqual({ width: 10, height: 20 })
  })
})
