// @flow
// vim: set ft=javascript.flow:

import React from 'react';

import s from './Root.module.css';

const { Suspense, useState, useCallback, useMemo } = React;

// 4b0082
function retrieveSearchColorFromUrl() {
  // const search = window.location.search;
  // const pat = /c=(\w{6})/;
  // const cap = pat.exec(search);
  // return cap && cap[1];
  const hash = window.location.hash;
  return hash && hash.replace(/^#/, '');
}

function updateUrl(v) {
  // window.history.pushState('', '', '/?c=' + v);
  window.history.pushState(v, '', '#' + v);
}

const StyleGirdContentCentered = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, 200px)',
  justifyContent: 'center'
};
const StyleFlexWrap = { display: 'flex', flexWrap: 'wrap' };

const initialSearchColor = retrieveSearchColorFromUrl() || '';

// const colorObjRes = createResource(() => {
// return Promise.all([
//   fetch('/json/nike.en.json').then(x => x.json()),
//   fetch('/json/nike.zh.json').then(x => x.json()),
//   fetch('/json/css.en.json').then(x => x.json())
// ]);
// });

function ColorInput({ onChange, value }) {
  const [v, setV] = useState(value);
  const [errmsg, setErrmsg] = useState('');
  const onChangeInternal = useCallback(
    e => {
      const v = e.target.value.trim();
      setV(v);
      errmsg && setErrmsg('');

      if (v.length === 6) {
        if (/^[0-9a-fA-F]{6}$/.test(v)) {
          onChange(v);
        } else if (!errmsg) {
          setErrmsg('This is not a valid color');
        }
      }
    },
    [setV, errmsg, setErrmsg, onChange]
  );
  const onKeyDown = useCallback(
    e => {
      if (e.key !== 'Enter') return;
      if (/^[0-9a-fA-F]{6}$/.test(v)) {
        onChange(v);
      } else if (!errmsg) {
        setErrmsg('This is not a valid color');
      }
    },
    [v, setErrmsg, errmsg, onChange]
  );

  return (
    <div className={s.ColorInput}>
      <div
        className={s.inputContainer}
        style={{
          borderColor: errmsg ? 'tomato' : '#ccc'
        }}
      >
        <span style={{ color: '#757575' }}>#</span>
        <input
          className={s.input}
          type="text"
          value={v}
          spellCheck={false}
          maxLength="6"
          onChange={onChangeInternal}
          onKeyDown={onKeyDown}
          placeholder="Type in color hex to find it's name"
        />
      </div>
      <div
        className={s.inputMessage}
        style={{
          color: errmsg ? 'tomato' : '#ccc'
        }}
      >
        {errmsg}
      </div>
    </div>
  );
}

function Header({ text, children, sticky }) {
  const sty = {
    backgroundColor: 'rgba(255,255,255,0.6)',
    padding: '10px 0 10px 15px'
  };
  if (sticky) {
    sty.top = 0;
    sty.position = 'sticky';
  }
  return <h2 style={sty}>{text || children}</h2>;
}

function getColors() {
  const [colorObj, zh, colorObjCSS] = window.__data__;
  // const [colorObj, zh, colorObjCSS] = colorObjRes.read();

  const x = populateColorObj(colorObj);
  const colors = sortColor(x);

  const xCSS = populateColorObj(colorObjCSS);
  const colorsCSS = sortColor(xCSS);

  return [colors, zh, colorsCSS];
}

function ColorMatchAndList() {
  const [colors, zh, colorsCSS] = useMemo(getColors, []);
  const [searchColor, setSearchColor] = useState(initialSearchColor);
  const onColorInputChange = useCallback(
    v => {
      if (/^\w{6}$/.test(v)) {
        setSearchColor(v);
        // side effect
        updateUrl(v);
      }
    },
    [setSearchColor]
  );

  const matched = searchColor ? findSimilarColor(searchColor, colors) : null;
  const matchedCSS = searchColor
    ? findSimilarColor(searchColor, colorsCSS)
    : null;

  return (
    <>
      <section style={{ margin: '20px 0' }}>
        <ColorInput value={searchColor} onChange={onColorInputChange} />
      </section>
      {searchColor ? (
        <>
          <Header>Input color</Header>
          <div style={StyleFlexWrap}>
            <ColorMatchHead search={searchColor} />
          </div>
          {matched || matchedCSS ? (
            <>
              <Header>Similars</Header>
              <div style={StyleFlexWrap}>
                <ColorMatch
                  name={'Nike Product Named Color'}
                  matched={matched}
                  zh={zh}
                />
                <ColorMatch name={'CSS Named Color'} matched={matchedCSS} />
              </div>
            </>
          ) : (
            <p
              style={{
                margin: '30px 0',
                fontSize: '1.5em',
                color: '#777',
                textAlign: 'center'
              }}
            >
              Similar color not found
            </p>
          )}
        </>
      ) : null}
      <section>
        <Header sticky>CSS Named Colors</Header>
        <ColorList colors={colorsCSS} />
      </section>
      <section>
        <Header sticky>Nike Product Named Colors</Header>
        <ColorList colors={colors} zh={zh} />
      </section>
    </>
  );
}

function textArrayToReactNode(items) {
  const ret = [];
  for (let i = 0, len = items.length; i < len; i++) {
    const item = items[i];
    if (item) ret.push(<span key={i}>{item}</span>);
  }
  return ret;
}

function ColorMatchHead({ search } = {}) {
  const c = populateColorItem(search);
  const color = getFrontColor(c);
  return (
    <div>
      <div
        className={s.colorItem}
        style={{
          backgroundColor: '#' + search,
          color
        }}
      >
        {textArrayToReactNode([`#${search}`])}
      </div>
    </div>
  );
}

function ColorMatch({ name, matched, zh }) {
  const color = getFrontColor(matched);
  return matched ? (
    <div
      className={s.colorItem}
      style={{
        backgroundColor: '#' + matched.k,
        color
      }}
    >
      {textArrayToReactNode([
        `#${matched.k}`,
        matched.n,
        zh && zh[matched.k],
        <small>{name}</small>
      ])}
    </div>
  ) : null;
}

function ColorList({ colors, zh }) {
  return (
    <div
      style={
        StyleGirdContentCentered
        // display: 'flex',
        // flexWrap: 'wrap'
      }
    >
      {colors.map(c => {
        const color = getFrontColor(c);
        const { k } = c;
        return (
          <div
            className={s.colorItem}
            key={c.k}
            style={{
              backgroundColor: '#' + k,
              color
            }}
          >
            {textArrayToReactNode([`#${k}`, c.n, zh && zh[k]])}
          </div>
        );
      })}
    </div>
  );
}

const { abs } = Math;
// tr/tg/tb/ta - tolerance red, green blue, all
function filterColors({ r, g, b }, { tr, tg, tb, ta }, list) {
  let ret = [];
  for (const v of list) {
    // dr/dg/db - distance rgb
    let dr = abs(v.r - r);
    let dg = abs(v.g - g);
    let db = abs(v.b - b);
    if (dr < tr && dg < tg && db < tb && dr + dg + db < ta) {
      ret.push(v);
    }
  }
  return ret;
}

function calcColorDistance(a, b) {
  const x = a.r - b.r;
  const y = a.g - b.g;
  const z = a.b - b.b;
  return x * x + y * y + z * z;
}

type Rgb = { r: number, g: number, b: number };

function findTheColor(t: Rgb, list) {
  let d0 = Infinity;
  let c0;
  for (const v of list) {
    const d = calcColorDistance(v, t);
    if (d < d0) {
      d0 = d;
      c0 = v;
    }
  }
  return c0;
}

// 3 10 1
function findSimilarColor(target, list) {
  if (!target) return;

  const targetRgb = hexToRgb(target);
  const s1 = filterColors(targetRgb, { tr: 20, tg: 17, tb: 26, ta: 30 }, list);
  const x = findTheColor(targetRgb, s1);
  return x;
  // const y = 2126 * r + 7152 * g + 722 * b;
}

type ColorItemPopulated = {
  n: string, // name
  k: string, // the 6 digits hex without leading '#'
  r: number, // red value in rgb space
  g: number, // green value in rgb space
  b: number, // blue value in rgb space
  rl: number // relative luminance
};

function populateColorItem(k: string, name: string): ColorItemPopulated {
  let { r, g, b } = hexToRgb(k);
  const rl = getRelativeLuminance({ r, g, b });
  return { n: name, k, r, g, b, rl };
}

// feature check Object.entries
function populateColorObj(o) {
  const collect = {};
  for (const [k, name] of Object.entries(o)) {
    if (k === 'undefined') continue;
    collect[k] = populateColorItem(k, name);
  }
  return collect;
}

function sortColor(o): Array<ColorItemPopulated> {
  return sortByRed(o);
}

function sortByRed(o): Array<ColorItemPopulated> {
  const v = Object.values(o);
  return v.sort((a, b) => {
    const ax = a.r - a.g - a.b;
    const bx = b.r - b.g - b.b;
    return bx - ax;
  });
}

// eslint-disable-next-line no-unused-vars
function sortByLuminance(o): Array<ColorItemPopulated> {
  const v = Object.values(o);
  return v.sort((a, b) => a.rl - b.rl);
}

function isColorItemBright(c) {
  return c && c.rl > 128e4;
}

function getFrontColor(bg: ColorItemPopulated) {
  return isColorItemBright(bg) ? 'black' : 'white';
}

// v: hex without the leading '#'
function hexToRgb(v) {
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return { r, g, b };
}
function getRelativeLuminance({ r, g, b }) {
  const y = 2126 * r + 7152 * g + 722 * b;
  return y;
}

export default function Home() {
  return (
    <Suspense fallback={'loading'}>
      <ColorMatchAndList />
    </Suspense>
  );
}
