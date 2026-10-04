import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { ReleaseTag, SemanticVersion } from './semantic-version.mjs';

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function writeOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) {
    throw new Error('Переменная GITHUB_OUTPUT не задана');
  }
  appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

const sha = git('rev-parse', 'HEAD');
const packageVersion = JSON.parse(readFileSync('package.json', 'utf8')).version;

writeOutput('sha', sha);

if (process.env.EVENT_NAME !== 'release') {
  throw new Error('Сборка установщиков запускается только через GitHub Release');
}

if (!SemanticVersion.parse(packageVersion)) {
  throw new Error('В package.json указана некорректная SemVer-версия');
}

const release = ReleaseTag.parse(process.env.RELEASE_TAG);
if (!release) {
  throw new Error('Тег релиза должен иметь формат v1.2.3');
}
const tagsAtCommit = git('tag', '--points-at', 'HEAD').split(/\r?\n/);
if (!tagsAtCommit.includes(release.toString())) {
  throw new Error(`Тег ${release} не указывает на собираемый коммит`);
}
writeOutput('version', release.version.toString());
writeOutput('tag', release.toString());
