
//import core_curriculum from '@cougargrades/publicdata/bundle/edu.uh.publications.core/core_curriculum.json' with { type: "json" };
//import core_curriculum from '../tmp/test/edu.uh.publications.core/core_curriculum.json' with { type: "json" };

// import { Group } from '@cougargrades/types';
// import { firebase } from './_firebaseHelper.js';

// export function getCoreCurriculumDocRefs(courseName: string): FirebaseFirestore.DocumentReference<Group>[] {
//   const db = firebase.firestore();
//   return getCoreCurriculumDocPaths(courseName).map(path => db.doc(path) as FirebaseFirestore.DocumentReference<Group>);
// }

export async function getCoreCurriculumDocPaths(courseName: string): Promise<string[]> {

  const { default: core_curriculum } = await import('../tmp/test/edu.uh.publications.core/core_curriculum.json', { with: { type: 'json' } });

  const [department, catalogNumber] = courseName.trim().split(' ')
  return core_curriculum
    .filter((e: any) => e.department === department && e.catalogNumber === catalogNumber) // finds matches
    .map((e: any) => e.coreCode) // "10"
    .map((e: any) => `/groups/${e}`);
}
