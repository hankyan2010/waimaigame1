/**
 * 批量放大 questions.ts 中所有 effect 数值
 *
 * 放大倍率：
 *   cash: 4x
 *   exposure: 3x
 *   enterConversion: 4x
 *   orderConversion: 4x
 *   avgPrice: 2.5x
 *   badReviewRate: 3x
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'lib', 'questions.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Multipliers
const multipliers = {
  cash: 2.5,
  exposure: 2,
  enterConversion: 2.5,
  orderConversion: 2.5,
  avgPrice: 2,
  badReviewRate: 2.5,
};

// Match effect objects: effect: { ... }
// We need to find all effect blocks and scale the numbers inside

// Strategy: find each key: number pair inside effect blocks
for (const [key, mult] of Object.entries(multipliers)) {
  // Match patterns like:  cash: -300  or  cash: 200  or  enterConversion: 0.015
  // Inside effect objects
  const regex = new RegExp(`(${key}:\\s*)(-?\\d+\\.?\\d*)`, 'g');
  content = content.replace(regex, (match, prefix, numStr) => {
    const num = parseFloat(numStr);
    let newNum = num * mult;

    // Round appropriately
    if (key === 'cash' || key === 'exposure') {
      newNum = Math.round(newNum / 50) * 50; // Round to nearest 50
    } else if (key === 'avgPrice') {
      newNum = Math.round(newNum * 10) / 10; // 1 decimal
    } else {
      // Conversion rates and badReviewRate - round to reasonable precision
      newNum = Math.round(newNum * 1000) / 1000;
    }

    return `${prefix}${newNum}`;
  });
}

// Update the comment at the top about effect ranges
content = content.replace(
  /效果区间：[\s\S]*?\*\//,
  `效果区间（v4.4 极端化）：
 *   exposure: ±100~±1000 (开局基数 1500)
 *   enterConversion: ±0.02~±0.08
 *   orderConversion: ±0.02~±0.08
 *   avgPrice: ±2.5~±12.5
 *   badReviewRate: ±0.03~±0.09
 *   cash: ±400~±4000
 */`
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Done! Effects amplified.');

// Verify by counting some effects
const cashMatches = content.match(/cash:\s*-?\d+/g) || [];
const exposureMatches = content.match(/exposure:\s*-?\d+/g) || [];
console.log(`Found ${cashMatches.length} cash effects, ${exposureMatches.length} exposure effects`);

// Show a sample
const sample = content.match(/id: "q001"[\s\S]*?id: "q002"/);
if (sample) {
  console.log('\nSample (q001):');
  console.log(sample[0].slice(0, 500));
}
