import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const read = (name) => readFile(new URL(name, import.meta.url));
const [shell, styles, core, app, photo, snapshot, highlights] = await Promise.all(
  ['index.html', 'styles.css', 'core.js', 'app.js', 'tokyo.jpg', 'snapshot.json', 'highlights.json'].map(read),
);
const data = { ...JSON.parse(snapshot), highlights: JSON.parse(highlights) };
const scripts = new Map([
  ['STYLES', styles.toString().replace('/* TOKYO */', `data:image/jpeg;base64,${photo.toString('base64')}`)],
  ['SNAPSHOT', JSON.stringify(data).replaceAll('<', '\\u003c')],
  ['CORE', core.toString()],
  ['APP', app.toString()],
]);
const output = shell.toString().replace(/\/\* (STYLES|SNAPSHOT|CORE|APP) \*\//g, (_, label) => scripts.get(label));
const outputDir = new URL('dist/', import.meta.url);
await mkdir(outputDir, { recursive: true });
const result = new URL('index.html', outputDir);
await writeFile(result, output);
console.log(`Built ${fileURLToPath(result)} (${data.jobs.length} snapshot jobs)`);
