import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const packageJson = JSON.parse(
  readFileSync(path.join(import.meta.dir, '../package.json'), 'utf8'),
) as { scripts: Record<string, string> };

describe('скрипты сборки установщиков', () => {
  test.each(['build:win', 'build:mac', 'build:linux'])(
    '%s запрещает неявную публикацию electron-builder',
    (scriptName) => {
      expect(packageJson.scripts[scriptName]).toEndWith('--publish never');
    },
  );
});
