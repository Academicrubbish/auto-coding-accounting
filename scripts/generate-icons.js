/**
 * 生成 TabBar 图标
 * 需要先安装: npm install canvas
 */

const fs = require('fs');
const path = require('path');

// 简单的 PNG 文件头 + 最小可用的 PNG
// 这是一个 1x1 像素的透明 PNG 的 base64
const transparentPixel = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// 为每个图标创建一个简单的 PNG 文件
// 注意：这些是最小的占位符图标，实际使用时应该替换为真正的图标
const icons = [
  'tab-home.png',
  'tab-home-active.png',
  'tab-stats.png',
  'tab-stats-active.png',
  'tab-mine.png',
  'tab-mine-active.png'
];

const staticDir = path.join(__dirname, '../static');

// 确保 static 目录存在
if (!fs.existsSync(staticDir)) {
  fs.mkdirSync(staticDir, { recursive: true });
}

// 创建图标文件
icons.forEach(icon => {
  const filePath = path.join(staticDir, icon);
  fs.writeFileSync(filePath, transparentPixel);
  console.log(`Created: ${icon}`);
});

console.log('\n图标文件已生成！');
console.log('注意：这些是占位符图标，建议替换为设计好的图标文件。');
console.log('图标要求：');
console.log('- 尺寸：建议 81x81 px（支持 @3x，即最大 243x243 px）');
console.log('- 格式：PNG');
console.log('- 普通状态：灰色图标');
console.log('- 选中状态：主题色图标');
