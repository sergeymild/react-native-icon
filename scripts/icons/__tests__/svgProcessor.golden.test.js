const fs = require('fs')
const os = require('os')
const path = require('path')
const { processSvgFile } = require('../svgProcessor')

const FIXTURES = path.join(__dirname, 'fixtures')

function processCopy(name) {
  const tmp = path.join(os.tmpdir(), `golden-${name}-${process.pid}.svg`)
  fs.copyFileSync(path.join(FIXTURES, name), tmp)
  const result = processSvgFile(tmp)
  const content = fs.readFileSync(tmp, 'utf-8')
  fs.unlinkSync(tmp)
  return { result, content }
}

describe('processSvgFile golden output', () => {
  for (const name of ['fill-icon.svg', 'stroke-icon.svg', 'both-icon.svg']) {
    it(`${name} matches snapshot`, () => {
      const { result, content } = processCopy(name)
      expect({ result, content }).toMatchSnapshot()
    })
  }
})
