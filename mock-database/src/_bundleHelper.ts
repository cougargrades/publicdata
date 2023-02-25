import { createWriteStream, mkdirSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { pipeline } from 'stream'
import { promisify } from 'util'
import got from 'got'
import tar from 'tar'
import { parse } from 'csv-parse'
import type { GradeDistributionCSVRow } from '@cougargrades/types/dist/GradeDistributionCSVRow.js'
import { GradeDistributionCSVRow as GDR } from '@cougargrades/types'
import _glob from 'glob'
import _rimraf from 'rimraf'

export async function downloadFile(url: string, path: string) {
  mkdirSync(dirname(path), { recursive: true });
  console.log(`Downloading ${url} to ${join(process.cwd(), path)}`)
  const streamPipeline = promisify(pipeline)
  await streamPipeline(got.stream(url), createWriteStream(path))
  console.log(`Download completed for ${join(process.cwd(), path)}`)
}

export async function extractBundle(tarFile: string, outputDirectory: string) {
  console.log(`Extracting bundle ${tarFile}`)
  mkdirSync(outputDirectory, { recursive: true })
  await tar.x({
    file: tarFile,
    C: outputDirectory
  })
  console.log(`Extraction complete for ${tarFile}`)
}

export async function parseCSV(csvFile: string): Promise<GradeDistributionCSVRow[]> {
  const parser = parse(readFileSync(csvFile), {
    columns: true
  });
  const records: GradeDistributionCSVRow[] = [];
  for await (const record of parser) {
    const temp = GDR.tryFromRaw(record);
    if(temp !== null) {
      records.push(temp);
    }
  }
  return records;
}

export async function getPatchFiles(directory: string): Promise<[string[], number]> {
  const glob = promisify(_glob);
  const files = await glob(`${directory}/**/patch-*.json`)
  files.sort((a,b) => a.localeCompare(b));
  return [files, Number(
    files[files.length - 1] // last patchfile after sorting
    .split('-') // [ "patch", "0", "groupdefaults", "1617828381961927207.json" ]
    [1] // access phase
  )];
}

export function rimraf(path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    _rimraf(path, err => {
      if (err === null || err === undefined)
        resolve();
      else
        reject(err);
    })
  });
}