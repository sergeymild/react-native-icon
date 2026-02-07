const p = require('path')
const fs = require('fs')
const { processSvgFile } = require('./svgProcessor')

const uniqueNames = new Set()
const iconMetadata = new Map() // Store metadata about each icon
function findInDir(dir, filter, fileList = []) {
  const files = fs.readdirSync(dir)

  files.forEach((file) => {
    const filePath = p.join(dir, file)
    const fileStat = fs.lstatSync(filePath)

    if (fileStat.isDirectory()) {
      findInDir(filePath, filter, fileList)
    } else if (p.extname(filePath) === filter) {
      const name = p.basename(filePath, filter)
      if (uniqueNames.has(name)) throw new Error(`file exists: ${name}`)

      uniqueNames.add(name)
      fileList.push(filePath)
    }
  })

  return fileList
}

const path = './assets/svg'
const requirePath = 'look-box/assets/svg'

const MODULE_NAME = '_rn-generated-icons'
const COMPONENT_NAME = 'AppIcon'

const outPath = `../node_modules/${MODULE_NAME}`
const outputPackagePath = `${outPath}/package.json`
const outputIndexPath = `${outPath}/index.ts`
console.log('⛱️ outpath', outPath)

const icons = findInDir(path, '.svg')
const fileName = `${outPath}/${COMPONENT_NAME}.tsx`

// Process all SVG files and store metadata
console.log('🔄 Processing SVG files...')
let modifiedCount = 0
for (const icon of icons) {
  const name = p.basename(icon, '.svg')
  const result = processSvgFile(icon)
  iconMetadata.set(name, result.type)
  if (result.modified) {
    modifiedCount++
    console.log(`  ✓ Modified: ${name} (type: ${result.type})`)
  }
}
console.log(`✅ Processed ${icons.length} icons, modified ${modifiedCount}`)

// Clean
fs.rmSync(outPath, { recursive: true, force: true })
fs.mkdirSync(outPath, { recursive: true })
// Prepare module
fs.writeFileSync(
  outputPackagePath,
  `{\n  "name": "${MODULE_NAME}",\n  "main": "index"\n}`,
  { encoding: 'utf-8' },
)
fs.writeFileSync(
  outputIndexPath,
  `import ${COMPONENT_NAME} from './${COMPONENT_NAME}'\n\nexport default ${COMPONENT_NAME}\nexport { ${COMPONENT_NAME}Props, ${COMPONENT_NAME}Type } from './${COMPONENT_NAME}'\n`,
  { encoding: 'utf-8' },
)

if (fs.existsSync(fileName)) fs.unlinkSync(fileName)

const logger = fs.createWriteStream(fileName)

logger.write(`/* eslint-disable */
import React, { forwardRef, memo } from 'react'
import {StyleProp, View, ViewStyle} from 'react-native'
`)

const iconNames = Array.from(uniqueNames.values())
const types = iconNames.map((c) => `'${c}'`).join(' | ')

for (const icon of icons) {
  const name = p.basename(icon, '.svg')
  let capitalized = name.charAt(0).toUpperCase() + name.slice(1)
  capitalized = capitalized
    .split('-')
    .map((c) => c.charAt(0).toUpperCase() + c.slice(1))
    .join('')

  const require = `./${icon}`.replace(path, requirePath)
  logger.write(`import ${capitalized} from '${require}'\n`)
}

logger.write(`
export type ${COMPONENT_NAME}Type = ${types}
export interface ${COMPONENT_NAME}Props {
  readonly type: ${COMPONENT_NAME}Type
  readonly testID?: string
  readonly nativeID?: string
  readonly style?: StyleProp<ViewStyle>
  readonly isVisible?: boolean
  readonly tint?: string
  readonly stroke?: string
  readonly color?: string
  readonly width?: number
  readonly height?: number
  readonly size?: number
}

// Icon metadata for determining fill vs stroke
const ICON_METADATA: Record<${COMPONENT_NAME}Type, 'fill' | 'stroke' | 'both'> = {
`)

// Write icon metadata
for (let iconName of iconNames) {
  const iconType = iconMetadata.get(iconName) || 'fill'
  logger.write(`  '${iconName}': '${iconType}',\n`)
}

logger.write(`}

const getIcon = (type: ${COMPONENT_NAME}Type, tint: string | undefined, stroke: string | undefined, color: string | undefined, width: number | undefined, height: number | undefined): JSX.Element => {
    switch (type) {
`)

for (let iconName of iconNames) {
  let capitalized = iconName.charAt(0).toUpperCase() + iconName.slice(1)
  capitalized = capitalized
    .split('-')
    .map((c) => c.charAt(0).toUpperCase() + c.slice(1))
    .join('')

  logger.write(`  case '${iconName}': {\n`)
  logger.write(`    const finalFill = (color && (ICON_METADATA[type] === 'fill' || ICON_METADATA[type] === 'both')) ? color : tint\n`)
  logger.write(`    const finalStroke = (color && (ICON_METADATA[type] === 'stroke' || ICON_METADATA[type] === 'both')) ? color : stroke\n`)
  logger.write(`    return <${capitalized} {...(finalFill && { fill: finalFill })} {...(finalStroke && { stroke: finalStroke })} {...(width && { width })} {...(height && { height })} />\n`)
  logger.write(`  }\n`)
}

logger.write(`  }
}

const ${COMPONENT_NAME} = ({ type, testID, nativeID, style, isVisible, tint, stroke, color, width, height, size }: ${COMPONENT_NAME}Props, ref) => {
  if (isVisible === false) return null
  if (size) {
    if (!width) width = size
    if (!height) height = size
  }
  return (
    <View ref={ref} accessibilityLabel={testID} nativeID={nativeID} pointerEvents={'none'} style={style}>
      {getIcon(type, tint, stroke, color, width, height)}
    </View>
  )
}
export default memo(forwardRef<View, ${COMPONENT_NAME}Props>(${COMPONENT_NAME}))
`)

logger.close()
