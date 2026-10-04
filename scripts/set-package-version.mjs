import fs from 'node:fs';
import { SemanticVersion } from './semantic-version.mjs';

const version = process.argv[2];

if (!version || !SemanticVersion.parse(version)) {
  throw new Error(`Некорректная SemVer-версия: ${version || 'не указана'}`);
}

const packagePath = new URL('../package.json', import.meta.url);
const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
packageData.version = version;
fs.writeFileSync(packagePath, `${JSON.stringify(packageData, null, 2)}\n`, 'utf8');

console.log(`Версия приложения: ${version}`);
