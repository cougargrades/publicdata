import fs from 'node:fs'
import core_curriculum from '@cougargrades/publicdata/bundle/edu.uh.publications.core/core_curriculum.json' with { type: "json" };
//import core_curriculum from '../tmp/test/edu.uh.publications.core/core_curriculum.json' with { type: "json" };

// import { Group } from '@cougargrades/types';
// import { firebase } from './_firebaseHelper.js';

// export function getCoreCurriculumDocRefs(courseName: string): FirebaseFirestore.DocumentReference<Group>[] {
//   const db = firebase.firestore();
//   return getCoreCurriculumDocPaths(courseName).map(path => db.doc(path) as FirebaseFirestore.DocumentReference<Group>);
// }

export function getCoreCurriculumDocPaths(courseName: string): string[] {
  //const core_curriculum = JSON.parse(fs.readFileSync('../tmp/test/edu.uh.publications.core/core_curriculum.json',  { encoding: 'utf-8' }));

  const [department, catalogNumber] = courseName.trim().split(' ')
  return core_curriculum
    .filter((e: any) => e.department === department && e.catalogNumber === catalogNumber) // finds matches
    .map((e: any) => e.coreCode) // "10"
    .map((e: any) => `/groups/${e}`);
}
