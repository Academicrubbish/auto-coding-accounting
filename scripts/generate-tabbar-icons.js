/**
 * 生成 TabBar 图标 - 使用 canvas 绘制
 * 运行: node scripts/generate-tabbar-icons.js
 */

const fs = require('fs');
const path = require('path');

// 创建 81x81 的 PNG 图标
// 使用简单的 base64 编码的图像数据
function createIconPNG(color) {
  // 创建一个简单的 81x81 单色圆形图标
  const size = 81;
  const pixels = new Uint8Array(size * size * 4); // RGBA

  const centerX = Math.floor(size / 2);
  const centerY = Math.floor(size / 2);
  const radius = Math.floor(size / 3);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const idx = (y * size + x) * 4;

      if (distance <= radius) {
        // 在圆内 - 设置颜色
        if (color === 'home') {
          // 房子图标 - 简化为棕色圆形
          pixels[idx] = 128;     // R
          pixels[idx + 1] = 128; // G
          pixels[idx + 2] = 128; // B
        } else if (color === 'home-active') {
          // 激活状态 - 紫色
          pixels[idx] = 102;
          pixels[idx + 1] = 126;
          pixels[idx + 2] = 234;
        } else if (color === 'stats') {
          // 统计图标 - 简化为灰色圆形
          pixels[idx] = 128;
          pixels[idx + 1] = 128;
          pixels[idx + 2] = 128;
        } else if (color === 'stats-active') {
          // 激活状态 - 紫色
          pixels[idx] = 102;
          pixels[idx + 1] = 126;
          pixels[idx + 2] = 234;
        } else if (color === 'mine') {
          // 我的图标 - 简化为灰色圆形
          pixels[idx] = 128;
          pixels[idx + 1] = 128;
          pixels[idx + 2] = 128;
        } else if (color === 'mine-active') {
          // 激活状态 - 紫色
          pixels[idx] = 102;
          pixels[idx + 1] = 126;
          pixels[idx + 2] = 234;
        }
        pixels[idx + 3] = 200; // A (alpha)
      } else {
        // 透明
        pixels[idx] = 0;
        pixels[idx + 1] = 0;
        pixels[idx + 2] = 0;
        pixels[idx + 3] = 0;
      }
    }
  }

  // 简单的 PNG 编码（无压缩）
  return encodePNG(pixels, size, size);
}

// 简化的 PNG 编码器
function encodePNG(pixels, width, height) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);   // bit depth
  ihdr.writeUInt8(6, 9);   // color type (RGBA)
  ihdr.writeUInt8(0, 10);  // compression
  ihdr.writeUInt8(0, 11);  // filter
  ihdr.writeUInt8(0, 12);  // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);

  // IDAT chunk (image data)
  const imageData = Buffer.alloc(width * height * 4 + height);
  let offset = 0;
  for (let y = 0; y < height; y++) {
    imageData[offset++] = 0; // filter type
    for (let x = 0; x < width * 4; x++) {
      imageData[offset++] = pixels[y * width * 4 + x];
    }
  }

  const zlib = require('zlib');
  const compressed = zlib.deflateSync(imageData);
  const idatChunk = createChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = calculateCRC(Buffer.concat([typeBuffer, data]));

  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function calculateCRC(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (-306674912 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// 创建所有图标
const staticDir = path.join(__dirname, '../static');

if (!fs.existsSync(staticDir)) {
  fs.mkdirSync(staticDir, { recursive: true });
}

const icons = [
  { name: 'tab-home.png', color: 'home' },
  { name: 'tab-home-active.png', color: 'home-active' },
  { name: 'tab-stats.png', color: 'stats' },
  { name: 'tab-stats-active.png', color: 'stats-active' },
  { name: 'tab-mine.png', color: 'mine' },
  { name: 'tab-mine-active.png', color: 'mine-active' }
];

icons.forEach(icon => {
  const pngData = createIconPNG(icon.color);
  const filePath = path.join(staticDir, icon.name);
  fs.writeFileSync(filePath, pngData);
  console.log(`Created: ${icon.name} (${pngData.length} bytes)`);
});

console.log('\n✅ TabBar 图标生成完成！');
console.log('图标尺寸: 81x81 px');
console.log('普通状态: 灰色');
console.log('选中状态: 紫色 (#667eea)');
