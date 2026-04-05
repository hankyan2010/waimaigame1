// Script to parse question-bank-200.md into JSON
const fs = require("fs");
const path = require("path");

const md = fs.readFileSync(
  path.join(__dirname, "../data/question-bank-200.md"),
  "utf-8"
);

const questions = [];
const blocks = md.split(/^### (\d+)$/gm);

// blocks: ["preamble", "1", "content1", "2", "content2", ...]
for (let i = 1; i < blocks.length; i += 2) {
  const id = parseInt(blocks[i], 10);
  const content = blocks[i + 1];
  if (!content) continue;

  const titleMatch = content.match(/题目[：:](.+)/);
  const title = titleMatch ? titleMatch[1].trim() : "";

  const optionRegex = /- ([A-D])[.．]\s*(.+)/g;
  const options = [];
  let m;
  while ((m = optionRegex.exec(content)) !== null) {
    options.push({ label: m[1], text: m[2].trim(), isCorrect: false });
  }

  const answerMatch = content.match(/正确答案[：:]([A-D])/);
  const correctLabel = answerMatch ? answerMatch[1] : "";

  options.forEach((o) => {
    if (o.label === correctLabel) o.isCorrect = true;
  });

  const explanationMatch = content.match(/解析[：:](.+)/);
  const explanation = explanationMatch ? explanationMatch[1].trim() : "";

  const categoryMatch = content.match(/分类[：:](\w+)/);
  const category = categoryMatch ? categoryMatch[1].trim() : "traffic";

  let difficulty = "easy";
  if (id > 150) difficulty = "hard";
  else if (id > 75) difficulty = "medium";

  if (title && options.length === 4) {
    questions.push({
      id,
      title,
      options,
      explanation,
      category,
      difficulty,
      score: 10,
    });
  }
}

console.log(`Parsed ${questions.length} questions`);

// Generate TypeScript file
let ts = `import { Question } from "@/lib/types";\n\nexport const questions: Question[] = `;
ts += JSON.stringify(questions, null, 2);
ts += ";\n";

fs.writeFileSync(
  path.join(__dirname, "../src/data/questions.ts"),
  ts,
  "utf-8"
);

console.log("Written to src/data/questions.ts");
