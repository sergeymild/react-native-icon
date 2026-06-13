import { resolveIconSize } from '../resolveIconSize'

describe('resolveIconSize', () => {
  // Intrinsic 40x20 → aspect ratio (w/h) = 2.
  const intrinsic = { intrinsicWidth: 40, intrinsicHeight: 20 }

  it('size sets a square, ignoring intrinsic aspect', () => {
    expect(resolveIconSize({ size: 30, ...intrinsic })).toEqual({
      width: 30,
      height: 30,
    })
  })

  it('uses both width and height as given (may distort)', () => {
    expect(resolveIconSize({ width: 100, height: 10, ...intrinsic })).toEqual({
      width: 100,
      height: 10,
    })
  })

  it('width only → height derived from aspect ratio', () => {
    // height = width * (ih/iw) = 100 * (20/40) = 50
    expect(resolveIconSize({ width: 100, ...intrinsic })).toEqual({
      width: 100,
      height: 50,
    })
  })

  it('height only → width derived from aspect ratio', () => {
    // width = height * (iw/ih) = 50 * (40/20) = 100
    expect(resolveIconSize({ height: 50, ...intrinsic })).toEqual({
      width: 100,
      height: 50,
    })
  })

  it('rounds the derived dimension to an integer', () => {
    // intrinsic 30x20 → aspect 1.5; width 25 → height 25*20/30 = 16.67 → 17
    expect(
      resolveIconSize({ width: 25, intrinsicWidth: 30, intrinsicHeight: 20 })
    ).toEqual({ width: 25, height: 17 })
  })

  it('neither width/height/size → falls back to intrinsic', () => {
    expect(resolveIconSize({ ...intrinsic })).toEqual({ width: 40, height: 20 })
  })

  it('scale divides the intrinsic fallback size', () => {
    expect(resolveIconSize({ scale: 2, ...intrinsic })).toEqual({
      width: 20,
      height: 10,
    })
  })

  it('width only without intrinsic dims → square (no aspect info)', () => {
    expect(resolveIconSize({ width: 100 })).toEqual({ width: 100, height: 100 })
  })

  it('height only without intrinsic dims → square', () => {
    expect(resolveIconSize({ height: 80 })).toEqual({ width: 80, height: 80 })
  })

  it('nothing provided and no intrinsic → empty (let the icon size itself)', () => {
    expect(resolveIconSize({})).toEqual({})
  })

  it('ignores zero / invalid intrinsic dims for aspect (avoids divide-by-zero)', () => {
    expect(
      resolveIconSize({ width: 50, intrinsicWidth: 0, intrinsicHeight: 0 })
    ).toEqual({ width: 50, height: 50 })
  })
})
