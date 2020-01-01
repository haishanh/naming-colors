'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');

const debug = require('debug')('app:nike');
const fetch = require('node-fetch');
const program = require('commander');
const { get } = require('dot-prop');
const chalk = require('chalk');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const sleep = t => new Promise(r => setTimeout(r, t));

// https://api.nike.com/product_feed/threads/v2?filter=channelId(d9a5bc42-4b9c-4976-858a-f159cf99c647)&filter=marketplace(CN)&filter=language(zh-Hans)&count=3&anchor=20

// marketplace language
// CN          zh-Hans
// US          en
async function fetchProducts(
  { count = 5, anchor = 0, marketplace = 'US', language = 'en' } = {},
  m
) {
  const url = `https://api.nike.com/product_feed/threads/v2?filter=channelId(d9a5bc42-4b9c-4976-858a-f159cf99c647)&filter=marketplace(${marketplace})&filter=language(${language})&count=${count}&anchor=${anchor}`;
  const res = await fetch(url);
  const json = await res.json();
  const objects = get(json, 'objects', []);
  let i;
  let j;
  for (i = 0; i < objects.length; i++) {
    const o = objects[i];
    const productInfo = get(o, 'productInfo', []);
    for (j = 0; j < productInfo.length; j++) {
      const info = productInfo[j];
      // console.log(info.productContent.globalPid);
      // const gpid = get(info, 'productContent.globalPid', '');
      const colors = get(info, 'productContent.colors', []);
      // debug('gpid %s', gpid);
      for (const color of colors) {
        const { name, hex: h } = color;
        if (!h) continue;
        const hex = h.toLowerCase();
        if (!m.has(hex)) {
          debug('%s %s', hex, name);
          // eslint-disable-next-line no-console
          console.log(chalk.hex('#' + hex)(name));
          m.set(hex, name);
        }
      }
    }
  }
  return objects.length;
}

async function readExisting(f) {
  try {
    const x = await readFile(f, 'utf8');
    const o = JSON.parse(x);
    return new Map(Object.entries(o));
  } catch (err) {
    return new Map();
  }
}

async function dumpToFile(f, m) {
  const collect = Object.fromEntries(m);
  await writeFile(f, JSON.stringify(collect, null, 2), 'utf8');
}

const apiParmasForLang = {
  en: {
    marketplace: 'US',
    language: 'en'
  },
  zh: {
    marketplace: 'CN',
    language: 'zh-Hans'
  }
};
async function main({ start, limit, lang }) {
  const f = path.resolve(__dirname, `../assets/nike.${lang}.json`);
  const apiParmas = apiParmasForLang[lang];

  const m = await readExisting(f);
  const startSize = m.size;

  async function handle(_signal) {
    // eslint-disable-next-line no-console
    console.log('anchor', anchor);
    debug('dumping to %s', f);
    await dumpToFile(f, m);
    process.exit(0);
  }
  process.on('SIGINT', handle);

  // const limit = 100;

  // const limit = 100e3;
  let anchor = start;

  const batchCount = 20;
  while (anchor < limit) {
    // timestart timeend
    const ts = new Date();
    const len = await fetchProducts(
      { anchor, count: batchCount, ...apiParmas },
      m
    );
    debug('fetched anchor=%s in %s', anchor, new Date() - ts);
    await sleep(1);
    anchor += len;
    if (len < batchCount) break;
  }

  // eslint-disable-next-line no-console
  console.log('total', m.size);
  // eslint-disable-next-line no-console
  console.log('new  ', m.size - startSize);

  // const collect = {};
  // for (const [hex, name] of m) {
  //   collect[hex] = name;
  //   debug('%s %s', hex, name);
  // }
  await dumpToFile(f, m);
}

program
  .option(
    '-s, --start <number>',
    'index which the API pagination start from',
    parseInt
  )
  .option('-l, --limit <number>', 'total product items to fetch', parseInt)
  .option('-g, --lang <lang>', 'language en|zh');
program.parse(process.argv);
const { start = 0, limit = 100e3, lang = 'en' } = program.opts();
if (lang !== 'en' && lang !== 'zh') {
  // eslint-disable-next-line no-console
  console.error('lang can only be zh or en');
  process.exit(1);
}
const opts = { start, limit, lang };
main(opts);
