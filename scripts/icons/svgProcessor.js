const p = require('path')
const fs = require('fs')

// Process SVG file: move fill/stroke from child elements to root svg element
function processSvgFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8')

  // Parse SVG root element
  const svgMatch = content.match(/<svg[^>]*>/i)
  if (!svgMatch) return { type: 'fill', modified: false }

  let svgTag = svgMatch[0]

  // Check what svg already has
  const svgFillMatch = svgTag.match(/fill\s*=\s*["']([^"']*)["']/i)
  const svgStrokeMatch = svgTag.match(/stroke\s*=\s*["']([^"']*)["']/i)

  // Find fill/stroke in child elements (excluding svg tag itself and defs)
  let contentAfterSvg = content.substring(svgMatch.index + svgTag.length)

  // Remove only filter from defs before searching for fill/stroke values
  // But keep gradients and clipPath as they are needed for rendering
  let contentForSearch = contentAfterSvg
    .replace(/<filter[^>]*>[\s\S]*?<\/filter>/gi, '')

  const fillMatches = [...contentForSearch.matchAll(/fill\s*=\s*["']([^"']*)["']/gi)]
  const strokeMatches = [...contentForSearch.matchAll(/stroke\s*=\s*["']([^"']*)["']/gi)]

  let fillValue = null
  let strokeValue = null
  let iconType = null

  // Find fill value from svg or child elements (first non-none, non-transparent value)
  if (svgFillMatch && svgFillMatch[1] !== 'none' && svgFillMatch[1] !== 'transparent') {
    fillValue = svgFillMatch[1]
  } else {
    for (const match of fillMatches) {
      const value = match[1]
      if (value && value !== 'none' && value !== 'transparent') {
        fillValue = value
        break
      }
    }
  }

  // Find stroke value from svg or child elements (first non-none, non-transparent value)
  if (svgStrokeMatch && svgStrokeMatch[1] !== 'none' && svgStrokeMatch[1] !== 'transparent') {
    strokeValue = svgStrokeMatch[1]
  } else {
    for (const match of strokeMatches) {
      const value = match[1]
      if (value && value !== 'none' && value !== 'transparent') {
        strokeValue = value
        break
      }
    }
  }

  // Determine icon type based on SVG root element first
  // If svg has explicit fill="none" or stroke="none", respect that
  const svgHasFillNone = svgFillMatch && svgFillMatch[1] === 'none'
  const svgHasStrokeNone = svgStrokeMatch && svgStrokeMatch[1] === 'none'
  const svgHasFillColor = svgFillMatch && svgFillMatch[1] !== 'none' && svgFillMatch[1] !== 'transparent'
  const svgHasStrokeColor = svgStrokeMatch && svgStrokeMatch[1] !== 'none' && svgStrokeMatch[1] !== 'transparent'

  // If svg explicitly has fill="none" and stroke color, it's stroke-only
  if (svgHasFillNone && svgHasStrokeColor) {
    iconType = 'stroke'
  }
  // If svg explicitly has stroke="none" and fill color, it's fill-only
  else if (svgHasStrokeNone && svgHasFillColor) {
    iconType = 'fill'
  }
  // If svg has both colors, it's both
  else if (svgHasFillColor && svgHasStrokeColor) {
    iconType = 'both'
  }
  // Otherwise look at child elements
  else if (strokeValue && fillValue) {
    iconType = 'both'
  } else if (strokeValue) {
    iconType = 'stroke'
  } else if (fillValue) {
    iconType = 'fill'
  } else {
    iconType = 'fill' // default to fill
  }

  let modified = false
  const hasSvgFill = svgFillMatch && svgFillMatch[1] !== 'none'
  const hasSvgStroke = svgStrokeMatch && svgStrokeMatch[1] !== 'none'

  // Remove fill="none" from svg tag only if we're adding a real fill color
  // For stroke-only icons, keep fill="none" to prevent black fill
  if (svgFillMatch && svgFillMatch[1] === 'none' && fillValue && iconType !== 'stroke') {
    svgTag = svgTag.replace(/\sfill\s*=\s*["']none["']/i, '')
    modified = true
  }

  // Remove stroke="none" from svg tag only if we're adding a real stroke color
  if (svgStrokeMatch && svgStrokeMatch[1] === 'none' && strokeValue && iconType !== 'fill') {
    svgTag = svgTag.replace(/\sstroke\s*=\s*["']none["']/i, '')
    modified = true
  }

  // Add or update fill on svg tag if needed (but not for stroke-only icons)
  if (fillValue && !hasSvgFill && iconType !== 'stroke') {
    svgTag = svgTag.replace(/(<svg[^>]*)>/i, `$1 fill="${fillValue}">`)
    modified = true
  } else if (fillValue && hasSvgFill && svgFillMatch[1] !== fillValue && iconType !== 'stroke') {
    // Update existing fill value
    svgTag = svgTag.replace(/fill\s*=\s*["'][^"']*["']/i, `fill="${fillValue}"`)
    modified = true
  }

  // Add or update stroke on svg tag if needed (but not for fill-only icons)
  if (strokeValue && !hasSvgStroke && iconType !== 'fill') {
    svgTag = svgTag.replace(/(<svg[^>]*)>/i, `$1 stroke="${strokeValue}">`)
    modified = true
  } else if (strokeValue && hasSvgStroke && svgStrokeMatch[1] !== strokeValue && iconType !== 'fill') {
    // Update existing stroke value
    svgTag = svgTag.replace(/stroke\s*=\s*["'][^"']*["']/i, `stroke="${strokeValue}"`)
    modified = true
  }

  // For stroke-only icons, add fill="none" if not already present
  if (iconType === 'stroke' && !svgFillMatch) {
    svgTag = svgTag.replace(/(<svg[^>]*)>/i, `$1 fill="none">`)
    modified = true
  }

  // Update content if modified
  if (modified) {
    const oldSvgTag = svgMatch[0]
    content = content.replace(oldSvgTag, svgTag)

    // Now we need to work only on child elements (content after svg tag)
    const newSvgTagEnd = content.indexOf('>', svgMatch.index) + 1
    const beforeSvg = content.substring(0, newSvgTagEnd)
    let afterSvg = content.substring(newSvgTagEnd)

    // If icon has both fill and stroke, we need to add explicit none values
    if (iconType === 'both') {
      const escapedFill = fillValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const escapedStroke = strokeValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

      // Process each element
      afterSvg = afterSvg.replace(/(<[^>]+>)/gi, (match) => {
        const hasFillMain = match.match(new RegExp(`fill\\s*=\\s*["']${escapedFill}["']`, 'i'))
        const hasStrokeMain = match.match(new RegExp(`stroke\\s*=\\s*["']${escapedStroke}["']`, 'i'))

        // If element has both fill and stroke of main color, remove both
        if (hasFillMain && hasStrokeMain) {
          let result = match
          result = result.replace(new RegExp(`\\s*fill\\s*=\\s*["']${escapedFill}["']`, 'gi'), '')
          result = result.replace(new RegExp(`\\s*stroke\\s*=\\s*["']${escapedStroke}["']`, 'gi'), '')
          return result
        }

        // If element has only fill of main color, remove fill and add stroke="none"
        if (hasFillMain && !hasStrokeMain) {
          // Don't remove fill if element has fill-opacity
          const hasFillOpacity = match.match(/fill-opacity\s*=/)
          if (hasFillOpacity) {
            // Keep fill, but still add stroke="none" if needed
            let result = match
            if (!match.match(/stroke\s*=/)) {
              const isSelfClosing = match.endsWith('/>')
              if (isSelfClosing) {
                result = result.replace(/\/>$/, ' stroke="none"/>')
              } else {
                result = result.replace(/>$/, ' stroke="none">')
              }
            }
            return result
          }

          let result = match.replace(new RegExp(`\\s*fill\\s*=\\s*["']${escapedFill}["']`, 'gi'), '')
          // Check if element already has any stroke attribute
          if (!match.match(/stroke\s*=/)) {
            const isSelfClosing = match.endsWith('/>')
            if (isSelfClosing) {
              result = result.replace(/\/>$/, ' stroke="none"/>')
            } else {
              result = result.replace(/>$/, ' stroke="none">')
            }
          }
          return result
        }

        // If element has only stroke of main color, remove stroke and add fill="none"
        if (hasStrokeMain && !hasFillMain) {
          // Don't remove stroke if element has stroke-opacity
          const hasStrokeOpacity = match.match(/stroke-opacity\s*=/)
          if (hasStrokeOpacity) {
            // Keep stroke, but still add fill="none" if needed
            let result = match
            if (!match.match(/fill\s*=/)) {
              const isSelfClosing = match.endsWith('/>')
              if (isSelfClosing) {
                result = result.replace(/\/>$/, ' fill="none"/>')
              } else {
                result = result.replace(/>$/, ' fill="none">')
              }
            }
            return result
          }

          let result = match.replace(new RegExp(`\\s*stroke\\s*=\\s*["']${escapedStroke}["']`, 'gi'), '')
          // Check if element already has any fill attribute
          if (!match.match(/fill\s*=/)) {
            const isSelfClosing = match.endsWith('/>')
            if (isSelfClosing) {
              result = result.replace(/\/>$/, ' fill="none"/>')
            } else {
              result = result.replace(/>$/, ' fill="none">')
            }
          }
          return result
        }

        // Element doesn't have main colors, but may need none attributes
        // If element has real fill color but no stroke, add stroke="none"
        // If element has real stroke color but no fill, add fill="none"
        let result = match
        const fillMatch = match.match(/fill\s*=\s*["']([^"']*)["']/)
        const strokeMatch = match.match(/stroke\s*=\s*["']([^"']*)["']/)
        const isSelfClosing = match.endsWith('/>')

        const hasRealFill = fillMatch && fillMatch[1] !== 'none' && fillMatch[1] !== 'transparent'
        const hasRealStroke = strokeMatch && strokeMatch[1] !== 'none' && strokeMatch[1] !== 'transparent'

        if (hasRealFill && !strokeMatch) {
          if (isSelfClosing) {
            result = result.replace(/\/>$/, ' stroke="none"/>')
          } else {
            result = result.replace(/>$/, ' stroke="none">')
          }
        }
        if (hasRealStroke && !fillMatch) {
          if (isSelfClosing) {
            result = result.replace(/\/>$/, ' fill="none"/>')
          } else {
            result = result.replace(/>$/, ' fill="none">')
          }
        }

        return result
      })
    } else {
      // Original logic for fill-only or stroke-only icons
      // For fill-only icons: remove fill values from child elements
      // For stroke-only icons: remove stroke values from child elements
      // But keep the opposite attribute (e.g. for stroke icons, keep fill colors in children)

      if (iconType === 'fill' && fillValue) {
        const escapedFill = fillValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        // Don't remove fill if element has fill-opacity
        afterSvg = afterSvg.replace(/(<[^>]+>)/gi, (match) => {
          const hasFillOpacity = match.match(/fill-opacity\s*=/)
          if (hasFillOpacity) {
            return match // Keep fill if element has fill-opacity
          }
          return match.replace(new RegExp(`\\sfill\\s*=\\s*["']${escapedFill}["']`, 'gi'), '')
        })
      }

      if (iconType === 'stroke' && strokeValue) {
        const escapedStroke = strokeValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        // Don't remove stroke if element has stroke-opacity
        afterSvg = afterSvg.replace(/(<[^>]+>)/gi, (match) => {
          const hasStrokeOpacity = match.match(/stroke-opacity\s*=/)
          if (hasStrokeOpacity) {
            return match // Keep stroke if element has stroke-opacity
          }
          return match.replace(new RegExp(`\\sstroke\\s*=\\s*["']${escapedStroke}["']`, 'gi'), '')
        })
      }

      // For stroke-only icons, add stroke="none" to elements with fill (but not fill="none")
      // For fill-only icons, add fill="none" to elements with stroke (but not stroke="none")
      afterSvg = afterSvg.replace(/(<[^>]+>)/gi, (match) => {
        const fillMatch = match.match(/fill\s*=\s*["']([^"']*)["']/)
        const strokeMatch = match.match(/stroke\s*=\s*["']([^"']*)["']/)
        const isSelfClosing = match.endsWith('/>')
        let result = match

        // Check if element has real fill color (not "none" or "transparent")
        const hasRealFill = fillMatch && fillMatch[1] !== 'none' && fillMatch[1] !== 'transparent'
        const hasRealStroke = strokeMatch && strokeMatch[1] !== 'none' && strokeMatch[1] !== 'transparent'

        if (iconType === 'stroke' && hasRealFill && !strokeMatch) {
          // Stroke-only icon: elements with real fill color need stroke="none"
          if (isSelfClosing) {
            result = result.replace(/\/>$/, ' stroke="none"/>')
          } else {
            result = result.replace(/>$/, ' stroke="none">')
          }
        }

        if (iconType === 'fill' && hasRealStroke && !fillMatch) {
          // Fill-only icon: elements with real stroke color need fill="none"
          if (isSelfClosing) {
            result = result.replace(/\/>$/, ' fill="none"/>')
          } else {
            result = result.replace(/>$/, ' fill="none">')
          }
        }

        return result
      })
    }

    // Reconstruct content
    content = beforeSvg + afterSvg

    // Clean up multiple spaces
    content = content.replace(/\s{2,}/g, ' ')
    content = content.replace(/\s+>/g, '>')
    content = content.replace(/>\s+</g, '><')

    // Remove unsupported elements for react-native-svg
    // Remove only filter from defs, but keep gradients and clipPath
    content = content.replace(/<filter[^>]*>[\s\S]*?<\/filter>/gi, '')

    // Remove empty defs blocks (defs that only had filter)
    content = content.replace(/<defs>\s*<\/defs>/gi, '')
    content = content.replace(/<defs\s*\/>/gi, '')

    // Remove filter attributes (but keep clip-path as it's supported)
    content = content.replace(/\sfilter="[^"]*"/gi, '')

    // Clean up again after removing defs
    content = content.replace(/\s{2,}/g, ' ')
    content = content.replace(/\s+>/g, '>')
    content = content.replace(/>\s+</g, '><')

    // Save updated file
    fs.writeFileSync(filePath, content, 'utf-8')
  }

  return { type: iconType, modified }
}

function findInDir(dir, filter, fileList = []) {
  const files = fs.readdirSync(dir)

  files.forEach((file) => {
    const filePath = p.join(dir, file)
    const fileStat = fs.lstatSync(filePath)

    if (fileStat.isDirectory()) {
      findInDir(filePath, filter, fileList)
    } else if (p.extname(filePath) === filter) {
      fileList.push(filePath)
    }
  })

  return fileList
}

// Main processing
const path = './assets/svg'

console.log('🔄 Processing SVG files...')
const icons = findInDir(path, '.svg')
const iconMetadata = new Map()
let modifiedCount = 0

for (const icon of icons) {
  const name = p.basename(icon, '.svg')
  // if (name !== "icLock24") continue
  const result = processSvgFile(icon)
  iconMetadata.set(name, result.type)
  if (result.modified) {
    modifiedCount++
    console.log(`  ✓ Modified: ${name} (type: ${result.type})`)
  }
}

console.log(`✅ Processed ${icons.length} icons, modified ${modifiedCount}`)

// Export metadata for use in generator
module.exports = { processSvgFile, iconMetadata }
