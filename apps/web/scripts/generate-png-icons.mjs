import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Standard CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcPayload = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcPayload);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, crcPayload, crcBuf]);
}

function createPng(width, height, drawFn) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // default compression
  ihdr[11] = 0; // default filter
  ihdr[12] = 0; // no interlace

  const ihdrChunk = createChunk('IHDR', ihdr);

  // Raw image data with 0 filter byte at start of each scanline
  const scanlineLength = width * 4 + 1;
  const rawData = Buffer.alloc(height * scanlineLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter byte: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Drawing function for GowesKit Brand Icon
function drawGowesKitIcon(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;

  // Background: Dark Slate Ink (#17202A) with rounded corner alpha
  const radius = 0.22;
  let inBounds = true;
  if (nx < radius && ny < radius) {
    inBounds = Math.hypot(nx - radius, ny - radius) <= radius;
  } else if (nx > 1 - radius && ny < radius) {
    inBounds = Math.hypot(nx - (1 - radius), ny - radius) <= radius;
  } else if (nx < radius && ny > 1 - radius) {
    inBounds = Math.hypot(nx - radius, ny - (1 - radius)) <= radius;
  } else if (nx > 1 - radius && ny > 1 - radius) {
    inBounds = Math.hypot(nx - (1 - radius), ny - (1 - radius)) <= radius;
  }

  if (!inBounds) return [0, 0, 0, 0];

  // Base background: #17202A
  let r = 23, g = 32, b = 42, a = 255;

  // Wheel 1 (Rear Wheel at nx: 0.31, ny: 0.65)
  const d1 = Math.hypot(nx - 0.31, ny - 0.65);
  // Wheel 2 (Front Wheel at nx: 0.69, ny: 0.65)
  const d2 = Math.hypot(nx - 0.69, ny - 0.65);

  // Wheel Rims (Sky Blue #8EDDF4)
  if ((d1 >= 0.12 && d1 <= 0.16) || (d2 >= 0.12 && d2 <= 0.16)) {
    return [142, 221, 244, 255];
  }

  // Wheel Hubs (Chain Lime #C9F36A)
  if (d1 <= 0.035 || d2 <= 0.035) {
    return [201, 243, 106, 255];
  }

  // Frame Diamond & Geometry lines (Chain Lime #C9F36A)
  // Rear axle: (0.31, 0.65), BB: (0.51, 0.65), Seat: (0.43, 0.39), Head: (0.64, 0.39), Fork drop: (0.69, 0.65)
  const lines = [
    [[0.31, 0.65], [0.51, 0.65]], // Chainstay
    [[0.31, 0.65], [0.43, 0.39]], // Seatstay
    [[0.51, 0.65], [0.43, 0.39]], // Seattube
    [[0.51, 0.65], [0.64, 0.39]], // Downtube
    [[0.43, 0.39], [0.64, 0.39]], // Toptube
    [[0.64, 0.39], [0.69, 0.65]], // Fork
  ];

  for (const [[x1, y1], [x2, y2]] of lines) {
    const dist = distToSegment(nx, ny, x1, y1, x2, y2);
    if (dist <= 0.022) {
      return [201, 243, 106, 255];
    }
  }

  // Handlebar & Saddle (White #FFFFFF)
  // Handlebar at (0.64, 0.30)
  if (distToSegment(nx, ny, 0.64, 0.39, 0.63, 0.30) <= 0.018 ||
      distToSegment(nx, ny, 0.58, 0.30, 0.69, 0.30) <= 0.018) {
    return [255, 255, 255, 255];
  }

  // Saddle at (0.41, 0.31)
  if (distToSegment(nx, ny, 0.43, 0.39, 0.41, 0.31) <= 0.018 ||
      distToSegment(nx, ny, 0.35, 0.31, 0.46, 0.31) <= 0.018) {
    return [255, 255, 255, 255];
  }

  return [r, g, b, a];
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

const iconsDir = resolve(__dirname, '../public/icons');
const publicDir = resolve(__dirname, '../public');
mkdirSync(iconsDir, { recursive: true });

console.log('Generating PWA PNG icons...');
const png192 = createPng(192, 192, drawGowesKitIcon);
writeFileSync(resolve(iconsDir, 'icon-192.png'), png192);
writeFileSync(resolve(publicDir, 'apple-touch-icon.png'), png192);
console.log('✓ Created icons/icon-192.png (192x192)');
console.log('✓ Created apple-touch-icon.png (192x192)');

const png512 = createPng(512, 512, drawGowesKitIcon);
writeFileSync(resolve(iconsDir, 'icon-512.png'), png512);
writeFileSync(resolve(iconsDir, 'icon-maskable-512.png'), png512);
console.log('✓ Created icons/icon-512.png (512x512)');
console.log('✓ Created icons/icon-maskable-512.png (512x512)');

const png48 = createPng(48, 48, drawGowesKitIcon);
writeFileSync(resolve(publicDir, 'favicon.png'), png48);
console.log('✓ Created favicon.png (48x48)');
console.log('All PWA PNG icons generated successfully!');
