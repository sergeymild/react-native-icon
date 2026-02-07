const p = require('path')
const fs = require('fs')
const { imageSize } = require('image-size')
const { processSvgFile } = require('./svgProcessor')

const COMPONENT_NAME = 'AppIcon'
const SKIP_DIRS = ['node_modules', '.git', 'build', 'android', 'ios']
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg']

// Get project directory from environment or use current directory
const projectDir = process.env.ICONS_PROJECT_DIR || process.cwd()
const outPath = process.env.ICONS_OUTPUT_DIR || p.join(projectDir, 'src/types')

console.log('⛱️ Project dir:', projectDir)
console.log('⛱️ Output path:', outPath)

// Find files recursively
function findFiles(dir, extensions, fileList = [], uniqueNames = new Set()) {
  if (!fs.existsSync(dir)) return fileList

  const files = fs.readdirSync(dir)

  files.forEach((file) => {
    const filePath = p.join(dir, file)
    const fileStat = fs.lstatSync(filePath)

    if (fileStat.isDirectory()) {
      if (!SKIP_DIRS.includes(file)) {
        findFiles(filePath, extensions, fileList, uniqueNames)
      }
    } else {
      const ext = p.extname(file).toLowerCase()
      if (extensions.includes(ext)) {
        const name = p.basename(file, ext)
        if (uniqueNames.has(name)) {
          throw new Error(`Duplicate icon name: ${name}`)
        }
        uniqueNames.add(name)
        fileList.push({ path: filePath, name, ext })
      }
    }
  })

  return fileList
}

// Get image dimensions
function getImageDimensions(imagePath) {
  try {
    const buffer = fs.readFileSync(imagePath)
    const dimensions = imageSize(buffer)
    return { width: dimensions.width, height: dimensions.height }
  } catch (e) {
    console.warn(`Could not read dimensions for ${imagePath}:`, e.message)
    return { width: 0, height: 0 }
  }
}

// Convert name to PascalCase
function toPascalCase(name) {
  return name
    .split(/[-_]/)
    .map((c) => c.charAt(0).toUpperCase() + c.slice(1))
    .join('')
}

// Find all icons
const uniqueNames = new Set()
const svgFiles = findFiles(projectDir, ['.svg'], [], uniqueNames)
const imageFiles = findFiles(projectDir, IMAGE_EXTENSIONS, [], uniqueNames)

console.log(`Found ${svgFiles.length} SVG files`)
console.log(`Found ${imageFiles.length} image files`)

if (svgFiles.length === 0 && imageFiles.length === 0) {
  console.log('No icons found, skipping generation')
  process.exit(0)
}

// Process SVG files
console.log('🔄 Processing SVG files...')
const svgMetadata = new Map()
let modifiedCount = 0

for (const svg of svgFiles) {
  const result = processSvgFile(svg.path)
  svgMetadata.set(svg.name, result.type)
  if (result.modified) {
    modifiedCount++
    console.log(`  ✓ Modified: ${svg.name} (type: ${result.type})`)
  }
}
console.log(`✅ Processed ${svgFiles.length} SVG icons, modified ${modifiedCount}`)

// Process image files
console.log('🔄 Processing image files...')
const imageMetadata = new Map()

for (const img of imageFiles) {
  const dims = getImageDimensions(img.path)
  imageMetadata.set(img.name, dims)
  console.log(`  ✓ ${img.name} (${dims.width}x${dims.height})`)
}
console.log(`✅ Processed ${imageFiles.length} image files`)

// Ensure output directory exists
if (!fs.existsSync(outPath)) {
  fs.mkdirSync(outPath, { recursive: true })
}

const fileName = p.join(outPath, `${COMPONENT_NAME}.tsx`)
if (fs.existsSync(fileName)) fs.unlinkSync(fileName)

const logger = fs.createWriteStream(fileName)

// Write imports
logger.write(`/* eslint-disable */
import React, { forwardRef, memo } from 'react'
import { Image, ImageStyle, StyleProp, View, ViewStyle } from 'react-native'
`)

// Import SVG components
for (const svg of svgFiles) {
  const componentName = toPascalCase(svg.name)
  let relativePath = p.relative(outPath, svg.path)
  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath
  }
  logger.write(`import ${componentName} from '${relativePath}'\n`)
}

// All icon names
const allNames = [...svgFiles.map(s => s.name), ...imageFiles.map(i => i.name)].sort()
const types = allNames.map((c) => `'${c}'`).join(' | ')

logger.write(`
export type ${COMPONENT_NAME}Type = ${types}

export interface ${COMPONENT_NAME}Props {
  readonly type: ${COMPONENT_NAME}Type
  readonly testID?: string
  readonly nativeID?: string
  readonly style?: StyleProp<ViewStyle>
  readonly containerStyle?: StyleProp<ViewStyle>
  readonly isVisible?: boolean
  readonly tint?: string
  readonly stroke?: string
  readonly color?: string
  readonly width?: number
  readonly height?: number
  readonly size?: number
}

// Icon kind: 'svg' or 'image'
type IconKind = 'svg' | 'image'

// SVG icon metadata for determining fill vs stroke
type SvgColorType = 'fill' | 'stroke' | 'both'

interface IconMeta {
  kind: IconKind
  svgType?: SvgColorType
  width?: number
  height?: number
}

const ICON_META: Record<${COMPONENT_NAME}Type, IconMeta> = {
`)

// Write SVG metadata
for (const svg of svgFiles) {
  const svgType = svgMetadata.get(svg.name) || 'fill'
  logger.write(`  '${svg.name}': { kind: 'svg', svgType: '${svgType}' },\n`)
}

// Write image metadata
for (const img of imageFiles) {
  const dims = imageMetadata.get(img.name)
  logger.write(`  '${img.name}': { kind: 'image', width: ${dims.width}, height: ${dims.height} },\n`)
}

logger.write(`}

// Image sources
const IMAGE_SOURCES: Partial<Record<${COMPONENT_NAME}Type, any>> = {
`)

// Write image requires
for (const img of imageFiles) {
  let relativePath = p.relative(outPath, img.path)
  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath
  }
  logger.write(`  '${img.name}': require('${relativePath}'),\n`)
}

logger.write(`}

const getSvgIcon = (
  type: ${COMPONENT_NAME}Type,
  tint: string | undefined,
  stroke: string | undefined,
  color: string | undefined,
  width: number | undefined,
  height: number | undefined,
  style: StyleProp<ViewStyle> | undefined
): JSX.Element | null => {
  const meta = ICON_META[type]
  if (meta.kind !== 'svg') return null

  const finalFill = (color && (meta.svgType === 'fill' || meta.svgType === 'both')) ? color : tint
  const finalStroke = (color && (meta.svgType === 'stroke' || meta.svgType === 'both')) ? color : stroke

  const props = {
    ...(finalFill && { fill: finalFill }),
    ...(finalStroke && { stroke: finalStroke }),
    ...(width && { width }),
    ...(height && { height }),
    ...(style && { style }),
  }

  switch (type) {
`)

// Write SVG switch cases
for (const svg of svgFiles) {
  const componentName = toPascalCase(svg.name)
  logger.write(`    case '${svg.name}': return <${componentName} {...props} />\n`)
}

logger.write(`    default: return null
  }
}

const ${COMPONENT_NAME} = (
  { type, testID, nativeID, style, containerStyle, isVisible, tint, stroke, color, width, height, size }: ${COMPONENT_NAME}Props,
  ref: React.Ref<View>
) => {
  if (isVisible === false) return null

  if (size) {
    if (!width) width = size
    if (!height) height = size
  }

  const meta = ICON_META[type]

  let content: JSX.Element | null = null

  if (meta.kind === 'svg') {
    content = getSvgIcon(type, tint, stroke, color, width, height, style)
  } else {
    // Raster image
    const source = IMAGE_SOURCES[type]
    const imgWidth = width ?? meta.width ?? 24
    const imgHeight = height ?? meta.height ?? 24

    content = (
      <Image
        source={source}
        style={[{ width: imgWidth, height: imgHeight, tintColor: color || tint }, style as ImageStyle]}
        resizeMode="contain"
      />
    )
  }

  return (
    <View ref={ref} accessibilityLabel={testID} nativeID={nativeID} pointerEvents="none" style={containerStyle}>
      {content}
    </View>
  )
}

export default memo(forwardRef<View, ${COMPONENT_NAME}Props>(${COMPONENT_NAME}))
`)

logger.close()

console.log(`\n✅ Generated ${fileName}`)
console.log(`   - ${svgFiles.length} SVG icons`)
console.log(`   - ${imageFiles.length} image icons`)