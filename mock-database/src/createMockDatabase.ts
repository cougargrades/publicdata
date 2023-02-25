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

// Do `patch-0` first
for (let file of files.filter(e => e.split('/').reverse()[0].startsWith(`patch-0`))) {
  await processPatchfile(file)
}

// Do `records.csv`
let pbar = terminal.progressBar({
  title: 'Processing records.csv:',
  eta: true,
  percent: true
})
for (let i = 0; i < records.length; i++) {
  await whenUploadQueueAdded(records[i]);
  //console.log(`Processed client-side: ${i+1} of ${records.length} (${((i+1)/records.length*100).toFixed(1)}%)`)
  pbar.update(i/records.length)
}
pbar.stop()
console.log(`Finished processing records (${records.length} processed)`)

// Do remaining patchfiles
let tally = 0
const TOTAL_PATCH_FILES_AFTER_0 = files.length - files.filter(e => e.split('/').reverse()[0].startsWith(`patch-0`)).length;
pbar = terminal.progressBar({
  title: 'Processing Patch files:',
  eta: true,
  percent: true
})
for(let i = 1; i <= maxFilePhase; i++) {
  console.log(`phase ${i} queue starting...`);
  console.time(`phase ${i} time`);
  const filesForCurrentPhase = files.filter(e => e.split('/').reverse()[0].startsWith(`patch-${i}`));

  for(let file of filesForCurrentPhase) {
    await processPatchfile(file)
    tally += 1;
    pbar.update(tally/TOTAL_PATCH_FILES_AFTER_0)
  }
  
  console.log(`phase ${i} queue done!`);
  console.timeEnd(`phase ${i} time`);
}
pbar.stop()