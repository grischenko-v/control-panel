import fs from 'node:fs';
import path from 'node:path';

const [extension, releaseFileName] = process.argv.slice(2);

if (!extension || !releaseFileName) {
  throw new Error('Необходимо указать расширение и итоговое имя установщика');
}
if (releaseFileName.includes('-') || releaseFileName.includes('1.0.0')) {
  throw new Error(`Недопустимое имя установщика latest: ${releaseFileName}`);
}

const outputDirectory = path.resolve('dist');
const candidates = fs.readdirSync(outputDirectory)
  .filter((fileName) => fileName.endsWith(extension))
  .filter((fileName) => fs.statSync(path.join(outputDirectory, fileName)).isFile());

if (candidates.length !== 1) {
  throw new Error(
    `Ожидался один файл ${extension}, найдено: ${candidates.length}`,
  );
}

const sourcePath = path.join(outputDirectory, candidates[0]);
const destinationPath = path.join(outputDirectory, releaseFileName);
fs.renameSync(sourcePath, destinationPath);
console.log(`Файл релиза: ${releaseFileName}`);
