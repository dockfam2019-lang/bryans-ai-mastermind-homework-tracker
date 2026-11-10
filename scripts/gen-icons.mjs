// Generates public/icon-192.png and public/icon-512.png with no dependencies.
// A dark square with warm and cool color blobs and an amber curve, matching public/icon.svg.
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function png(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  const mix = (a, b, t) => a + (b - a) * t
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    for (let x = 0; x < size; x++) {
      const u = x / size
      const v = y / size
      let r = 7, g = 8, b = 12
      const warm = Math.max(0, 1 - Math.hypot(u - 0.25, v - 0.2) / 0.7)
      const cool = Math.max(0, 1 - Math.hypot(u - 0.85, v - 0.85) / 0.7)
      r = mix(r, 255, warm * 0.8) ; g = mix(g, 138, warm * 0.8) ; b = mix(b, 61, warm * 0.8)
      r = mix(r, 61, cool * 0.8) ; g = mix(g, 123, cool * 0.8) ; b = mix(b, 255, cool * 0.8)
      // amber curve: a sine-like stroke across the lower middle
      const cx = 0.3 + u * 0.4
      const curveY = 0.62 - 0.18 * Math.sin((u - 0.29) * 9)
      if (u > 0.29 && u < 0.74 && Math.abs(v - curveY) < 0.03) { r = 255; g = 178; b = 62 }
      void cx
      const i = y * (size * 4 + 1) + 1 + x * 4
      raw[i] = r; raw[i + 1] = g; raw[i + 2] = b; raw[i + 3] = 255
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

for (const size of [192, 512]) writeFileSync(new URL(`../public/icon-${size}.png`, import.meta.url), png(size))
console.log('wrote public/icon-192.png and public/icon-512.png')
