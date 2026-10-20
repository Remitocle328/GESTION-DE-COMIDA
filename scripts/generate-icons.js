import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateIcons() {
  const svgBuffer = fs.readFileSync('public/icon.svg');

  // 1. 192x192 PNG
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile('public/pwa-192x192.png');
  console.log('Created public/pwa-192x192.png');

  // 2. 512x512 PNG
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('public/pwa-512x512.png');
  console.log('Created public/pwa-512x512.png');

  // 3. Apple Touch Icon 180x180 with indigo rounded/solid background
  const appleInner = await sharp(svgBuffer)
    .resize(140, 140)
    .toBuffer();

  await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 79, g: 70, b: 229, alpha: 1 } // #4f46e5
    }
  })
    .composite([{ input: appleInner, gravity: 'center' }])
    .png()
    .toFile('public/apple-touch-icon.png');
  console.log('Created public/apple-touch-icon.png');

  // 4. Maskable 512x512 with safe-zone padding (80% safe zone = 400x400 inner icon with 56px margin all around)
  const maskableInner = await sharp(svgBuffer)
    .resize(380, 380)
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 79, g: 70, b: 229, alpha: 1 } // #4f46e5
    }
  })
    .composite([{ input: maskableInner, gravity: 'center' }])
    .png()
    .toFile('public/pwa-maskable-512x512.png');
  console.log('Created public/pwa-maskable-512x512.png');

  // 5. favicon-32x32.png
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile('public/favicon-32x32.png');
  console.log('Created public/favicon-32x32.png');
}

generateIcons().catch(err => {
  console.error(err);
  process.exit(1);
});
