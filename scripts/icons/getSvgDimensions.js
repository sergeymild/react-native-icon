// Extract an SVG's intrinsic dimensions (used for aspect-ratio-aware sizing).
// Prefers viewBox (most reliable), falls back to width/height attributes.
// Returns { width, height } or null when no usable dimensions are found.

function getSvgDimensions(content) {
  if (typeof content !== 'string') return null

  const svgMatch = content.match(/<svg[^>]*>/i)
  if (!svgMatch) return null
  const svgTag = svgMatch[0]

  // 1. viewBox="minX minY width height"
  const viewBox = svgTag.match(/viewBox\s*=\s*["']\s*([^"']+?)\s*["']/i)
  if (viewBox) {
    const parts = viewBox[1].trim().split(/[\s,]+/).map(Number)
    if (parts.length === 4) {
      const [, , w, h] = parts
      if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
        return { width: w, height: h }
      }
    }
  }

  // 2. width / height attributes (strip units like "px")
  const parseAttr = (name) => {
    const m = svgTag.match(new RegExp(`${name}\\s*=\\s*["']\\s*([\\d.]+)`, 'i'))
    if (!m) return undefined
    const v = Number(m[1])
    return Number.isFinite(v) && v > 0 ? v : undefined
  }

  const width = parseAttr('width')
  const height = parseAttr('height')
  if (width !== undefined && height !== undefined) {
    return { width, height }
  }

  return null
}

module.exports = { getSvgDimensions }
