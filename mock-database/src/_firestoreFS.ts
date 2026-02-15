import fs from 'fs/promises'
import path from 'path'
import _ from 'lodash'
import { NestedKeyOf, Primitive } from './_keyof.js'
//import { firebase } from './_firebaseHelper.js';

const BASE_DIR = './tmp/firebaseFS/'

export async function reset(): Promise<void> {
  await fs.rm(BASE_DIR, { recursive: true, force: true })
}

export async function exists(documentPath: string): Promise<boolean> {
  try {
    await _prepDirectory(documentPath)
    await fs.access(`${BASE_DIR}${documentPath}.json`)
    return true
  }
  catch {
    return false
  }
}

async function _prepDirectory(documentPath: string): Promise<void> {
  await fs.mkdir(path.dirname(`${BASE_DIR}${documentPath}`), { recursive: true })
}

export async function get<T>(documentPath: string): Promise<T> {
  await _prepDirectory(documentPath);
  return JSON.parse(await fs.readFile(`${BASE_DIR}${documentPath}.json`, { encoding: 'utf-8'}))
}

export async function set<T>(documentPath: string, data: T): Promise<void> {
  await _prepDirectory(documentPath);
  return await fs.writeFile(`${BASE_DIR}${documentPath}.json`, JSON.stringify(data, null, 2))
}

/**
 * This does not have feature parity with the Firestore `update()` function.
 * Things like FieldValue and updating by the path aren't supported.
 * You'll have to use the standalone functions below.
 * 
 * This is quite literally just:
 * ```
 * await set<T>(documentPath, {
    ...existingData,
    ...data,
  })
 * ```
 * 
 * @param documentPath 
 * @param data 
 * @returns 
 */
export async function merge<T>(documentPath: string, data: Partial<T>): Promise<void> {
  const existingData = await get<T>(documentPath)

  return await set<T>(documentPath, {
    ...existingData,
    ...data,
  })
}

/**
 * Due to my inability to implement `NestedKeyOf` correctly, 
 * this doesn't offer any type safety and should be used very cautiously.
 */
export async function mergeByPaths<T extends object>(documentPath: string, dictionary: Partial<Record<NestedKeyOf<T>, any>>): Promise<void> {
  const data = await get<T>(documentPath)
  for (let key of Object.keys(dictionary) as [NestedKeyOf<T>]) {
    _.set(data, key, dictionary[key])
  }
  return await set(documentPath, data)
}

/**
 * Accepts an object where the keys are dot-delimited paths to an object's properties, and the values are the numeric delta/change to make to that document.
 * @param documentPath 
 * @param increments 
 * @returns 
 */
export async function increment<T extends object>(documentPath: string, increments: Partial<Record<NestedKeyOf<T>, number>>): Promise<void> {
  const data = await get<T>(documentPath)
  for (let key of Object.keys(increments) as [NestedKeyOf<T>]) {
    const value = _.get(data, key)
    const delta = increments[key];
    // If the get returned a number
    if (typeof value === 'number' && typeof delta === 'number') {
      _.set(data, key, value + delta)
    }
    // If it didn't return a number, set it to the delta to start (assume does-not-exist is the same as zero)
    else {
      _.set(data, key, delta)
    }
  }
  return await set(documentPath, data)
}

/**
 * Accepts an object where the keys are dot-delimited paths to an object's properties, and the values are the numeric delta/change to make to that document.
 * @param documentPath 
 * @param increments 
 * @returns 
 */
export async function arrayUnion<T extends object>(documentPath: string, unions: Partial<Record<NestedKeyOf<T>, Array<Primitive>>>): Promise<void> {
  const data = await get<T>(documentPath)
  for (let key of Object.keys(unions) as [NestedKeyOf<T>]) {
    const value = _.get(data, key)
    const delta = unions[key];
    // If the user provided something useful
    if (Array.isArray(delta)) {
      // If the stored value has something useful
      if(Array.isArray(value)) {
        // check if the union involves only primitives, because then we can do a much more performant union
        const result = Array.from(new Set([...value, ...delta]));
          _.set(data, key, result)
      }
      // Initialize if not already set
      else {
        _.set(data, key, delta)
      }
    }
  }
  return await set(documentPath, data)
}

/**
 * Accepts an object where the keys are dot-delimited paths to an object's properties, and the values are the numeric delta/change to make to that document.
 * @param documentPath 
 * @param increments 
 * @returns 
 */
export async function arrayUnionComplex<T extends object>(documentPath: string, unions: Partial<Record<NestedKeyOf<T>, Array<any>>>): Promise<void> {
  const data = await get<T>(documentPath)
  for (let key of Object.keys(unions) as [NestedKeyOf<T>]) {
    const value = _.get(data, key)
    const delta = unions[key];
    // If the user provided something useful
    if (Array.isArray(delta)) {
      // If the stored value has something useful
      if(Array.isArray(value)) {
        // actually do a union, thanks lodash
        const result = _.unionWith(value, delta, _.isEqual);
        _.set(data, key, result)
      }
      // Initialize if not already set
      else {
        _.set(data, key, delta)
      }
    }
  }
  return await set(documentPath, data)
}

export const FS_DOC_REF_SENTINEL = 'firebase.firestore.DocumentReference'

export type FSDocumentReference<T = any> = `FSDR://${string}`

export function docRef<T = any>(documentPath: string): FSDocumentReference {
  //return `FSDR://${documentPath}`
  return `FSDR:///${_.trimStart(documentPath, '/')}`
}

export function isObject(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj)
}

export function isPrimitive(value: unknown): value is Primitive {
  return value === null || ['string', 'number', 'bigint', 'boolean', 'undefined', 'symbol'].includes(typeof value)
}

export function isPrimitiveArray(value: unknown[]): value is Primitive[] {
  //return value.filter(isPrimitive).length === value.length
  return value.findIndex(v => !isPrimitive(v)) === -1
}

export function isFSDocumentReference(obj: unknown): obj is FSDocumentReference {
  return typeof obj === 'string' && obj.startsWith('FSDR://')
}

function getPathsForPredicate(value: unknown, predicate: (value: unknown) => boolean, path: string = ''): string[] {
  if(Array.isArray(value)) {
    //console.log('arrays: ',value)
    return [
      ...(
        value.map((v,i) => getPathsForPredicate(v, predicate, `${path}[${i}]`)).flat(10)
      )
    ]
  }
  else if (_.isObjectLike(value)) {
    //console.log('object: ', value)
    if (predicate(value)) {
      return [`${path}`]
    }
    else {
      const plain = _.toPlainObject(value)
      return [
        ...(
          Object.keys(plain).map(key => getPathsForPredicate(plain[key], predicate, path === '' ? `${key}` : `${path}.${key}`)).flat(10)
        )
      ]
    }
  }
  else {
    if (predicate(value)) {
      return [`${path}`]
    }
    else {
      return []
    }
  }
}

// function synthesizeFirestoreReference(ref: FSDocumentReference) {
//   return firebase.firestore().doc(ref.substring('FSDR://'.length))
// }

// /**
//  * Takes an otherwise ready to upload document and prepares it for upload to Firestore by changing 
//  * out instances of `FSDocumentReference` with real Firestore references.
//  * @param data 
//  * @returns 
//  */
// export function synthesizeFirestoreData(data: any): any {
//   const paths = getPathsForPredicate(data, v => isFSDocumentReference(v))
//   //console.log('paths: ', paths)
//   for(let path of paths) {
//     const dataAtPath = _.get(data, path)
//     //console.log('dataAtPath:', dataAtPath)
//     if (isFSDocumentReference(dataAtPath)) {
//       //console.log('is FSDR!')
//       const docRef = synthesizeFirestoreReference(dataAtPath)
//       //console.log('docRef: ', docRef)
//       _.set(data, path, docRef)
//     }
//   }
//   return data
// }

export async function listDocuments(collectionName: string): Promise<string[]> {
  const files = await fs.readdir(`${BASE_DIR}${collectionName}`);
  return files.map(file => `${collectionName}/${path.basename(file, 'json')}`)
}
