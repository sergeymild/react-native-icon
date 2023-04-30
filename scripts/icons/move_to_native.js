const p = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const SVGtoPDF = require('svg-to-pdfkit');
const svg2vectordrawable = require('svg2vectordrawable');
const svgDim = require('svg-dimensions');

const imagesIOSParentPath = p.resolve(
  __dirname,
  '../../ios/IconImages.xcassets'
);
const imagesAndroidVectorPath = p.resolve(
  __dirname,
  '../../android/src/main/res/drawable'
);
const imagesAndroidRasterPath = p.resolve(
  __dirname,
  '../../android/src/main/res/drawable-xxxhdpi'
);
const iconsTypeFilePath = p.resolve(__dirname, '../../src/types.ts');

if (fs.existsSync(iconsTypeFilePath)) fs.unlinkSync(iconsTypeFilePath);
if (fs.existsSync(imagesAndroidVectorPath))
  fs.rmSync(imagesAndroidVectorPath, { recursive: true, force: true });
if (fs.existsSync(imagesAndroidRasterPath))
  fs.rmSync(imagesAndroidRasterPath, { recursive: true, force: true });
fs.mkdirSync(imagesAndroidVectorPath, { recursive: true });
fs.mkdirSync(imagesAndroidRasterPath, { recursive: true });

const typesWriterStream = fs.createWriteStream(iconsTypeFilePath);

const filesToRemove = fs.readdirSync(imagesIOSParentPath);
for (let name of filesToRemove) {
  if (name.endsWith('.imageset')) {
    fs.rmSync(`${imagesIOSParentPath}/${name}`, {
      recursive: true,
      force: true,
    });
  }
}

function findInDir(dir, filter, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = p.join(dir, file);
    const fileStat = fs.lstatSync(filePath);

    if (fileStat.isDirectory()) {
      findInDir(filePath, filter, fileList);
    } else if (filter.includes(p.extname(filePath))) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function camelToSnake(str) {
  return str.replace(/[A-Z]/g, (c) => {
    return '_' + c.toLowerCase();
  });
}
function name(filename) {
  return camelToSnake(filename);
}

function getDimensions(svgPath) {
  return new Promise((resolve) => {
    svgDim.get(svgPath, (err, dimensions) => resolve(dimensions));
  });
}

function writeContentsFile(path, filename, extension) {
  // "properties" : {"template-rendering-intent" : "template"}
  fs.writeFileSync(
    path,
    JSON.stringify({
      images: [{ filename: `${filename}${extension}`, idiom: 'universal' }],
      info: { author: 'xcode', version: 1 },
    })
  );
}

function createIOSRasterIcon(path) {
  return new Promise(async (resolve) => {
    const filename = name(p.basename(path, p.extname(path)));
    const fileResultFolder = `${imagesIOSParentPath}/${filename}.imageset`;
    const fileResultPath = `${imagesIOSParentPath}/${filename}.imageset/${filename}${p.extname(
      path
    )}`;
    const fileContentsPath = `${imagesIOSParentPath}/${filename}.imageset/Contents.json`;
    fs.mkdirSync(fileResultFolder);
    fs.copyFileSync(path, fileResultPath);
    writeContentsFile(fileContentsPath, filename, p.extname(path));
    resolve();
  });
}

function createAndroidRasterIcon(path) {
  return new Promise(async (resolve) => {
    const filename = name(p.basename(path, p.extname(path)));
    fs.copyFileSync(
      path,
      `${imagesAndroidRasterPath}/${filename}${p.extname(path)}`
    );
    resolve();
  });
}

function createPdfFromSvg(svgPath) {
  return new Promise(async (resolve) => {
    const filename = name(p.basename(svgPath, p.extname(svgPath)));
    const fileResultFolder = `${imagesIOSParentPath}/${filename}.imageset`;
    const fileResultPath = `${imagesIOSParentPath}/${filename}.imageset/${filename}.pdf`;
    const fileContentsPath = `${imagesIOSParentPath}/${filename}.imageset/Contents.json`;

    fs.mkdirSync(fileResultFolder);

    const dimensions = await getDimensions(svgPath);

    const doc = new PDFDocument({
      size: [dimensions.width, dimensions.height],
    });
    const stream = fs.createWriteStream(fileResultPath);
    const svg = fs.readFileSync(svgPath).toString();
    SVGtoPDF(doc, svg, 0, 0, { assumePt: true, ...dimensions });
    stream.on('finish', () => {
      writeContentsFile(fileContentsPath, filename, '.pdf');
      resolve();
    });
    doc.pipe(stream);
    doc.end();
  });
}

function createXmlFromSvg(svgPath) {
  return new Promise(async (resolve) => {
    const filename = name(p.basename(svgPath, p.extname(svgPath)));
    const xmlCode = await svg2vectordrawable(fs.readFileSync(svgPath));
    fs.writeFileSync(`${imagesAndroidVectorPath}/${filename}.xml`, xmlCode);
  });
}

const args = process.argv.slice(2);
const parts = args[0].split('=');
if (parts[0] === 'assets') {
  const types = [];
  const icons = findInDir(parts[1], ['.svg', '.jpg', '.png']);
  for (const iconPath of icons) {
    const ext = p.extname(iconPath);
    types.push(p.basename(iconPath, ext));
    if (ext === '.svg') {
      createPdfFromSvg(iconPath);
      createXmlFromSvg(iconPath);
    } else if (['.jpg', '.png'].includes(ext)) {
      createIOSRasterIcon(iconPath);
      createAndroidRasterIcon(iconPath);
    }
  }

  typesWriterStream.write(
    `export type AppIconType = ${types.map((c) => `'${name(c)}'`).join(' | ')}`
  );
}
