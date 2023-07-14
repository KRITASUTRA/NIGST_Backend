const pool = require("../config/pool");
const fs = require('fs')



exports.updateAdminVerificationStatus = async (req, res) => {
  let client
  try {
    const { email, status } = req.body;

    client = await pool.connect();

    // Check if user with email exists
    const checkQuery = 'SELECT * FROM users WHERE email = $1';
    const result = await client.query(checkQuery, [email]);

    if (result.rowCount === 0) {
      res.status(404).send({ message: 'User not found' });
      return;
    }

    // Update admin_verified status of user
    const updateQuery = 'UPDATE users SET admin_verified = $1 WHERE email = $2';
    await client.query(updateQuery, [status, email]);

    return res.status(200).send({ message: 'Admin verification status updated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Something went wrong' });
  } finally {
    if (client) {
      await client.release();
    }
  }
};



exports.loginAccess = async (req, res) => {
  let client
  try {
    const { access, email } = req.body;
    client = await pool.connect();
    const check = 'SELECT * FROM faculty WHERE email=$1';
    const result = await client.query(check, [email]);
    if (result.rowCount === 0) {
      return res.status(404).send({ message: 'Nothing to show!.' });
    } else {
      const updation = 'UPDATE faculty SET admin_verified= $1 WHERE email=$2';
      const data = [access, email];
      await client.query(updation, data);
      return res.status(200).send({ message: 'Access Changed!.' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Internal Server Error.' });
  } finally {
    if (client) {
      await client.release();
    }
  }
};


exports.activeInactive = async (req, res) => {
  let client
  try {
    const { change, email } = req.body;
    client = await pool.connect();
    const check = 'SELECT * FROM faculty WHERE email=$1';
    const result = await client.query(check, [email]);
    if (result.rowCount === 0) {
      return res.status(404).send({ message: 'Nothing to show!.' });
    } else {
      const updation = 'UPDATE faculty SET status= $1 WHERE email=$2';
      const data = [change, email];
      await client.query(updation, data);
      return res.status(200).send({ message: 'Access Changed!.' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Internal Server Error.' });
  } finally {
    if (client) {
      await client.release();
    }
  }
};




// exports.updateScheduling = async (req, res) => {
//   let client;

//   try {
//     const { status, batch, courseID, newStatus, newRunningDate, newComencementDate, newCompletionDate } = req.body;
//     const check = 'SELECT * FROM course_scheduler WHERE course_status=$1 AND batch_no=$2 AND course_id=$3';
//     const data = [status, batch, courseID];
//     const data1 = [newStatus, status, batch, courseID];

//     client = await pool.connect();
//     const result = await client.query(check, data);

//     if (result.rowCount === 0) {
//       return res.status(404).send({ message: 'Record Not Exists!.' });
//     } else {
//       const statusCheck = result.rows[0].course_status;

//       switch (statusCheck) {
//         case 'running':
//           if (newStatus === 'completed') {
//             const updateCompleted = 'UPDATE course_scheduler SET course_status=$1 WHERE course_status=$2 AND batch_no=$3 AND course_id=$4';
//             await client.query(updateCompleted, [newStatus, statusCheck, batch, courseID]);
//             return res.status(200).send({ message: 'Successfully Changed.' });
//           } else {
//             return res.send({ message: `Can't change running status to ${newStatus}` });
//           }
//           break;
//         case 'completed':
//           return res.send({ message: "It can't be changed" });
//           break;
//         case 'created':
//           if (newStatus === 'canceled') {
//             const cancelCheck='INSERT INTO  course_scheduler_archive (name,course_id,course_capacity,date_comencement,date_completion,currency,fee,batch_no.course_status,running_date,course_scheduler_id,scheduled_at) SELECT (name,course_id,course_capacity,date_comencement,date_completion,currency,fee,batch_no.course_status,running_date,course_scheduler_id,scheduled_at) FROM course_scheduler WHERE course_id=$1'
//             const cancelResult=await client.query(cancelCheck,[courseID])


//             return res.send({ message: 'This feature not implemented yet.' });
//           } else if (newStatus === 'postponed') {
//             const newDate01 = '9999/02/03';
//             const updateCreatedP = 'UPDATE course_scheduler SET course_status=$1,date_comencement=$2,date_completion=$3,running_date=$4 WHERE course_status=$5 AND batch_no=$6 AND course_id=$7';
//             const dataS = [newStatus, newDate01, newDate01, newDate01, statusCheck, batch, courseID];
//             await client.query(updateCreatedP, dataS);
//             return res.status(200).send({ message: 'Successfully Changed!.' });
//           } else if (newStatus === 'scheduled') {
//             const updateCreatedS = 'UPDATE course_scheduler SET course_status=$1 WHERE course_status=$2 AND batch_no=$3 AND course_id=$4';
//             await client.query(updateCreatedS, data1);
//             return res.status(200).send({ message: 'Successfully Changed!.' });
//           } else {
//            return res.send({ message: 'Not Allowed To Change' });
//           }
//           break;
//         case 'scheduled':
//           if (newStatus === 'running') {
//             const update01 = 'UPDATE course_scheduler SET course_status=$1 WHERE course_status=$2 AND batch_no=$3 AND course_id=$4';
//             await client.query(update01, data1);
//             return res.status(200).send({ message: 'Successfully Changed!.' });
//           } else if (newStatus === 'canceled') {
//             const cancelCheck='INSERT INTO  course_scheduler_archive (name,course_id,course_capacity,date_comencement,date_completion,currency,fee,batch_no.course_status,running_date,course_scheduler_id,scheduled_at) SELECT (name,course_id,course_capacity,date_comencement,date_completion,currency,fee,batch_no.course_status,running_date,course_scheduler_id,scheduled_at) FROM course_scheduler WHERE course_id=$1'
//             const cancelResult=await client.query(cancelCheck,[courseID])

//             const getEnrol='SELECT * FROM enrolment WHERE scheduling_id=$1'
//             const enrolResult=await client.query(getEnrol,[cancelResult.rows[0].course_scheduler_id])
//             if (enrolResult.rowCount===0) {
//               return 
//             }
//             const moveStudents='INSERT INTO archive_enrolment (scheduling_id,student_id,course_paid_status,enrolment_status,nigst_approval,enrolment_date,enrolment_id) SELECT (scheduling_id,student_id,course_paid_status,enrolment_status,nigst_approval,enrolment_date,enrolment_id)  FROM enrolment WHERE scheduling_id=$1'
//             await client.query(moveStudents,[cancelResult.rows[0].course_scheduler_id])

//             return res.send({ message: 'This feature not implemented yet.' });
//           } else if (newStatus === 'postponed') {
//             const newDate = '9999/02/03';
//             const update02 = 'UPDATE course_scheduler SET course_status=$1,date_comencement=$2,date_completion=$3,running_date=$4 WHERE course_status=$5 AND batch_no=$6 AND course_id=$7';
//             const dataS = [newStatus, newDate, newDate, newDate, statusCheck, batch, courseID];
//             await client.query(update02, dataS);
//             return res.status(200).send({ message: 'Successfully Changed!.' });
//           } else {
//             return res.send({ message: 'Not allowed to update this course to completed or created' });
//           }
//           break;
//         case 'postponed':
//           if (newStatus === 'created') {
//             if (!newCompletionDate || !newComencementDate || !newRunningDate) {
//               return res.status(400).send({ message: 'newCompletionDate, newComencementDate, and newRunningDate are required.' });
//             }
//             const updatePostponedC = 'UPDATE course_scheduler SET course_status=$1,date_comencement=$2,date_completion=$3,running_date=$4 WHERE course_status=$5 AND batch_no=$6 AND course_id=$7';
//             const dataS1 = [newStatus, newComencementDate, newCompletionDate, newRunningDate, statusCheck, batch, courseID];
//             await client.query(updatePostponedC, dataS1);
//             return res.status(200).send({ message: 'Successfully Changed!.' });
//           } else if (newStatus === 'canceled') {
//             const cancelCheck='INSERT INTO  course_scheduler_archive (name,course_id,course_capacity,date_comencement,date_completion,currency,fee,batch_no.course_status,running_date,course_scheduler_id,scheduled_at) SELECT (name,course_id,course_capacity,date_comencement,date_completion,currency,fee,batch_no.course_status,running_date,course_scheduler_id,scheduled_at) FROM course_scheduler WHERE course_id=$1'
//             const cancelResult=await client.query(cancelCheck,[courseID])

//             const getEnrol='SELECT * FROM enrolment WHERE scheduling_id=$1'
//             const enrolResult=await client.query(getEnrol,[cancelResult.rows[0].course_scheduler_id])
//             if (enrolResult.rowCount===0) {
//               return 
//             }
//             const moveStudents='INSERT INTO archive_enrolment (scheduling_id,student_id,course_paid_status,enrolment_status,nigst_approval,enrolment_date,enrolment_id) SELECT (scheduling_id,student_id,course_paid_status,enrolment_status,nigst_approval,enrolment_date,enrolment_id)  FROM enrolment WHERE scheduling_id=$1'
//             await client.query(moveStudents,[cancelResult.rows[0].course_scheduler_id])
//             return res.send({ message: 'This feature not implemented yet.' });
//           } else {
//             return res.send({ message: 'You are not allowed to change to this status' });
//           }
//           break;
//         default:
//          return res.send({ message: 'Something went wrong!.' });
//           break;
//       }
//     }
//   } catch (error) {
//     console.error(error);
//    return res.status(500).send({ message: 'Internal Server Error!.' });
//   } finally {
//     if (client) {
//       await client.release();
//     }
//   }
// };

exports.updateScheduling = async (req, res) => {

  let client

  try {

    const { status, batch, courseID, newStatus, newRunningDate, newComencementDate, newCompletionDate } = req.body

    const check = 'SELECT * FROM course_scheduler WHERE course_status=$1 AND batch_no=$2 AND course_id=$3'

    const data = [status, batch, courseID]

    const data1 = [newStatus, status, batch, courseID]


    client = await pool.connect()

    await client.query('BEGIN')

    const result = await client.query(check, data)

    if (result.rowCount === 0) {

      await client.query('ROLLBACK')

      return res.status(404).send({ message: 'Record Not Exists!.' })

    }
    else {

      const statusCheck = result.rows[0].course_status

      switch (statusCheck) {

        case 'running':

          if (newStatus === 'completed') {

            const updateCompleted = 'UPDATE course_scheduler SET course_status=$1 WHERE course_status=$2 AND batch_no=$3 AND course_id=$4'

            await client.query(updateCompleted, [newStatus, statusCheck, batch, courseID])

            await client.query('COMMIT')

            return res.status(200).send({ message: 'Successfully Changed.' })

          }

          else {

            await client.query('COMMIT')

            return res.send({ message: `Can't change running status to ${newStatus}` })
          }

        case 'completed':

          await client.query('COMMIT')

          return res.send({ message: "It can't be changed" })

        case 'created':
          if (newStatus === 'canceled') {
            const deleteOrgRecords = `DELETE FROM organization_course_assi WHERE scheduling_id IN (SELECT course_scheduler_id FROM course_scheduler WHERE course_id = $1 AND batch_no = $2 AND course_status = $3 )  `

            const deleteRecord = 'DELETE FROM course_scheduler WHERE course_id = $1 AND batch_no = $2 AND course_status = $3'

            const departmentCheck = `SELECT * FROM course_scheduler
              WHERE course_id = $1 AND batch_no = $2 AND course_status = $3`

            const departmentResult = await client.query(departmentCheck, [courseID, batch, status])

            if (departmentResult.rows.length === 0) {

              await client.query(deleteRecord, [courseID, batch, status])

            } else {

              const deleteDepartment = `DELETE FROM organization_course_assi WHERE scheduling_id IN ( SELECT course_scheduler_id FROM course_scheduler WHERE course_id = $1 AND batch_no = $2 AND course_status = $3) `
              const moveCourseScheduler = 'INSERT INTO course_scheduler_archive SELECT * FROM course_scheduler WHERE course_scheduler_id=$1'
              await client.query(moveCourseScheduler, [departmentCheck.rows[0].course_scheduler_id])
              await client.query(deleteDepartment, [courseID, batch, status])

              await client.query(deleteRecord, [courseID, batch, status])

            }

            await client.query('COMMIT')

            return res.send({ message: 'Successfully Changed.' })

          }



          else if (newStatus === 'postponed') {

            const newDate01 = '9999/02/03'

            const updateCreatedP = 'UPDATE course_scheduler SET course_status=$1,date_comencement=$2,date_completion=$3,running_date=$4 WHERE course_status=$5 AND batch_no=$6 AND course_id=$7'

            const dataS = [newStatus, newDate01, newDate01, newDate01, statusCheck, batch, courseID]

            await client.query(updateCreatedP, dataS)

            await client.query('COMMIT')

            return res.status(200).send({ message: 'Successfully Changed!.' })

          }

          else if (newStatus === 'scheduled') {

            const updateCreatedS = 'UPDATE course_scheduler SET course_status=$1 WHERE course_status=$2 AND batch_no=$3 AND course_id=$4'

            await client.query(updateCreatedS, data1)

            await client.query('COMMIT')

            return res.status(200).send({ message: 'Successfully Changed!.' })

          }
          else {

            await client.query('COMMIT')

            return res.send({ message: 'Not Allowed To Change' })

          }

        case 'scheduled':

          if (newStatus === 'running') {

            const update01 = 'UPDATE course_scheduler SET course_status=$1 WHERE course_status=$2 AND batch_no=$3 AND course_id=$4'

            await client.query(update01, data1)

            await client.query('COMMIT')

            return res.status(200).send({ message: 'Successfully Changed!.' })

          }
          else if (newStatus === 'canceled') {

            const cancelCheck = 'SELECT * FROM course_scheduler WHERE course_id=$1 AND batch_no=$2 AND course_status=$3'

            const cancelResult = await client.query(cancelCheck, [courseID, batch, status])

            if (cancelResult.rowCount > 0) {

              const courseSchedulerID = cancelResult.rows[0].course_scheduler_id


              const checkCourseAssi = 'SELECT * FROM organization_course_assi WHERE scheduling_id=$1'

              const courseAssiResult = await client.query(checkCourseAssi, [courseSchedulerID])


              if (courseAssiResult.rowCount > 0) {

                const deleteCourseAssi = 'DELETE FROM organization_course_assi WHERE scheduling_id=$1'

                await client.query(deleteCourseAssi, [courseSchedulerID])

              }


              const getEnrol = 'SELECT * FROM enrolment WHERE scheduling_id=$1'

              const enrolResult = await client.query(getEnrol, [courseSchedulerID])


              if (enrolResult.rowCount > 0) {

                const moveStudents = 'INSERT INTO archive_enrolment (scheduling_id,student_id,course_paid_status,enrolment_status,nigst_approval,enrolment_date,enrolment_id) SELECT scheduling_id,student_id,course_paid_status,enrolment_status,nigst_approval,enrolment_date,enrolment_id FROM enrolment WHERE scheduling_id=$1'

                await client.query(moveStudents, [courseSchedulerID])


                const deleteEnrolment = 'DELETE FROM enrolment WHERE scheduling_id=$1'

                await client.query(deleteEnrolment, [courseSchedulerID])

              }
const moveCourseScheduler = 'INSERT INTO course_scheduler_archive SELECT * FROM course_scheduler WHERE course_scheduler_id=$1'
    await client.query(moveCourseScheduler, [courseSchedulerID])
              const deleteRecord = 'DELETE FROM course_scheduler WHERE course_scheduler_id=$1'

              await client.query(deleteRecord, [courseSchedulerID])

              await client.query('COMMIT')

              return res.send({ message: 'Successfully Changed.' })

            }

            await client.query('ROLLBACK')

            return res.status(400).send({ message: 'No matching course found in the scheduler.' })

          }
          else if (newStatus === 'postponed') {

            const newDate = '9999/02/03'

            const update02 = 'UPDATE course_scheduler SET course_status=$1,date_comencement=$2,date_completion=$3,running_date=$4 WHERE course_status=$5 AND batch_no=$6 AND course_id=$7'

            const dataS = [newStatus, newDate, newDate, newDate, statusCheck, batch, courseID]

            await client.query(update02, dataS)

            await client.query('COMMIT')

            return res.status(200).send({ message: 'Successfully Changed!.' })

          }
          else {

            await client.query('COMMIT')

            return res.send({ message: 'Not allowed to update this course to completed or created' })

          }

        case 'postponed':

          if (newStatus === 'created') {

            if (!newCompletionDate || !newComencementDate || !newRunningDate) {

              await client.query('ROLLBACK')

              return res.status(400).send({ message: 'newCompletionDate, newComencementDate, and newRunningDate are required.' })

            }

            const schedulingDate = new Date()

            const newComencementDateParts = newComencementDate.split("/")

            const newRunningDateParts = newRunningDate.split("/")

            const newCompletionDateParts = newCompletionDate.split("/")

            const newComencementDateObj = new Date(parseInt(newComencementDateParts[0]), parseInt(newComencementDateParts[1]) - 1, parseInt(newComencementDateParts[2]))

            const newRunningDateObj = new Date(parseInt(newRunningDateParts[0]), parseInt(newRunningDateParts[1]) - 1, parseInt(newRunningDateParts[2]))

            const newCompletionDateObj = new Date(parseInt(newCompletionDateParts[0]), parseInt(newCompletionDateParts[1]) - 1, parseInt(newCompletionDateParts[2]))

            const dates = [newComencementDateObj, newRunningDateObj, newCompletionDateObj];



            if (dates.some(date => date < schedulingDate)) {

              await client.query('ROLLBACK')

              return res.status(400).send({
                message: 'newCompletionDate, newComencementDate, and newRunningDate must be later than the current date.',
              })

            }

            const updatePostponedC = 'UPDATE course_scheduler SET course_status=$1,date_comencement=$2,date_completion=$3,running_date=$4,scheduled_at=$5 WHERE course_status=$6 AND batch_no=$7 AND course_id=$8'

            const dataS1 = [newStatus, newComencementDate, newCompletionDate, newRunningDate, schedulingDate, statusCheck, batch, courseID]

            await client.query(updatePostponedC, dataS1)

            await client.query('COMMIT')

            return res.status(200).send({ message: 'Successfully Changed!.' })

          }
          else if (newStatus === 'canceled') {

            const cancelCheck = 'SELECT course_scheduler_id FROM course_scheduler WHERE course_id=$1 AND batch_no=$2 AND course_status=$3'

            const cancelResult = await client.query(cancelCheck, [courseID, batch, status])

            if (cancelResult.rowCount > 0) {

              const courseSchedulerID = cancelResult.rows[0].course_scheduler_id

              const checkCourseAssi = 'SELECT * FROM organization_course_assi WHERE scheduling_id=$1'

              const courseAssiResult = await client.query(checkCourseAssi, [courseSchedulerID])

              if (courseAssiResult.rowCount > 0) {


                const deleteCourseAssi = 'DELETE FROM organization_course_assi WHERE scheduling_id=$1'

                await client.query(deleteCourseAssi, [courseSchedulerID])

              }


              const getEnrol = 'SELECT * FROM enrolment WHERE scheduling_id=$1'

              const enrolResult = await client.query(getEnrol, [courseSchedulerID])

              if (enrolResult.rowCount > 0) {


                const moveStudents = 'INSERT INTO archive_enrolment (scheduling_id,student_id,course_paid_status,enrolment_status,nigst_approval,enrolment_date,enrolment_id) SELECT scheduling_id,student_id,course_paid_status,enrolment_status,nigst_approval,enrolment_date,enrolment_id FROM enrolment WHERE scheduling_id=$1'

                await client.query(moveStudents, [courseSchedulerID])

                const deleteEnrolment = 'DELETE FROM enrolment WHERE scheduling_id=$1'

                await client.query(deleteEnrolment, [courseSchedulerID])

              }
              const moveCourseScheduler = 'INSERT INTO course_scheduler_archive SELECT * FROM course_scheduler WHERE course_scheduler_id=$1'
              await client.query(moveCourseScheduler, [courseSchedulerID])
              const deleteRecord = 'DELETE FROM course_scheduler WHERE course_scheduler_id=$1'

              await client.query(deleteRecord, [courseSchedulerID])

              await client.query('COMMIT')

              return res.send({ message: 'Successfully Changed.' })

            }

            await client.query('ROLLBACK')

            return res.status(400).send({ message: 'No matching course found in the scheduler.' })

          }


          else {

            await client.query('ROLLBACK')

            return res.send({ message: 'You are not allowed to change to this status' })

          }

        default:

          await client.query('ROLLBACK')

          return res.send({ message: 'Something went wrong!.' })

      }
    }
  }
  catch (error) {

    console.error(error)

    await client.query('ROLLBACK')

    return res.status(500).send({ message: 'Internal Server Error!.' })

  }
  finally {

    if (client) {

      await client.query('END')

      await client.release()

    }
  }
}


exports.editAnnouncementForPosting = async (req, res) => {

  let connection

  try {

    const { id } = req.body

    connection = await pool.connect()

    const check = 'SELECT * FROM announcement WHERE a_id=$1'

    const result = await connection.query(check, [id])

    if (result.rowCount === 0) {

      return res.status(404).send({ message: 'This Announcement Not Exists!.' })

    }

    const postedDate = new Date()

    const editQ = 'UPDATE announcement SET status=$1, posted_at=$2 WHERE a_id=$3'

    const data = [true, postedDate, id]

    await connection.query(editQ, data)

    return res.status(200).send({ message: 'Successfully Updated!.' })

  }
  catch (error) {

    console.error(error)

    return res.status(500).send({ message: 'Internal Server Error!.' })

  }
  finally {

    if (connection) {

      await connection.release()

    }
  }
}


exports.updateFacultyDetails = async (req, res) => {

  let connection

  try {
    const { dob, phone, education, designation, facultyid } = req.body
    connection = await pool.connect()
    const check = 'SELECT email FROM faculty WHERE faculty_id=$1'
    const result = await connection.query(check, [facultyid])
    if (result.rowCount === 0) {
      return res.status(404).send({ message: 'Faculty Member Not Exists!.' })
    }
    const updateQ = 'UPDATE faculty SET dob=$1,phone=$2,education=$3,designation=$4 WHERE faculty_id=$5'
    const data = [dob, phone, education, designation, facultyid]
    await connection.query(updateQ, data)
    return res.status(200).send({ message: 'Successfully Updated!.' })
  } catch (error) {
    console.error(error)
    return res.status(500).send({ message: 'Internal Server Error!.' })
  }
  finally {
    if (connection) {
      await connection.release()
    }
  }

}