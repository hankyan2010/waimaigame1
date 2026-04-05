// Script to merge JSON question files into questions.ts
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const outFile = path.join(__dirname, '../src/data/questions.ts');

// Read existing questions.ts to extract original 200 questions
const existingContent = fs.readFileSync(outFile, 'utf-8');
const match = existingContent.match(/export const questions: Question\[\] = (\[[\s\S]*\]);?\s*$/);
let existingQuestions = [];
if (match) {
  existingQuestions = JSON.parse(match[1]);
}
console.log(`Existing questions: ${existingQuestions.length}`);

// Read all q-*.json files
const jsonFiles = fs.readdirSync(dataDir).filter(f => f.startsWith('q-') && f.endsWith('.json')).sort();
let newQuestions = [];
for (const file of jsonFiles) {
  const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8'));
  console.log(`${file}: ${data.length} questions`);
  newQuestions.push(...data);
}
console.log(`New questions: ${newQuestions.length}`);

// Combine and re-assign IDs
const all = [...existingQuestions, ...newQuestions];
all.forEach((q, i) => { q.id = i + 1; });
console.log(`Total: ${all.length} questions`);

// Write output
const header = 'import { Question } from "@/lib/types";\n\nexport const questions: Question[] = ';
const json = JSON.stringify(all, null, 2);
fs.writeFileSync(outFile, header + json + ';\n');
console.log('Done! Written to', outFile);
