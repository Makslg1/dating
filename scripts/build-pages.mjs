// Копирует свежую production-сборку в папку docs/ для GitHub Pages.
// Запускается через `npm run deploy` (после ng build).
import { cp, rm, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'dist', 'dating', 'browser');
const docs = join(root, 'docs');

if (!existsSync(src)) {
  console.error('Сборка не найдена:', src, '\nСначала выполни `ng build --base-href /dating/`.');
  process.exit(1);
}

await rm(docs, { recursive: true, force: true });
await mkdir(docs, { recursive: true });
await cp(src, docs, { recursive: true });
await writeFile(join(docs, '.nojekyll'), '');
await copyFile(join(docs, 'index.html'), join(docs, '404.html'));

console.log('✓ docs/ обновлён из', src);
