'use strict';

// https://drafts.csswg.org/css-color/#named-colors

const fs = require('fs');
const path = require('path');
const util = require('util');

const colors = require('color-name');

const writeFile = util.promisify(fs.writeFile);

const f = path.resolve(__dirname, '../assets/css.en.json');

function toTwoByteHex(x) {
  const r = x.toString(16);
  if (r.length < 2) {
    return '0' + r;
  }
  return r;
}

async function main() {
  const keys = Object.keys(colors);
  const collect = {};
  for (const k of keys) {
    const v = colors[k];
    const hex = v.map(toTwoByteHex).join('');
    collect[hex] = k;
  }

  await writeFile(f, JSON.stringify(collect, null, 2), 'utf8');
}

main();
