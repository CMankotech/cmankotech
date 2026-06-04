#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const fail = [];

function requireFile(file) {
  if (!exists(file)) fail.push(`Missing file: ${file}`);
}

function requireText(file, text, reason = text) {
  const body = read(file);
  if (!body.includes(text)) fail.push(`${file} is missing ${reason}`);
}

function requireAnyText(file, texts, reason) {
  const body = read(file);
  if (!texts.some((text) => body.includes(text))) fail.push(`${file} is missing ${reason}`);
}

const publicPages = [
  ['index.html', 'portfolio principal'],
  ['pm-toolkit.html', 'PM Toolkit'],
  ['rag-explorer.html', 'RAG Explorer'],
  ['product-decisions.html', 'Product Decisions'],
  ['veille.html', 'Veille hebdo'],
  ['pixel-runner.html', 'Pixel Runner'],
  ['backlog-prioritizer.html', 'Backlog Prioritizer'],
  ['discovery-assistant.html', 'Discovery Assistant'],
  ['epic-to-userstories.html', 'Epic → User Stories'],
  ['okr-builder.html', 'OKR Builder'],
  ['roadmap-storyteller.html', 'Roadmap Storyteller'],
  ['user-interview-analyzer.html', 'User Interview Analyzer'],
];

for (const [file, label] of publicPages) {
  requireFile(file);
  requireText('README.md', file, `project structure entry for ${file}`);
  if (['PM Toolkit', 'RAG Explorer', 'Product Decisions', 'Veille hebdo', 'Pixel Runner'].includes(label)) {
    requireText('README.md', label, `project table entry for ${label}`);
  }
}

const readmeImages = [
  'assets/readme-portfolio.jpg',
  'assets/readme-pm-toolkit.jpg',
  'assets/readme-rag-explorer.jpg',
];

for (const image of readmeImages) {
  requireFile(image);
  requireText('README.md', image, `README screenshot reference ${image}`);
  if (exists(image)) {
    const size = fs.statSync(path.join(root, image)).size;
    if (size < 10_000) fail.push(`${image} looks too small (${size} bytes)`);
  }
}

const worker = read('proxy/src/index.js');
const routeMatches = [...worker.matchAll(/url\.pathname\s*===\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
const workerRoutes = ['/', ...new Set(routeMatches)].sort();
const routesThatMustBeDocumented = workerRoutes.filter((route) => route !== '/');

for (const route of routesThatMustBeDocumented) {
  requireText('proxy/README.md', `\`${route}\``, `documented Worker route ${route}`);
  requireText('README.md', route, `architecture mention for Worker route ${route}`);
}

const wrangler = read('proxy/wrangler.toml');
const bindings = [...wrangler.matchAll(/binding\s*=\s*"([^"]+)"/g)].map((m) => m[1]);
for (const binding of bindings) {
  requireText('proxy/README.md', binding, `documented Cloudflare binding ${binding}`);
}

const documentedSecrets = [
  'GROQ_KEY',
  'LANGGRAPH_ORCHESTRATOR_URL',
  'MAKE_SECRET',
  'MAKE_WEBHOOK_URL',
  'LANGFUSE_PUBLIC_KEY',
  'LANGFUSE_SECRET_KEY',
];
for (const secret of documentedSecrets) {
  requireText('proxy/README.md', secret, `documented secret ${secret}`);
}

requireAnyText('README.md', ['https://cmankotech.github.io/cmankotech/'], 'canonical live URL');
requireText('README.md', 'node --test tests/proxy.test.mjs', 'proxy test command');
requireText('proxy/README.md', 'npx wrangler deploy --config proxy/wrangler.toml', 'root deploy command');

if (fail.length) {
  console.error('\nDocumentation drift detected:\n');
  for (const item of fail) console.error(`- ${item}`);
  console.error('\nUpdate README.md / proxy/README.md or adjust tools/check-docs.cjs if the product surface intentionally changed.\n');
  process.exit(1);
}

console.log('Documentation is aligned with the current project surface.');
