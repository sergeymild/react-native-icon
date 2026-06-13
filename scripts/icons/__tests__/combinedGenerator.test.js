const fs = require('fs')
const os = require('os')
const path = require('path')
const { execSync } = require('child_process')

const SCRIPTS_DIR = path.join(__dirname, '..')
const FIXTURES = path.join(__dirname, 'fixtures')

describe('combinedGenerator', () => {
  let projectDir
  let outDir

  beforeAll(() => {
    projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'icons-proj-'))
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'icons-out-'))
    // Copy SVG fixtures (use copies so the generator can mutate them).
    for (const f of ['fill-icon.svg', 'stroke-icon.svg']) {
      fs.copyFileSync(path.join(FIXTURES, f), path.join(projectDir, f))
    }
    execSync(`node "${path.join(SCRIPTS_DIR, 'combinedGenerator.js')}"`, {
      cwd: SCRIPTS_DIR,
      env: { ...process.env, ICONS_PROJECT_DIR: projectDir, ICONS_OUTPUT_DIR: outDir },
      stdio: 'pipe',
    })
  })

  it('emits AppIcon.tsx', () => {
    expect(fs.existsSync(path.join(outDir, 'AppIcon.tsx'))).toBe(true)
  })

  it('includes a union type and switch case per svg', () => {
    const out = fs.readFileSync(path.join(outDir, 'AppIcon.tsx'), 'utf-8')
    expect(out).toMatch(/export type AppIconType =/)
    expect(out).toMatch(/case 'fill_icon'/)
    expect(out).toMatch(/case 'stroke_icon'/)
  })

  it('records svgType metadata (fill vs stroke)', () => {
    const out = fs.readFileSync(path.join(outDir, 'AppIcon.tsx'), 'utf-8')
    expect(out).toMatch(/'fill_icon': \{ kind: 'svg', svgType: 'fill'/)
    expect(out).toMatch(/'stroke_icon': \{ kind: 'svg', svgType: 'stroke'/)
  })

  it('records intrinsic SVG dimensions from the viewBox', () => {
    const out = fs.readFileSync(path.join(outDir, 'AppIcon.tsx'), 'utf-8')
    // fixtures use viewBox="0 0 24 24"
    expect(out).toMatch(
      /'fill_icon': \{ kind: 'svg', svgType: 'fill', width: 24, height: 24 \}/
    )
  })
})
