import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const packageJson = JSON.parse(
  readFileSync(path.join(import.meta.dir, '../package.json'), 'utf8'),
) as {
  scripts: Record<string, string>;
  build: {
    directories: { buildResources: string };
    mac: { icon: string };
    win: { icon: string };
    linux: { icon: string };
  };
};

describe('скрипты сборки установщиков', () => {
  test.each(['build:win', 'build:mac', 'build:linux'])(
    '%s запрещает неявную публикацию electron-builder',
    (scriptName) => {
      expect(packageJson.scripts[scriptName]).toEndWith('--publish never');
    },
  );
});

describe('иконки приложения', () => {
  test('подключены для всех платформ', () => {
    expect(packageJson.build).toMatchObject({
      directories: { buildResources: 'build-resources' },
      mac: { icon: 'icon.png' },
      win: { icon: 'icon.ico' },
      linux: { icon: 'icons' },
    });
  });

  test.each([
    'icon.png',
    'icon.ico',
    'icons/16x16.png',
    'icons/32x32.png',
    'icons/48x48.png',
    'icons/64x64.png',
    'icons/128x128.png',
    'icons/256x256.png',
    'icons/512x512.png',
    'icons/1024x1024.png',
  ])('содержит ресурс %s', (resourcePath) => {
    expect(existsSync(path.join(import.meta.dir, '../build-resources', resourcePath))).toBe(true);
  });
});
