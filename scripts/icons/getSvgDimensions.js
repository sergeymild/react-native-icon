const fs = require('fs');
const parseString = require('xml2js').parseString;

function get(path, callback) {
  const attrToLowerCase = function (name) {
    return name.toLowerCase();
  };

  let height = null;
  let width = null;

  fs.readFile(path, { encoding: 'utf8' }, function (err, data) {
    if (err) return callback(err);
    parseString(
      data,
      { strict: false, attrkey: 'ATTR', attrNameProcessors: [attrToLowerCase] },
      function (err, result) {
        if (err) return callback(err);
        var hasWidthHeightAttr =
          result.SVG.ATTR.width && result.SVG.ATTR.height;
        if (hasWidthHeightAttr) {
          height = result.SVG.ATTR.height;
          width = result.SVG.ATTR.width;
        } else {
          width = result.SVG.ATTR.viewbox
            .toString()
            .replace(/^\d+\s\d+\s(\d+\.?\d+)\s(\d+\.?\d+)/, '$1');
          height = result.SVG.ATTR.viewbox
            .toString()
            .replace(/^\d+\s\d+\s(\d+\.?\d+)\s(\d+\.?\d+)/, '$2');
        }
        const w = parseFloat(width);
        const h = parseFloat(height);
        callback(null, { height: h, width: w });
      }
    );
  });
}

module.exports.getSvgDimensions = get;
