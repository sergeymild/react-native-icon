#!/usr/bin/env node
const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const SCRIPTS_DIR = __dirname

// Parse command line arguments
const args = process.argv.slice(2)
let projectDir = null
let outputDir = null

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--project' || args[i] === '-p') {
    projectDir = args[i + 1]
    i++
  } else if (args[i] === '--output' || args[i] === '-o') {
    outputDir = args[i + 1]
    i++
  } else if (!projectDir) {
    // First positional argument is project directory
    projectDir = args[i]
  }
}

if (!projectDir) {
  console.error('Usage: node generate.js <project-folder> [--output <output-folder>]')
  console.error('')
  console.error('Arguments:')
  console.error('  <project-folder>    Path to project with SVG/image assets')
  console.error('  --output, -o        Output directory for generated files (default: react-native-icon/src/types)')
  console.error('')
  console.error('Example:')
  console.error('  node generate.js /path/to/my-app')
  console.error('  node generate.js /path/to/my-app --output /path/to/output')
  process.exit(1)
}

// Resolve paths
projectDir = path.resolve(projectDir)
if (!fs.existsSync(projectDir)) {
  console.error(`Error: Project directory not found: ${projectDir}`)
  process.exit(1)
}

// Default output to react-native-icon/src/types
const OUTPUT_DIR = outputDir ? path.resolve(outputDir) : path.resolve(SCRIPTS_DIR, '../../src/types')

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  console.log(`Created output directory: ${OUTPUT_DIR}`)
}

// Export config for child scripts
process.env.ICONS_OUTPUT_DIR = OUTPUT_DIR
process.env.ICONS_PROJECT_DIR = projectDir

console.log('='.repeat(50))
console.log('Starting icon generation...')
console.log(`Project directory: ${projectDir}`)
console.log(`Output directory: ${OUTPUT_DIR}`)
console.log('='.repeat(50))

// Run icons generator (SVG)
console.log('\n📦 Running SVG icons generator...\n')
try {
  execSync(`node "${path.join(SCRIPTS_DIR, 'iconsGenerator.js')}"`, {
    stdio: 'inherit',
    cwd: SCRIPTS_DIR,
    env: { ...process.env, ICONS_OUTPUT_DIR: OUTPUT_DIR }
  })
  console.log('\n✅ SVG icons generated successfully')
} catch (error) {
  console.error('\n❌ SVG icons generation failed:', error.message)
  process.exit(1)
}

// Run local image generator
console.log('\n📦 Running local image generator...\n')
try {
  execSync(`node "${path.join(SCRIPTS_DIR, 'local_image_generator.js')}"`, {
    stdio: 'inherit',
    cwd: SCRIPTS_DIR,
    env: { ...process.env, ICONS_OUTPUT_DIR: OUTPUT_DIR }
  })
  console.log('\n✅ Local images generated successfully')
} catch (error) {
  console.error('\n❌ Local images generation failed:', error.message)
  process.exit(1)
}

console.log('\n' + '='.repeat(50))
console.log('✨ All generators completed successfully!')
console.log('='.repeat(50))
