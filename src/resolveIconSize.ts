export type ResolveIconSizeOptions = {
  /** Explicit width. If set without height, height is derived from aspect ratio. */
  width?: number
  /** Explicit height. If set without width, width is derived from aspect ratio. */
  height?: number
  /** Square shorthand: sets both width and height. Wins over width/height. */
  size?: number
  /** Divides the intrinsic fallback size (e.g. scale=2 → half). */
  scale?: number
  /** The icon's intrinsic width (from its viewBox / image dimensions). */
  intrinsicWidth?: number
  /** The icon's intrinsic height. */
  intrinsicHeight?: number
}

export type ResolvedIconSize = {
  width?: number
  height?: number
}

/**
 * Resolve the final width/height for an icon.
 *
 * Rules (first match wins):
 *  - `size`            → a square (size × size).
 *  - `width` + `height`→ used as given (may distort).
 *  - `width` only      → height derived from the intrinsic aspect ratio.
 *  - `height` only     → width derived from the intrinsic aspect ratio.
 *  - none              → intrinsic size divided by `scale`.
 *
 * When the intrinsic aspect ratio is unknown (no/invalid intrinsic dims), a
 * single provided dimension falls back to a square so the icon is still sized.
 */
export function resolveIconSize(opts: ResolveIconSizeOptions): ResolvedIconSize {
  const { width, height, size, intrinsicWidth, intrinsicHeight } = opts
  const scale = opts.scale && opts.scale > 0 ? opts.scale : 1

  const hasIntrinsic =
    typeof intrinsicWidth === 'number' &&
    typeof intrinsicHeight === 'number' &&
    intrinsicWidth > 0 &&
    intrinsicHeight > 0

  if (typeof size === 'number') {
    return { width: size, height: size }
  }

  if (typeof width === 'number' && typeof height === 'number') {
    return { width, height }
  }

  if (typeof width === 'number') {
    const derived = hasIntrinsic
      ? Math.round(width * (intrinsicHeight! / intrinsicWidth!))
      : width
    return { width, height: derived }
  }

  if (typeof height === 'number') {
    const derived = hasIntrinsic
      ? Math.round(height * (intrinsicWidth! / intrinsicHeight!))
      : height
    return { width: derived, height }
  }

  if (hasIntrinsic) {
    return {
      width: Math.round(intrinsicWidth! / scale),
      height: Math.round(intrinsicHeight! / scale),
    }
  }

  return {}
}
