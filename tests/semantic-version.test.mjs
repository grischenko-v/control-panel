import { describe, expect, test } from 'bun:test';
import { ReleaseTag, SemanticVersion } from '../scripts/semantic-version.mjs';

describe('SemVer', () => {
  test('разбирает корректную версию', () => {
    expect(SemanticVersion.parse('1.2.3')?.toString()).toBe('1.2.3');
  });

  test.each(['1.2', '1.2.3.4', '01.2.3', 'release-1.2.3'])('отклоняет %s', (value) => {
    expect(SemanticVersion.parse(value)).toBeUndefined();
  });
});

describe('тег релиза', () => {
  test('принимает тег формата v1.2.3', () => {
    const release = ReleaseTag.parse('v1.2.3');

    expect(release?.version.toString()).toBe('1.2.3');
    expect(release?.toString()).toBe('v1.2.3');
  });

  test.each(['1.2.3', 'version-1.2.3', 'v1.2'])('отклоняет %s', (value) => {
    expect(ReleaseTag.parse(value)).toBeUndefined();
  });
});
