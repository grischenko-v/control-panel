import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const workflow = Bun.YAML.parse(
  readFileSync(path.join(import.meta.dir, '../.github/workflows/latest.yml'), 'utf8'),
) as {
  jobs: {
    build: {
      strategy: {
        matrix: {
          include: Array<{ release_file: string }>;
        };
      };
    };
  };
};

describe('файлы плавающего релиза', () => {
  const fileNames = workflow.jobs.build.strategy.matrix.include
    .map(({ release_file: fileName }) => fileName);

  test('используют latest вместо версии package.json', () => {
    expect(fileNames).toEqual([
      'ControlPanel_latest_x64.exe',
      'ControlPanel_latest_arm64.dmg',
      'ControlPanel_latest_x64.AppImage',
    ]);
  });

  test('не содержат дефисов', () => {
    expect(fileNames.every((fileName) => !fileName.includes('-'))).toBe(true);
  });
});
