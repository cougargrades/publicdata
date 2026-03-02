import { Average, Course, GPA, GradeDistributionCSVRow as GDR, Group, Instructor, Section, StandardDeviation, Util } from '@cougargrades/types'
import { GradeDistributionCSVRow } from '@cougargrades/types/dist/GradeDistributionCSVRow';
import { getCoreCurriculumDocPaths } from './_dataHelper.js';
import { arrayUnion, arrayUnionComplex, docRef, exists, get, increment, merge, mergeByPaths, set } from './_firestoreFS.js';
import { NestedKeyOf } from './_keyof.js';
import { DEFAULT_META, MetaDocument } from './MetaDocument.js';

// Pasted from @cougargrades/api > whenUploadQueueAdded
export async function whenUploadQueueAdded(record: GradeDistributionCSVRow) {
  //console.time('\tall')
  // create all references
  const coursePath = `catalog/${GDR.getCourseMoniker(record)}`;
  const sectionPath = `sections/${GDR.getSectionMoniker(record)}`
  // In @cougargrades/types v0.1.0 and above, this will be lowercase
  // This is for: https://github.com/cougargrades/web/issues/128
  const instructorPath = `instructors/${GDR.getInstructorMoniker(record)}`
  /**
   * This points to the Subject group for this course
   */
  const groupPath = `groups/${GDR.getGroupMoniker(record)}`
  const coreCurriculumPaths = await getCoreCurriculumDocPaths(GDR.getCourseMoniker(record));
  const metaPath = `meta/meta`

  // perform all reads
  //console.time('\tcheck existence')
  const courseExists = await exists(coursePath);
  const sectionExists = await exists(sectionPath);
  const instructorExists = await exists(instructorPath);
  //const groupExists = await exists(groupPath);
  const metaExists = await exists(metaPath);

  // bonus reads: check which core curriculum groups exist
  const coreCurriculumPathsThatExist: string[] = [];
  // verify that these groups exist
  for(const coreCoursePath of coreCurriculumPaths) {
    // do a database get
    const snapExists = await exists(coreCoursePath)
    // if it exists, save the ID
    if(snapExists) coreCurriculumPathsThatExist.push(coreCoursePath);
  }
  //console.timeEnd('\tcheck existence')

  // denoted variables to cache the result from the snapshot
  let courseData: Course;
  let sectionData: Section;
  let instructorData: Instructor;
  let metaDocData: MetaDocument;

  /**
   * Variables to hold the updates we're going to compose, then send off
   * 
   * When updating these partials, a special type will be used because 
   * we will address individual fields with dotted-strings due
   * to how Firestore processes updates.
   * 
   * See: https://firebase.google.com/docs/reference/js/firebase.firestore.Transaction#data:-updatedata
   */
  let courseToUpdate: Partial<Course> & Partial<Record<NestedKeyOf<Course>, any>> = {};
  let sectionToUpdate: Partial<Section> & Partial<Record<NestedKeyOf<Section>, any>> = {};
  let instructorToUpdate: Partial<Instructor> & Partial<Record<NestedKeyOf<Instructor>, any>> = {};
  let groupToUpdate: Partial<Group> & Partial<Record<NestedKeyOf<Group>, any>> = {};

  /**
   * ----------------
   * Check Firestore for existence of all the things and set defaults.
   * 
   * Default values (provided by @cougargrades/types) CANNOT contain 
   * Firestore document references due to the nature of how the 
   * Firestore SDK works. Because of that, we will update those
   * fields later.
   * ----------------
   */

  //console.time('\tset defaults')

  // if course doesn't exist
  if (!courseExists) {
    // create default course with record data
    await set(coursePath, GDR.toCourse(record));
    courseData = GDR.toCourse(record);
  } else {
    // if course already exists
    // cache real course data for use in this trigger
    courseData = await get(coursePath)
  }

  // if section doesn't exist
  if (!sectionExists) {
    // create default section with record data
    await set(sectionPath, GDR.toSection(record));
    sectionData = GDR.toSection(record);
  } else {
    sectionData = await get(sectionPath)
  }

  // if instructor doesn't exist
  if (!instructorExists) {
    // create default instructor with record data
    await set(instructorPath, GDR.toInstructor(record))
    instructorData = GDR.toInstructor(record);
  } else {
    // if instructor already exists
    // save instructor course data
    instructorData = await get(instructorPath)
  }

  // 2026-03-01: We don't want to create the "subject" group here. It should be left to the Patchfiles.
  // if group doesn't exist
  // if (!groupExists) {
  //   // create default group with record data
  //   await set(groupPath, GDR.toGroup(record))
  //   //groupData = GDR.toGroup(record); // TODO: why was this commented out in the original code? what do we do with it here?
  // }
  // else {
  //   // TODO: why was this commented out in the original code? what do we do with it here? was it because it went unused?
  //   // if group already exists
  //   // save group data
  //   //groupData = groupSnap.data() as Group;
  // }

  if (!metaExists) {
    await set(metaPath, DEFAULT_META);
    metaDocData = DEFAULT_META;
  }
  else {
    metaDocData = await get(metaPath);
  }

  //console.timeEnd('\tset defaults')

  /**
   * ----------------
   * Now that defaults are set, we're going to update all the references set between each document.
   * These references can't be set by @cougargrades/types (see above why), so we have to do it here.
   * ----------------
   */

  //console.time('\tupdate references')

  // update course to include include instructors
  await arrayUnion<Course>(coursePath, {
    instructors: [ docRef(instructorPath) ],
    sections: [ docRef(sectionPath) ],
    groups: [ docRef(groupPath) ],
  })

  // update section to include the instructor submitted
  // arrayUnion prevents a duplicate
  await arrayUnionComplex<Section>(sectionPath, {
    instructorNames: [{
      firstName: record.INSTR_FIRST_NAME,
      lastName: record.INSTR_LAST_NAME,
    }],
    instructors: [ docRef(instructorPath) ],
  })

  await arrayUnion<Instructor>(instructorPath, {
    courses: [ docRef(coursePath) ],
    sections: [ docRef(sectionPath) ],
  })

  await arrayUnion<Group>(groupPath, {
    courses: [ docRef(coursePath) ],
    sections: [ docRef(sectionPath) ],
  })

  //console.timeEnd('\tupdate references')


  /**
   * ----------------
   * Update GPA stuff
   * ----------------
   */

  //console.time('\tupdate course GPA')

  // Course
  // if the section doesn't exist, then we want to include this data in our Course calculation
  if (!sectionExists) {

    /**
     * @cougargrades/types will initialize the Course.GPA field, 
     * so we have to be careful not to overwrite our running total
     * with the starting values of just one.
     * 
     * If the course already exists, we can confidently say that
     * the GPA information inside of courseData is the 
     * running total and NOT the values of just this record.
     */
    if (courseExists) {
      /**
       * don't include record in GPA if:
       * - missing AVG
       * - AVG of 0 (sus)
       * - totalEnrolled of 0
       */
      //(record.AVG_GPA !== null)
      // TODO: use `GDR.safeToIncludeGPA(record)`
      if (GDR.safeToIncludeGPA(record) && record.AVG_GPA !== null) {
        // include in GPA
        GPA.include(courseData.GPA, record.AVG_GPA);

        // save GPA updates to disk
        await mergeByPaths<Course>(coursePath, {
          'GPA._average.n': courseData.GPA._average.n,
          'GPA._average.sum': courseData.GPA._average.sum,
          'GPA.average': Average.value(courseData.GPA._average),
          'GPA._standardDeviation.n': courseData.GPA._standardDeviation.n,
          'GPA._standardDeviation.delta': courseData.GPA._standardDeviation.delta,
          'GPA._standardDeviation.mean': courseData.GPA._standardDeviation.mean,
          'GPA._standardDeviation.M2': courseData.GPA._standardDeviation.M2,
          'GPA._standardDeviation.ddof': courseData.GPA._standardDeviation.ddof,
          'GPA.standardDeviation': StandardDeviation.value(courseData.GPA._standardDeviation,),
          'GPA._mmr.maximum': courseData.GPA._mmr.maximum,
          'GPA._mmr.minimum': courseData.GPA._mmr.minimum,
          'GPA._mmr.range': courseData.GPA._mmr.range,
          'GPA.maximum': courseData.GPA._mmr.maximum,
          'GPA.minimum': courseData.GPA._mmr.minimum,
          'GPA.range': courseData.GPA._mmr.range,
        })
      }
    }
  }

  //console.timeEnd('\tupdate course GPA')

  // Instructor
  /**
   * In premise, we want to include the GPA calculation if the provided 
   * Instructor ISN'T part of the existing known instructors. We don't
   * want to count a section twice for a specific instructor.
   * 
   * However, @cougargrades/types will initialize the Section.instructorNames field
   * when this Section is first created. That means that checking if the
   * Instructor is included in instructorNames works fine for the >=2nd instructor, 
   * but WON'T work for the first instructor.
   * 
   * However, the first instructor is added when the Section doesn't exist, so we can
   * check against that.
   */

  //console.time('\tupdate instructor GPA')
  // If the section doesn't exist (first instructor) OR if the proposed instructor isn't included in Section.instructorNames (2nd and onward instructor)
  if (!sectionExists || (Array.isArray(sectionData.instructorNames) && sectionData.instructorNames.findIndex(e => e.firstName.toLowerCase() === record.INSTR_FIRST_NAME.toLowerCase() && e.lastName.toLowerCase() === record.INSTR_LAST_NAME.toLowerCase()) === -1)) {

    /**
     * @cougargrades/types will initialize the Instructor.GPA field, 
     * so we have to be careful not to overwrite our running total
     * with the starting values of just one.
     * 
     * If the instructor already exists, we can confidently say that
     * the GPA information inside of instructorData is the 
     * running total and NOT the values of just this record.
     */
    if (instructorExists) {
      // check if record has missing AVG
      // TODO: use `GDR.safeToIncludeGPA(record)`
      if (GDR.safeToIncludeGPA(record) && record.AVG_GPA !== null) {
        // include in GPA
        GPA.include(instructorData.GPA, record.AVG_GPA);

        // save GPA updates to disk
        await mergeByPaths<Instructor>(instructorPath, {
          'GPA._average.n': instructorData.GPA._average.n,
          'GPA._average.sum': instructorData.GPA._average.sum,
          'GPA.average': Average.value(instructorData.GPA._average),
          'GPA._standardDeviation.n': instructorData.GPA._standardDeviation.n,
          'GPA._standardDeviation.delta': instructorData.GPA._standardDeviation.delta,
          'GPA._standardDeviation.mean': instructorData.GPA._standardDeviation.mean,
          'GPA._standardDeviation.M2': instructorData.GPA._standardDeviation.M2,
          'GPA._standardDeviation.ddof': instructorData.GPA._standardDeviation.ddof,
          'GPA.standardDeviation': StandardDeviation.value(instructorData.GPA._standardDeviation),
          'GPA.maximum': instructorData.GPA._mmr.maximum,
          'GPA.minimum': instructorData.GPA._mmr.minimum,
          'GPA.range': instructorData.GPA._mmr.range,
        })
      }
    }
  }

  //console.timeEnd('\tupdate instructor GPA')


  /**
   * ----------------
   * Update Enrollment stuff
   * ----------------
   */

  //console.time('\tupdate course Enrollment')

  // if the section doesn't exist, then we want to include this data in our Course calculation
  if (!sectionExists) {

    /**
     * @cougargrades/types will initialize the Course.Enrollment field, 
     * so we have to be careful not to overwrite our running total
     * with the starting values of just one.
     * 
     * If the course already exists, we can confidently say that
     * the enrollment information inside of courseData is the 
     * running total and NOT the values of just this record.
     */
    if (courseExists) {

      // get enrollment values for JUST THIS record and NOT the running total
      const { totalA, totalB, totalC, totalD, totalF, totalS, totalNCR, totalW, totalEnrolled } = GDR.toCourse(record).enrollment;

      // save our Enrollment changes to disk
      await increment<Course>(coursePath, {
        'enrollment.totalA': totalA,
        'enrollment.totalB': totalB,
        'enrollment.totalC': totalC,
        'enrollment.totalD': totalD,
        'enrollment.totalF': totalF,
        'enrollment.totalS': totalS,
        'enrollment.totalNCR': totalNCR,
        'enrollment.totalW': totalW,
        'enrollment.totalEnrolled': totalEnrolled,
      })
    }
  }

  //console.timeEnd('\tupdate course Enrollment')

  // Instructor
  /**
   * In premise, we want to include the Enrollment calculation if the provided 
   * Instructor ISN'T part of the existing known instructors. We don't
   * want to count a section twice for a specific instructor.
   * 
   * However, @cougargrades/types will initialize the Section.instructorNames field
   * when this Section is first created. That means that checking if the
   * Instructor is included in instructorNames works fine for the >=2nd instructor, 
   * but WON'T work for the first instructor.
   * 
   * However, the first instructor is added when the Section doesn't exist, so we can
   * check against that.
   */

  //console.time('\tupdate instructor Enrollment')
  
  // If the section doesn't exist (first instructor) OR if the proposed instructor isn't included in Section.instructorNames (2nd and onward instructor)
  if (!sectionExists || (Array.isArray(sectionData.instructorNames) && sectionData.instructorNames.findIndex(e => e.firstName.toLowerCase() === record.INSTR_FIRST_NAME.toLowerCase() && e.lastName.toLowerCase() === record.INSTR_LAST_NAME.toLowerCase()) === -1)) {

    /**
     * Now that we've determined that this section hasn't been submitted before with this instructor,
     * we need to verify that this instructor isn't brand new.
     * 
     * If the instructor is brand new, then the enrollment field is already supplied when the instructor
     * was initialized above.
     * 
     * TL;DR Brand new instructors shouldn't be incremented
     * TL;DR Only old instructors should be incremented
     */

    if (instructorExists) {
      // get enrollment values for JUST THIS record and NOT the running total
      const { totalA, totalB, totalC, totalD, totalF, totalS, totalNCR, totalW, totalEnrolled } = GDR.toInstructor(record).enrollment;

      // save our Enrollment changes to disk
      await increment<Instructor>(instructorPath, {
        'enrollment.totalA': totalA,
        'enrollment.totalB': totalB,
        'enrollment.totalC': totalC,
        'enrollment.totalD': totalD,
        'enrollment.totalF': totalF,
        'enrollment.totalS': totalS,
        'enrollment.totalNCR': totalNCR,
        'enrollment.totalW': totalW,
        'enrollment.totalEnrolled': totalEnrolled,
      })
    }
  }

  //console.timeEnd('\tupdate instructor Enrollment')

  /**
   * ----------------
   * Update firstTaught/lastTaught stuff
   * ----------------
   */

  //console.time('\tupdate firstTaught/lastTaught + departments count')

  await merge<Course>(coursePath, {
    firstTaught: Math.min(courseData.firstTaught, Util.termCode(record.TERM)),
    lastTaught: Math.max(courseData.lastTaught, Util.termCode(record.TERM)),
  })

  await merge<Instructor>(instructorPath, {
    firstTaught: Math.min(instructorData.firstTaught, Util.termCode(record.TERM)),
    lastTaught: Math.max(instructorData.lastTaught, Util.termCode(record.TERM)),
  })

  // Record the latest and earliest term
  await merge<MetaDocument>(metaPath, {
    earliestTerm: Math.min(metaDocData.earliestTerm, Util.termCode(record.TERM)),
    latestTerm: Math.max(metaDocData.latestTerm, Util.termCode(record.TERM)),
  })
  /**
   * ----------------
   * Update department count stuff
   * ----------------
   */
  
  // update department count, initialize count if does not exist
  await increment<Instructor>(instructorPath, {
    [`departments.${record.SUBJECT}`]: 1
  })

  //console.timeEnd('\tupdate firstTaught/lastTaught + departments count')

  //console.time('\tupdate references (core curr)')

  for(const coreGroupPath of coreCurriculumPathsThatExist) {
    await arrayUnion<Group>(coreGroupPath, {
      sections: [ docRef(sectionPath) ]
    })
  }
  
  // update the core curriculum groups that exist
  for(const coreGroupPath of coreCurriculumPathsThatExist) {
    await arrayUnion<Group>(coreGroupPath, {
      sections: [ docRef(sectionPath) ]
    })
  }

  //console.timeEnd('\tupdate references (core curr)')

  // Are we done? I think we're done
  //console.timeEnd('\tall')
}
