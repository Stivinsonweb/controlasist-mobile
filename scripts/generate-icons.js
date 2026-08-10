// Regenera los PNG del manifest (public/icons/icon-*.png) y el favicon a partir de los SVG
// fuente en public/icons/logo.svg (versión "any", esquinas redondeadas) y
// public/icons/logo-maskable.svg (fondo a sangre completa, sin esquinas transparentes,
// pensado para que el SO le aplique su propia máscara sin artefactos).
// Uso: node scripts/generate-icons.js
const fs = require('fs');
const path = require('path');
const os = require('os');
const sharp = require('sharp');
const pngToIco = require('png-to-ico').default;

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');
const LOGO_SVG = path.join(ICONS_DIR, 'logo.svg');
const LOGO_MASKABLE_SVG = path.join(ICONS_DIR, 'logo-maskable.svg');

const SIZES = [72, 96, 128, 144, 192, 512];
const MASKABLE_SIZES = [192, 512];

async function renderPng(svgPath, size, outPath) {
  await sharp(svgPath, { density: 384 }).resize(size, size).png().toFile(outPath);
  console.log(`  ${path.relative(process.cwd(), outPath)} (${size}x${size})`);
}

async function main() {
  console.log('Generando íconos "any" desde logo.svg:');
  for (const size of SIZES) {
    await renderPng(LOGO_SVG, size, path.join(ICONS_DIR, `icon-${size}.png`));
  }

  console.log('Generando íconos "maskable" desde logo-maskable.svg:');
  for (const size of MASKABLE_SIZES) {
    await renderPng(LOGO_MASKABLE_SVG, size, path.join(ICONS_DIR, `icon-${size}-maskable.png`));
  }

  console.log('Generando favicon.ico (16/32/48) desde logo.svg:');
  const faviconSizes = [16, 32, 48];
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'controlasist-favicon-'));
  const tmpFiles = [];
  for (const size of faviconSizes) {
    const tmpFile = path.join(tmpDir, `favicon-${size}.png`);
    await sharp(LOGO_SVG, { density: 384 }).resize(size, size).png().toFile(tmpFile);
    tmpFiles.push(tmpFile);
  }
  const icoBuffer = await pngToIco(tmpFiles);
  const faviconPath = path.join(__dirname, '..', 'public', 'favicon.ico');
  fs.writeFileSync(faviconPath, icoBuffer);
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log(`  ${path.relative(process.cwd(), faviconPath)}`);

  console.log('Listo.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
