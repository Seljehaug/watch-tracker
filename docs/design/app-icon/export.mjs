// Exports the app icons and the favicon from the SVGs in this folder, in the theme's colours.
// Run after changing an SVG or the colour tokens. Chrome draws the PNGs, so it must be installed.
//   node docs/design/app-icon/export.mjs   (from the repo root)
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const chromePath =
  process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const root = join(import.meta.dirname, '../../..');
const publicDir = join(root, 'public');

// The icons use two colours, read from the tokens so they follow the theme.
const tokens = readFileSync(join(root, 'src/styles/_tokens.scss'), 'utf8');
const token = (name) => tokens.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i'))[1];
const themeStyle = `<style>:root { --color-accent: ${token('color-accent')}; --color-background: ${token('color-background')}; }</style>`;
const themedSvg = (file) =>
  readFileSync(join(import.meta.dirname, file), 'utf8').replace(
    /<svg[^>]*>/,
    `$&\n  ${themeStyle}`,
  );

const work = mkdtempSync(join(tmpdir(), 'app-icon-'));
const chrome = spawn(chromePath, [
  '--headless',
  '--remote-debugging-port=0',
  `--user-data-dir=${join(work, 'profile')}`,
  'about:blank',
]);
const browserUrl = await new Promise((resolve) =>
  chrome.stderr.on('data', (data) => {
    const match = String(data).match(/ws:\/\/\S+/);
    if (match) resolve(match[0]);
  }),
);
const targets = await (
  await fetch(`http://127.0.0.1:${new URL(browserUrl).port}/json/list`)
).json();
const socket = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl);
await new Promise((resolve) => socket.addEventListener('open', resolve));

let lastId = 0;
const pending = new Map();
let onLoad = () => {};
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id) pending.get(message.id)(message.result);
  if (message.method === 'Page.loadEventFired') onLoad();
});
const send = (method, params = {}) =>
  new Promise((resolve) => {
    pending.set(++lastId, resolve);
    socket.send(JSON.stringify({ id: lastId, method, params }));
  });

await send('Page.enable');
await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });

// Renders an SVG at exactly size × size pixels, with a transparent background.
async function renderPng(file, size) {
  const svgPath = join(work, file);
  writeFileSync(svgPath, themedSvg(file));
  await send('Emulation.setDeviceMetricsOverride', {
    width: size,
    height: size,
    deviceScaleFactor: 1,
    mobile: false,
  });
  const loaded = new Promise((resolve) => (onLoad = resolve));
  await send('Page.navigate', { url: `file://${svgPath}` });
  await loaded;
  const { data } = await send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: size, height: size, scale: 1 },
  });
  return Buffer.from(data, 'base64');
}

// An ICO file holding PNG images, which every current browser reads.
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, png }, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size, entry);
    header.writeUInt8(size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images.map(({ png }) => png)]);
}

mkdirSync(join(publicDir, 'icons'), { recursive: true });
for (const [file, size, out] of [
  ['app-icon-rounded.svg', 192, 'icons/app-icon-rounded-192.png'],
  ['app-icon-rounded.svg', 512, 'icons/app-icon-rounded-512.png'],
  ['app-icon-square.svg', 192, 'icons/app-icon-square-192.png'],
  ['app-icon-square.svg', 512, 'icons/app-icon-square-512.png'],
  ['app-icon-apple.svg', 180, 'apple-touch-icon.png'],
]) {
  writeFileSync(join(publicDir, out), await renderPng(file, size));
}

const favicons = [];
for (const size of [16, 32, 48]) {
  favicons.push({ size, png: await renderPng('favicon.svg', size) });
}
writeFileSync(join(publicDir, 'favicon.ico'), ico(favicons));
writeFileSync(join(publicDir, 'favicon.svg'), themedSvg('favicon.svg'));

socket.close();
chrome.kill();
console.log('Exported the icons and the favicon to public/.');
