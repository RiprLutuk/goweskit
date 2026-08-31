/**
 * Pure TypeScript QR Code generator for GowesKit.
 * Supports Byte encoding mode with Error Correction Level M/L.
 */

// Galois field tables for GF(256)
const EXP_TABLE = new Uint8Array(256);
const LOG_TABLE = new Uint8Array(256);

(function initGaloisField() {
  let val = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = val;
    LOG_TABLE[val] = i;
    val = (val << 1) ^ (val & 0x80 ? 0x11d : 0);
  }
  EXP_TABLE[255] = EXP_TABLE[0]!;
})();

function gfMultiply(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP_TABLE[(LOG_TABLE[a]! + LOG_TABLE[b]!) % 255]!;
}

function getGeneratorPolynomial(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const factor = EXP_TABLE[i] ?? 0;
    for (let j = 0; j < poly.length; j++) {
      const pVal = poly[j] ?? 0;
      const nVal = next[j] ?? 0;
      const nNextVal = next[j + 1] ?? 0;
      next[j] = nVal ^ gfMultiply(pVal, factor);
      next[j + 1] = nNextVal ^ pVal;
    }
    poly = next;
  }
  return poly;
}

function calculateEcc(data: Uint8Array, eccCount: number): Uint8Array {
  const gen = getGeneratorPolynomial(eccCount);
  const result = new Uint8Array(eccCount);
  for (let i = 0; i < data.length; i++) {
    const feedback = (data[i] ?? 0) ^ (result[0] ?? 0);
    result.copyWithin(0, 1);
    result[eccCount - 1] = 0;
    if (feedback !== 0) {
      for (let j = 0; j < eccCount; j++) {
        const rVal = result[j] ?? 0;
        const gVal = gen[j] ?? 0;
        result[j] = rVal ^ gfMultiply(gVal, feedback);
      }
    }
  }
  return result;
}

interface QrVersionInfo {
  version: number;
  size: number;
  dataCapacity: number;
  eccCount: number;
}

const QR_VERSIONS: QrVersionInfo[] = [
  { version: 1, size: 21, dataCapacity: 14, eccCount: 10 },
  { version: 2, size: 25, dataCapacity: 26, eccCount: 16 },
  { version: 3, size: 29, dataCapacity: 42, eccCount: 26 },
  { version: 4, size: 33, dataCapacity: 62, eccCount: 36 },
  { version: 5, size: 37, dataCapacity: 84, eccCount: 48 },
  { version: 6, size: 41, dataCapacity: 106, eccCount: 64 },
];

function selectVersion(byteLength: number): QrVersionInfo {
  for (const v of QR_VERSIONS) {
    if (v.dataCapacity >= byteLength + 2) {
      return v;
    }
  }
  return QR_VERSIONS[QR_VERSIONS.length - 1]!;
}

export function generateQrMatrix(text: string): boolean[][] {
  const utf8Bytes = new TextEncoder().encode(text);
  const versionInfo = selectVersion(utf8Bytes.length);
  const { size, dataCapacity, eccCount } = versionInfo;

  const bits: number[] = [];
  const pushBits = (value: number, count: number) => {
    for (let i = count - 1; i >= 0; i--) {
      bits.push((value >> i) & 1);
    }
  };

  pushBits(0b0100, 4);
  pushBits(utf8Bytes.length, 8);
  for (const byte of utf8Bytes) {
    pushBits(byte, 8);
  }
  const remainingDataBits = dataCapacity * 8 - bits.length;
  pushBits(0, Math.min(4, Math.max(0, remainingDataBits)));
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < dataCapacity * 8) {
    pushBits(padBytes[padIdx % 2]!, 8);
    padIdx++;
  }

  const dataBytes = new Uint8Array(dataCapacity);
  for (let i = 0; i < dataCapacity; i++) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | (bits[i * 8 + b] ?? 0);
    }
    dataBytes[i] = byteVal;
  }

  const eccBytes = calculateEcc(dataBytes, eccCount);
  const allCodewords = new Uint8Array(dataCapacity + eccCount);
  allCodewords.set(dataBytes, 0);
  allCodewords.set(eccBytes, dataCapacity);

  const matrix: (boolean | null)[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null),
  );
  const isReserved: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false),
  );

  const setModule = (r: number, c: number, val: boolean, reserved = true) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r]![c] = val;
      if (reserved) isReserved[r]![c] = true;
    }
  };

  const drawFinderPattern = (startRow: number, startCol: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = startRow + r;
        const col = startCol + c;
        if (row < 0 || row >= size || col < 0 || col >= size) continue;
        if (
          r === -1 ||
          r === 7 ||
          c === -1 ||
          c === 7 ||
          r === 1 ||
          r === 5 ||
          c === 1 ||
          c === 5
        ) {
          setModule(row, col, false);
        } else if (r >= 0 && r <= 6 && (c === 0 || c === 6)) {
          setModule(row, col, true);
        } else if (c >= 0 && c <= 6 && (r === 0 || r === 6)) {
          setModule(row, col, true);
        } else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
          setModule(row, col, true);
        } else {
          setModule(row, col, false);
        }
      }
    }
  };

  drawFinderPattern(0, 0);
  drawFinderPattern(0, size - 7);
  drawFinderPattern(size - 7, 0);

  for (let i = 8; i < size - 8; i++) {
    setModule(6, i, i % 2 === 0);
    setModule(i, 6, i % 2 === 0);
  }

  setModule(size - 8, 8, true);

  for (let i = 0; i < 9; i++) {
    if (!isReserved[8]![i]) setModule(8, i, false);
    if (!isReserved[i]![8]) setModule(i, 8, false);
  }
  for (let i = 0; i < 8; i++) {
    setModule(8, size - 1 - i, false);
    setModule(size - 1 - i, 8, false);
  }

  let codewordIdx = 0;
  let bitIdx = 7;
  let upwards = true;

  for (let rightCol = size - 1; rightCol > 0; rightCol -= 2) {
    if (rightCol === 6) rightCol--;

    const rows = upwards
      ? Array.from({ length: size }, (_, idx) => size - 1 - idx)
      : Array.from({ length: size }, (_, idx) => idx);

    for (const r of rows) {
      for (const col of [rightCol, rightCol - 1]) {
        if (!isReserved[r]![col]) {
          let bit = false;
          if (codewordIdx < allCodewords.length) {
            bit = ((allCodewords[codewordIdx]! >> bitIdx) & 1) === 1;
            bitIdx--;
            if (bitIdx < 0) {
              bitIdx = 7;
              codewordIdx++;
            }
          }

          const mask = (r + col) % 2 === 0;
          matrix[r]![col] = bit !== mask;
        }
      }
    }
    upwards = !upwards;
  }

  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
  const formatCoords = [
    [8, 0],
    [8, 1],
    [8, 2],
    [8, 3],
    [8, 4],
    [8, 5],
    [8, 7],
    [8, 8],
    [7, 8],
    [5, 8],
    [4, 8],
    [3, 8],
    [2, 8],
    [1, 8],
    [0, 8],
  ];

  for (let i = 0; i < 15; i++) {
    const bit = formatBits[i] === 1;
    const coord = formatCoords[i]!;
    const r = coord[0]!;
    const c = coord[1]!;
    matrix[r]![c] = bit;

    if (i < 7) {
      matrix[size - 1 - i]![8] = bit;
    } else {
      matrix[8]![size - 15 + i] = bit;
    }
  }

  return matrix.map((row) => row.map((cell) => cell === true));
}

export interface QrRenderOptions {
  size?: number;
  foreground?: string;
  background?: string;
  margin?: number;
}

export function generateQrSvg(
  text: string,
  options: QrRenderOptions = {},
): string {
  const size = options.size ?? 200;
  const fg = options.foreground ?? '#000000';
  const bg = options.background ?? '#ffffff';
  const margin = options.margin ?? 2;

  const matrix = generateQrMatrix(text);
  const matrixSize = matrix.length;
  const totalGridSize = matrixSize + margin * 2;
  const cellSize = size / totalGridSize;

  let pathD = '';
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r]![c]) {
        const x = (c + margin) * cellSize;
        const y = (r + margin) * cellSize;
        pathD += `M${x.toFixed(2)},${y.toFixed(2)}h${cellSize.toFixed(2)}v${cellSize.toFixed(2)}h-${cellSize.toFixed(2)}z `;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="100%" height="100%" fill="${bg}" />
  <path d="${pathD.trim()}" fill="${fg}" />
</svg>`;
}

export function drawQrToCanvas(
  canvas: HTMLCanvasElement,
  text: string,
  options: QrRenderOptions = {},
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const matrix = generateQrMatrix(text);
  const matrixSize = matrix.length;
  const margin = options.margin ?? 2;
  const totalGridSize = matrixSize + margin * 2;
  const cellSize = canvas.width / totalGridSize;

  ctx.fillStyle = options.background ?? '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = options.foreground ?? '#000000';
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r]![c]) {
        ctx.fillRect(
          (c + margin) * cellSize,
          (r + margin) * cellSize,
          cellSize,
          cellSize,
        );
      }
    }
  }
}
