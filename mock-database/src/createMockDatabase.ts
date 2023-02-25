import { getPatchFiles, parseCSV } from './_bundleHelper.js';
import { shuffle } from './_shuffle.js';
import { whenUploadQueueAdded } from './_mockDatabase.js'
import { reset } from './_firestoreFS.js';
import { processPatchfile } from './_patchfileFS.js';
import TerminalKit from 'terminal-kit'
const { terminal } = TerminalKit

const records = await parseCSV('tmp/test/edu.uh.grade_distribution/records.csv');
const [files, maxFilePhase] = await getPatchFiles('tmp/test/io.cougargrades.publicdata.patchfile');

if(records.length === 0) {
  console.error('This CSV file is empty! Exiting.')
  process.exit(1);
}

// mutates the records array in-place
// shuffles the records so that we prevent similar courses/sections from being adjacent
shuffle(records);
console.log('CSV records have been parsed and shuffled');

await reset()


const prepatch = files.filter(e => e.split('/').reverse()[0].startsWith(`patch-0`))
console.log(`Pre-processing patch-0 patchfiles (${prepatch.length} entries)...`)
// Do `patch-0` first
for (let file of prepatch) {
  await processPatchfile(file)
}
console.log(`Pre-processed patch-0 patchfiles (${prepatch.length} processed)`)

console.log(`Starting record processing (${records.length} entries)...`)
console.time('Records processed in')
// Do `records.csv`
for (let i = 0; i < records.length; i++) {
  await whenUploadQueueAdded(records[i]);
  //console.log(`Processed record: ${i+1} of ${records.length} (${((i+1)/records.length*100).toFixed(1)}%)`)
}
console.timeEnd('Records processed in')
console.log(`Finished processing records (${records.length} processed)`)

// Do remaining patchfiles
for(let i = 1; i <= maxFilePhase; i++) {
  console.log(`phase ${i} queue starting...`);
  console.time(`phase ${i} time`);
  const filesForCurrentPhase = files.filter(e => e.split('/').reverse()[0].startsWith(`patch-${i}`));

  for(let file of filesForCurrentPhase) {
    await processPatchfile(file)
  }
  
  console.log(`phase ${i} queue done!`);
  console.timeEnd(`phase ${i} time`);
}