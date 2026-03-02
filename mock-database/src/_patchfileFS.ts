import fs from 'fs/promises'
import path from 'path'
import _ from 'lodash'
import { is } from '@cougargrades/types';
import { AppendAction, ArrayUnionAction, CreateAction, IncrementAction, MergeAction, Patchfile, WriteAction } from '@cougargrades/types/dist/Patchfile';
import { arrayUnion, docRef, exists, get, increment, merge, mergeByPaths, set } from './_firestoreFS.js';

/**
 * Patchfile operations actually used in practice
 * - write (write entire objects)
 * - append (many combinations of single/many and object/DocRef)
 * - merge (but only top-level properties)
 */

export async function processPatchfile(file: string): Promise<void> {
  const shortName = path.basename(file)
  try {
    const contents = await fs.readFile(file, { encoding: 'utf8' });
    const decoded = JSON.parse(contents);
    if(is.Patchfile(decoded)) {
      //console.log(`- started executing ${shortName}`)
      await executePatchFile(decoded);
      //console.log(`- finished executing ${shortName}`)
    }
  }
  catch(err) {
    console.error(`Failed to process patchfile ${shortName}:`,err);
  }
}

/**
 * Patchfile execution
 * Pasted from: https://github.com/cougargrades/types/blob/0e307be4273854277c4711052672fdc0fddd3819/src/PatchfileUtil.ts#L139
 * Adapted for usage with `_firestoreFS`
 */
export async function executePatchFile(patch: Patchfile) {
  // check for actions which require something to already exist
  for(const action of patch.actions) {
    if (action.operation === 'append' && ! await checkPossiblePatchAppendOperation(patch, action as AppendAction))
      throw `[PatchfileUtil] Patchfile execution isn't possible: ${action.operation} won't be able complete.`;
    if (action.operation === 'arrayUnion' && ! await checkPossiblePatchArrayUnionOperation(patch, action as ArrayUnionAction))
      throw `[PatchfileUtil] Patchfile execution isn't possible: ${action.operation} won't be able complete.`;
    if (action.operation === 'increment' && ! await checkPossiblePatchIncrementOperation(patch, action as IncrementAction))
      throw `[PatchfileUtil] Patchfile execution isn't possible: ${action.operation} won't be able complete.`;
  }
  // execute actions
  for (const action of patch.actions) {
    if (action.operation === 'write')
      await commitPatchWriteOperation(patch, action as WriteAction);
    if (action.operation === 'merge')
      await commitPatchMergeOperation(patch, action as MergeAction);
    if (action.operation === 'append')
      await commitPatchAppendOperation(patch, action as AppendAction);
    if (action.operation === 'arrayUnion')
      await commitPatchArrayUnionOperation(patch, action as ArrayUnionAction);
    if (action.operation === 'increment')
      await commitPatchIncrementOperation(patch, action as IncrementAction);
    if (action.operation === 'create')
      await commitPatchCreateOperation(patch, action as CreateAction);
  }
}

/**
 * Document exclusive operations
 */
async function commitPatchWriteOperation(
  patch: Patchfile,
  action: WriteAction,
) {
  await set(patch.target.path, action.payload)
}

async function commitPatchMergeOperation(
  patch: Patchfile,
  action: MergeAction,
) {
  if (await exists(patch.target.path)) {
    await merge(patch.target.path, action.payload)
  }
}

async function commitPatchAppendOperation(
  patch: Patchfile,
  action: AppendAction,
) {
  const targetExists = await exists(patch.target.path);
  
  if(targetExists) {
    const existingData = await get(patch.target.path);

    if(Array.isArray(_.get(existingData, action.arrayfield))) {
      if(action.datatype === 'firebase.firestore.DocumentReference') {
        if(action.many) {
          const refsToAppend = Array.from(action.payload).map(e => docRef(e as string))
          await arrayUnion(patch.target.path, {
            [action.arrayfield]: [ ...refsToAppend ]
          })
        }
        else {
          await arrayUnion(patch.target.path, {
            [action.arrayfield]: [ docRef(action.payload) ]
          })
        }
      }
      else {
        if(action.many) {
          await arrayUnion(patch.target.path, {
            [action.arrayfield]: [ ...action.payload ] // assumes that `action.payload` is an array that can be spread
          })
        }
        else {
          await arrayUnion(patch.target.path, {
            [action.arrayfield]: [ action.payload ]
          })
        }
      }
    }
    else {
      throw "Append operation failed: Target field was not an array";
    }
  }
  else {
    throw "Append operation failed: Target was undefined.";
  }
}

async function commitPatchArrayUnionOperation(
  patch: Patchfile,
  action: ArrayUnionAction,
) {
  const targetExists = await exists(patch.target.path);

  if (!targetExists) throw "ArrayUnion operation failed: Target was undefined.";
  if (!Array.isArray(action.payload)) throw "ArrayUnion operation failed: Payload was not an array";

  const existingData = await get(patch.target.path);
  const fieldData = _.get(existingData, action.arrayfield);

  if (!Array.isArray(fieldData)) throw "ArrayUnion operation failed: Target field was not an array";

  // Works with primitive semantics only
  const dedupedFieldData = new Set(fieldData);

  // Add from payload
  for(let item of action.payload) {
    dedupedFieldData.add(item);
  }

  // Perform the merge
  await mergeByPaths(patch.target.path, {
    [action.arrayfield]: Array.from(dedupedFieldData),
  });
}

async function checkPossiblePatchAppendOperation(
  patch: Patchfile,
  action: AppendAction,
): Promise<boolean> {
  const targetExists = await exists(patch.target.path)
  
  if(targetExists) {
    const existingData = await get(patch.target.path);

    if(Array.isArray(_.get(existingData, action.arrayfield))) {
      return true;
    }
    else {
      console.warn('[PatchfileUtil] Append operation would have failed: Target field was not an array');
      return false;
    }
  }
  else {
    console.warn('[PatchfileUtil] Append operation would have failed: Target was undefined.');
    return false;
  }
}

async function checkPossiblePatchArrayUnionOperation(
  patch: Patchfile,
  action: ArrayUnionAction,
): Promise<boolean> {
  const targetExists = await exists(patch.target.path)
  
  if(targetExists) {
    const existingData = await get(patch.target.path);

    if(Array.isArray(_.get(existingData, action.arrayfield))) {
      return true;
    }
    else {
      console.warn('[PatchfileUtil] ArrayUnion operation would have failed: Target field was not an array');
      return false;
    }
  }
  else {
    console.warn('[PatchfileUtil] ArrayUnion operation would have failed: Target was undefined.');
    return false;
  }
}

async function commitPatchIncrementOperation(
  patch: Patchfile,
  action: IncrementAction,
) {
  const targetExists = await exists(patch.target.path)

  if(targetExists) {
    const existingData = await get(patch.target.path);

    if(! isNaN(_.get(existingData, action.field))) {
      await increment(patch.target.path, {
        [action.field]: action.payload
      })
    }
    else {
      throw "Increment operation failed: Target field was not a number";
    }
  }
  else {
    throw "Increment operation failed: Target was undefined.";
  }
}

async function checkPossiblePatchIncrementOperation(
  patch: Patchfile,
  action: IncrementAction,
) {
  const targetExists = await exists(patch.target.path)

  if(targetExists) {
    const existingData = await get(patch.target.path);

    if(! isNaN(_.get(existingData, action.field))) {
      return true;
    }
    else {
      console.warn('[PatchfileUtil] Increment operation would have failed: Target field was not a number');
      return false;
    }
  }
  else {
    console.warn('[PatchfileUtil] Increment operation would have failed: Target was undefined.');
    return false;
  }
}

/**
 * Collection exclusive operations
 */
async function commitPatchCreateOperation(
  patch: Patchfile,
  action: CreateAction,
) {
  throw 'Not Implemented';
  // const collection = db.collection(patch.target.path);
  
  // await txn.set(collection.doc(), action.payload);
}