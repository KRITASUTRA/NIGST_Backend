const sendMail = require("../mailing_Service/mailconfig");
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const transporter = require('../mailing_Service/mailconfig');
const pool = require("../config/pool");
const generateNumericValue = require("../generator/NumericId");
const generatePassword = require('generate-password');
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require('uuid');




exports.facultyCreation = async (req, res) => {

  let client

  try {

    const { first_name, middle_name, last_name, dob, phone, gender, email, education, designation, profile, faculty, loginAccess } = req.body

    client = await pool.connect()

    const checkEmailQuery = 'SELECT * FROM faculty WHERE email=$1'

    const resultEmail = await client.query(checkEmailQuery, [email])

    if (resultEmail.rowCount > 0) {

      return res.status(400).send({ error: 'Faculty already exists' })

    }

    let facultyId = 'T-NIGST' + generateNumericValue(8)

    const query2 = 'SELECT * FROM faculty WHERE faculty_id = $1'

    let result2 = await client.query(query2, [facultyId])

    while (result2.rowCount !== 0) {

      facultyId = 'T-NIGST' + generateNumericValue(8)

      result2 = await client.query(query2, [facultyId])

    }

    const password = generatePassword.generate({
      length: 10,
      numbers: true,
      symbols: true,
      uppercase: true,
      excludeSimilarCharacters: true,
    })

    const salt = await bcrypt.genSalt(10)

    const hashedPass = await bcrypt.hash(password, salt)

    await client.query('BEGIN')

    const data = [first_name, middle_name, last_name, dob, phone, gender, email, education, designation, profile, faculty, loginAccess, facultyId]

    const insertFacultyQuery =
      'INSERT INTO faculty(first_name, middle_name, last_name, dob, phone, gender, email, education, designation, profile, faculty, admin_verified, faculty_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)'

    await client.query(insertFacultyQuery, data)

    const insertPasswordQuery = 'INSERT INTO faculty_passwords(faculty_email, password) VALUES($1, $2)'

    await client.query(insertPasswordQuery, [email, hashedPass])

    await client.query('COMMIT');

    return res.status(200).send({ message: 'Successfully Created' })

  }
  catch (error) {

    await client.query('ROLLBACK')

    console.error(error)

    return res.status(500).send({ message: 'Something went wrong' })

  }
  finally {

    if (client) {

      await client.release()

    }
  }
}






exports.facultyPassForgot = async (req, res) => {

  let connection

  try {

    const { email } = req.body

    connection = await pool.connect()

    const checkQuery = 'SELECT * FROM faculty WHERE email=$1'

    const result1 = await connection.query(checkQuery, [email])

    const checkQuery2 = 'SELECT * FROM faculty_passwords WHERE faculty_email=$1'

    const result2 = await connection.query(checkQuery2, [email])

    if (result1.rows.length === 0 || result2.rowCount === 0) {

      return res.send({ message: 'User not found!' })

    }
    else {

      const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '30m' })

      const resetURL = `${process.env.Admin_dash}#/password/${resetToken}`

      const updateQuery = 'UPDATE faculty_passwords SET reset_token=$1 WHERE faculty_email=$2'

      const updateData = [resetToken, email]

      await connection.query(updateQuery, updateData)

      sendMail(
        `${email}`,
        'Password-reset',
        `<p>You requested for password reset</p><h5>Click on this <a href=${resetURL}>link</a> to reset password</h5><p>It is valid for 30 minutes only</p>`
      )

      return res.send({ message: 'Reset Token sent to email' })

    }
  }
  catch (error) {

    console.error(error)

    return res.status(500).send({ message: 'Internal Server Error!' })

  }
  finally {

    if (connection) {

      await connection.release()

    }
  }
}




exports.facultyLogin = async (req, res) => {

  let client

  try {

    const { email, password } = req.body

    client = await pool.connect()


    const userQuery =` SELECT faculty,faculty_id,email,admin_verified,CONCAT(first_name, ' ', middle_name, ' ', last_name) as name FROM faculty WHERE email = $1`

    const userResult = await client.query(userQuery, [email])


    if (userResult.rows.length === 0) {

      return res.status(404).send('User not exists!')

    }

    const user = userResult.rows[0]

    if (!user.admin_verified) {

      return res.status(401).json({ message: 'User not verified' })

    }

    const facultyEmail = user.email

    const passwordQuery = 'SELECT * FROM faculty_passwords WHERE faculty_email = $1'

    const passwordResult = await client.query(passwordQuery, [facultyEmail])


    if (passwordResult.rows.length === 0) {

      return res.status(401).json({ message: 'Invalid email or password' })

    }

    const storedPassword = passwordResult.rows[0].password

    const passwordMatch = await bcrypt.compare(password, storedPassword)


    if (!passwordMatch) {

      return res.status(401).json({ message: 'Invalid email or password' })

    }

    const tokenPayload = { id: user.email }

    const tokenOptions = { expiresIn: '1d' }

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, tokenOptions)


    return res.status(200).json({ token, type: 'faculty', faculty: user.faculty, id: user.faculty_id,name:user.name })

  }
  catch (error) {

    console.error(error)

    return res.status(500).send('Internal Server Error!')

  }
  finally {

    if (client) {

      await client.release()

    }

  }
}


exports.fPassReset = async (req, res) => {

  let client

  try {

    const { password, resetToken } = req.body

    if (!password || !resetToken) {

      return res.status(400).json({ message: 'Password and reset token are required.' })

    }

    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET)

    const email = decoded.email

    client = await pool.connect()

    const query = 'SELECT * FROM faculty_passwords WHERE faculty_email = $1'

    const result = await client.query(query, [email])

    if (result.rows.length === 0) {

      return res.status(404).json({ message: 'User does not exist.' })

    }

    if (resetToken !== result.rows[0].reset_token) {

      return res.status(401).json({ message: 'Invalid reset token.' })

    }

    const salt = await bcrypt.genSalt(10)

    const hash = await bcrypt.hash(password, salt)

    const updatePassword = 'UPDATE faculty_passwords SET password = $1, reset_token = NULL WHERE faculty_email = $2'

    await client.query(updatePassword, [hash, email])

    return res.status(200).json({ message: 'Password reset successful.' })

  }
  catch (error) {

    console.error(error)

    if (error instanceof jwt.TokenExpiredError) {

      return res.status(401).json({ message: 'Reset token has expired.' })

    }
    else if (error instanceof jwt.JsonWebTokenError) {

      return res.status(401).json({ message: 'Invalid reset token.' })

    }
    else {

      return res.status(500).json({ message: 'Password reset failed.' })

    }
  }
  finally {

    if (client) {

      await client.release()

    }
  }
}




exports.fChangePassword = async (req, res) => {

  let client

  try {

    const { facultyId, oldPassword, newPassword } = req.body

    client = await pool.connect()

    const query = 'SELECT email FROM faculty WHERE faculty_id = $1'

    const result = await client.query(query, [facultyId])


    if (result.rows.length === 0) {

      return res.status(404).json({ message: 'Faculty not found' })

    }

    const check = 'SELECT * FROM faculty_passwords WHERE faculty_email=$1'

    const respo = await client.query(check, [result.rows[0].email])

    if (respo.rowCount === 0) {

      return res.status(404).send({ message: 'User Not Exists!.' })

    }


    const passwordMatch = await bcrypt.compare(oldPassword, respo.rows[0].password)

    if (!passwordMatch) {

      return res.status(401).json({ message: 'Incorrect Existing Password!.' })

    }

    const salt = await bcrypt.genSalt(16)

    const hash = await bcrypt.hash(newPassword, salt)

    const updatePassword = 'UPDATE faculty_passwords SET password = $1 WHERE faculty_email = $2'

    await client.query(updatePassword, [hash, result.rows[0].email])


    return res.status(200).json({ message: 'Password change successful' })

  }
  catch (error) {

    console.error(error)

    return res.status(500).send({ message: 'Password change failed!.' })

  }
  finally {

    if (client) {

      await client.release()

    }
  }
}







exports.facultyPosition = async (req, res) => {

  let client

  try {
    client = await pool.connect()

    const { faculty_pos, description } = req.body

    const checkResult1 = await pool.query('SELECT * FROM faculty_position WHERE faculty_pos = $1', [faculty_pos])

    if (checkResult1.rows.length > 0) {

      return res.status(400).send({
        message: 'Faculty position already exists.',
      })

    }

    let positionId = generateNumericValue(6)

    const query2 = 'SELECT * FROM faculty_position WHERE position_id = $1'

    let result2 = await client.query(query2, [positionId])

    while (result2.rowCount !== 0) {

      positionId = generateNumericValue(6)

      result2 = await client.query(query2, [positionId])

    }


    const data = [faculty_pos, positionId, description]

    const create = 'INSERT INTO faculty_position(faculty_pos, position_id, description) VALUES ($1,$2,$3) RETURNING*'

    const result = await pool.query(create, data)

    return res.send({ message: 'Successfully Created' })

  }
  catch (error) {

    console.error(error)

    return res.status(500).send({ message: 'Internal server error!' })

  }
  finally {

    if (client) {

      await client.release()

    }
  }
}

exports.viewAllFacultyPositions = async (req, res) => {

  let connection

  try {

    connection = await pool.connect()

    const result = await connection.query('SELECT * FROM faculty_position')

    if (result.rowCount === 0) {

      return res.status(404).send({ message: 'Nothing to Show!.' })

    }
    else {

      return res.status(200).send({ data: result.rows })

    }
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



exports.positionSend = async (req, res) => {

  let client

  try {

    client = await pool.connect()

    const query = 'SELECT * FROM faculty_position'

    const query1 = 'SELECT first_name, middle_name, last_name, designation FROM faculty'

    const result = await client.query(query)

    const result1 = await client.query(query1)

    if (result.rows.length === 0 && result1.rows.length === 0) {

      return res.status(404).send({ message: 'Nothing to show.' })

    }

    return res.send({ position: result.rows, faculty: result1.rows })

  }
  catch (error) {

    console.error(error)

    return res.status(500).send({ message: 'Internal Server Error!.' })

  }
  finally {

    if (client) {

      await client.release()

    }
  }
}




exports.officerFaculty = async (req, res) => {

  try {

    const client = await pool.connect()

    const { profile } = req.params

    const query = `select * from faculty where profile =$1`

    const result = await client.query(query, [profile])

    if (result.rowCount === 0) {

      return res.status(404).send(
        { message: 'Nothing to Show!.' }
      )
    }

    return res.status(200).send({ data: result.rows })

    await client.release()

  }
  catch (error) {

    console.error(error)

    return res.status(500).send({ message: 'Something went wrong!' })

  }
}



exports.facultyPositionAssi = async (req, res) => {

  let client

  try {

    client = await pool.connect()

    const { facultyId, faculty_pos, faculty_admin, position_assi_id } = req.body

    const checkAdmin = 'SELECT * FROM faculty WHERE faculty = $1'

    const resultAdmin = await client.query(checkAdmin, [faculty_admin])


    if (resultAdmin.rowCount === 0) {

      return res.status(400).send({ message: 'Admin of this faculty does not exist.' })

    }

    const checkPosition = 'SELECT * FROM faculty_position WHERE faculty_pos = $1'

    const resultPosition = await client.query(checkPosition, [faculty_pos])

    if (resultPosition.rowCount === 0) {

      return res.status(400).send({ message: 'Faculty position does not exist.' })

    }

    const query = 'INSERT INTO faculty_position_assi (faculty_id, faculty_pos, faculty_admin, position_assi_id) VALUES ($1, $2, $3, $4)'

    const values = [facultyId, faculty_pos, faculty_admin, position_assi_id]

    await client.query(query, values)

    return res.status(200).send({ message: 'Successfully assigned faculty position.' })

  }
  catch (error) {

    console.error(error)

    return res.status(500).send({ message: 'Internal Server Error!' })

  }
  finally {

    if (client) {
      try {

        await client.release()

      }
      catch (releaseError) {

        console.error('Error occurred while releasing the database client:', releaseError)

      }
    }
  }
}

exports.facultyPositionReAssign=async(req,res)=>{

  let connection

  try {

    const {facultyId,newPosition,newPositionId,faculty}=req.body

    connection=await pool.connect()

    const check='SELECT * FROM faculty_position_assi WHERE faculty_id=$1'
    
    const result=await connection.query(check,[facultyId])

    if (result.rowCount===0) {
      
      return res.status(400).send({message:'Faculty Member Not Exists!.'})
    }
    
    const checkPosition = 'SELECT * FROM faculty_position WHERE faculty_pos = $1'

    const resultPosition = await connection.query(checkPosition, [newPosition])

    if (resultPosition.rowCount === 0) {

      return res.status(400).send({ message: 'Faculty position does not exist.' })

    }
    const updateQuery='UPDATE faculty_position_assi SET faculty_pos=$1,position_assi_id=$2,faculty_admin=$3,updated_At=$4 WHERE faculty_id=$5'
    
    const time= new Date()
    const data=[newPosition,newPositionId,faculty,time,facultyId]

    await connection.query(updateQuery,data)

    return res.status(200).send({message:'Successfully Updated!.'})

  } 
  catch (error) {

    console.error(error)

    return res.status(500).send({message:'Internal Server Error!.'})

  }
  finally{

    if (connection) {

      await connection.release()

    }
  }
}

exports.viewFacultyPositionAssi = async (req, res) => {
  let client;

  try {
    const { faculty } = req.params;
    client = await pool.connect();

    const query = `
      SELECT
        f.first_name,
        f.middle_name,
        f.last_name,
        fa.faculty_id,
        fp.faculty_pos
      FROM
        faculty_position_assi fa
        INNER JOIN faculty f ON fa.faculty_id = f.faculty_id
        INNER JOIN faculty_position fp ON fa.faculty_pos = fp.faculty_pos
      WHERE
        fa.faculty_admin = $1
      ORDER BY
        fp.faculty_pos ASC
    `;

    const result = await client.query(query, [faculty]);

    if (result.rowCount === 0) {
      return res.status(404).send({ message: 'No Record Exists!' });
    }

    return res.send({ facultyPositions: result.rows });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Internal Server Error!' });
  } finally {
    if (client) {
      await client.release();
    }
  }
};


exports.viewFaculty = async (req, res) => {

  let client

  try {

    client = await pool.connect()

    const page = req.query.page || 1

    const limit = req.query.limit || 50

    const offset = (page - 1) * limit

    const dataQ = 'SELECT * FROM faculty ORDER BY created_on_date_time LIMIT $1 OFFSET $2'

    const result = await client.query(dataQ, [limit, offset])

    if (result.rowCount === 0) {

      return res.status(404).send({ message: 'No records to display.' })

    }
    else {

      return res.status(200).send({ data: result.rows })

    }
  }

  catch (error) {

    console.error(error)

    return res.status(500).send({ message: 'Internal server error.' })

  }
  finally {

    if (client) {

      await client.release()

    }
  }
}


// exports.reportSubmission = async (req, res) => {

//   let client

//   try {

//     const { facultyId, scheduleId, remarks, faculty } = req.body

//     const file = req.files.pdf

//     if (!file) {

//       return res.status(400).send({ message: 'No file uploaded!' })

//     }

//     client = await pool.connect();

//     const check0 = 'SELECT * FROM faculty f INNER JOIN courses c ON c.course_officer=f.faculty_id WHERE f.faculty_id=$1'

//     const result0 = await client.query(check0, [facultyId])

//     if (result0.rowCount === 0) {

//       return res.status(404).send({ message: 'Faculty Is Not Course Officer!.' })

//     }
//     const facCheck = 'SELECT * from faculty_name WHERE name=$1'

//     const facultyResult = await client.query(facCheck, [faculty])

//     if (facultyResult.rowCount === 0) {

//       return res.status(404).send({ message: 'This Faculty Not Exists!' })

//     }
//     const check = 'SELECT * FROM report_submission WHERE faculty_id=$1 AND schedule_id=$2'

//     const result = await client.query(check, [facultyId, scheduleId])

//     if (result.rowCount > 0) {

//       return res.status(409).send({ message: 'Report Already Exists!' })

//     }

//     const check2 = 'SELECT * FROM course_scheduler WHERE course_scheduler_id=$1'


//     const result2 = await client.query(check2, [scheduleId])

//     if (result2.rowCount === 0) {

//       return res.status(404).send({ message: 'No Course Found!' })

//     }
//     if (result2.rows[0].course_status !== 'completed') {

//       return res.status(400).send({ message: 'You are not allowed to submit a report for a course that is not completed!' })

//     }

//     const reportPath = file[0].location

//     const insertQuery = 'INSERT INTO report_submission (faculty_id, schedule_id, report_path,remarks,faculty) VALUES ($1, $2, $3,$4,$5)'

//     await client.query(insertQuery, [facultyId, scheduleId, reportPath, remarks, faculty])


//     return res.status(200).send({ message: 'Report submitted successfully!' })

//   }
//   catch (error) {

//     console.error(error)

//     return res.status(500).send({ message: 'Internal Server Error!' })

//   } finally {

//     if (client) {

//       await client.release()

//     }
//   }
// }

exports.reportSubmission = async (req, res) => {
  let client;

  try {
    const { facultyId, scheduleId, remarks, faculty } = req.body;
    const file = req.files.pdf;

    if (!file) {
      return res.status(400).send({ message: 'No file uploaded!' });
    }

    client = await pool.connect();

    const [result2, facultyResult, result] = await Promise.all([
      client.query('SELECT cs.course_id, cs.course_status, c.course_officer FROM course_scheduler cs INNER JOIN courses c ON c.course_id = cs.course_id WHERE cs.course_scheduler_id = $1', [scheduleId]),
      client.query('SELECT * from faculty_name WHERE name = $1', [faculty]),
      client.query('SELECT * FROM report_submission WHERE faculty_id = $1 AND schedule_id = $2', [facultyId, scheduleId])
    ]);

    if (result2.rowCount === 0) {
      return res.status(404).send({ message: 'No Course Found!' });
    }

    const { course_id: courseId, course_status: courseStatus, course_officer: courseOfficer } = result2.rows[0];

    if (courseOfficer !== facultyId) {
      return res.status(403).send({ message: 'You are not the Course Officer for this course!' });
    }

    if (facultyResult.rowCount === 0) {
      return res.status(404).send({ message: 'This Faculty Does Not Exist!' });
    }

    if (result.rowCount > 0) {
      return res.status(409).send({ message: 'Report Already Exists!' });
    }

    if (courseStatus !== 'completed') {
      return res.status(400).send({ message: 'You are not allowed to submit a report for a course that is not completed!' });
    }

    const reportPath = file[0].location;

    await client.query('INSERT INTO report_submission (faculty_id, schedule_id, report_path, remarks, faculty) VALUES ($1, $2, $3, $4, $5)', [facultyId, scheduleId, reportPath, remarks, faculty]);

    return res.status(200).send({ message: 'Report submitted successfully!' });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Internal Server Error!' });
  } finally {
    if (client) {
      client.release();
    }
  }
};



exports.displayReport = async (req, res) => {

  let client
  
  try {
    const s3Client = new S3Client({
      region: process.env.BUCKET_REGION,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
      },
    });
    const { scheduleId } = req.params

    client = await pool.connect()

    const query = 'SELECT report_path FROM report_submission WHERE schedule_id = $1'

    const result = await client.query(query, [scheduleId])


    if (result.rowCount === 0) {

      return res.status(404).send({ message: 'No report found for the specified schedule ID!' })

    }

    const fileUrl = result.rows[0].report_path

    const params = {

      Bucket: 'nigstdata',

      Key: 'report/' + fileUrl.substring(fileUrl.lastIndexOf('/') + 1)

    }

    const getObjectCommand = new GetObjectCommand(params)

    const { Body } = await s3Client.send(getObjectCommand)

    res.setHeader('Content-Disposition', `attachment; filename="${params.Key}"`)

    res.setHeader('Content-Type', 'application/pdf')

    Body.pipe(res)

  }
  catch (error) {

    console.error(error)

    return res.status(500).send({ message: 'Internal Server Error!' })

  }
  finally {

    if (client) {

      client.release()

    }
  }
}


exports.filterReportsByFaculty = async (req, res) => {

  let client

  try {

    const { faculty } = req.params

    client = await pool.connect()

    const filterQuery = 'SELECT * FROM report_submission WHERE faculty = $1'

    const reports = await client.query(filterQuery, [faculty])


    if (reports.rowCount === 0) {

      return res.status(404).send({ message: 'No Reports Found!' })

    }

    const newReports = await Promise.all(

      reports.rows.map(async (data) => {

        const checkQuery =` SELECT c.course_code, c.course_no, c.title, rs.remarks,rs.report_path as report,rs.faculty,rs.schedule_id,to_char(rs.submission_date,'DD/MM/YYYY') as submissiondate,CONCAT(f.first_name, ' ', f.middle_name, ' ', f.last_name) AS report_submitter FROM courses c INNER JOIN course_scheduler cs ON c.course_id = cs.course_id INNER JOIN report_submission rs ON rs.schedule_id = cs.course_scheduler_id INNER JOIN faculty f ON f.faculty_id=rs.faculty_id  WHERE course_scheduler_id = $1`

        const scheduleId = data.schedule_id

        const result = await client.query(checkQuery, [scheduleId])
        
        return result.rows[0]
      })
    );

    return res.status(200).send({ newReports });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Internal Server Error!' });
  } finally {
    if (client) {
      await client.release();
    }
  }
};

exports.filterReportsByOfficer = async (req, res) => {
  let client;

  try {
    const { facultyId } = req.params;

    client = await pool.connect();

    const filterQuery = 'SELECT * FROM report_submission WHERE faculty_id = $1';

    const reports = await client.query(filterQuery, [facultyId]);

    if (reports.rowCount === 0) {
      return res.status(404).send({ message: 'No Reports Found!' });
    }

    const newReports = await Promise.all(
      reports.rows.map(async (data) => {
        const checkQuery = `SELECT c.course_code, c.course_no, c.title, rs.remarks, rs.report_path as report, rs.faculty, rs.schedule_id, to_char(rs.submission_date, 'DD/MM/YYYY') as submissiondate, CONCAT(f.first_name, ' ', f.middle_name, ' ', f.last_name) AS report_submitter FROM courses c INNER JOIN course_scheduler cs ON c.course_id = cs.course_id INNER JOIN report_submission rs ON rs.schedule_id = cs.course_scheduler_id INNER JOIN faculty f ON f.faculty_id = rs.faculty_id WHERE course_scheduler_id = $1`;

        const scheduleId = data.schedule_id;

        const result = await client.query(checkQuery, [scheduleId]);

        return result.rows[0];
      })
    );

    return res.status(200).send({ newReports });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Internal Server Error!' });
  } finally {
    if (client) {
      await client.release();
    }
  }
};



exports.sendIDForReport = async (req, res) => {

  let connection

  try {

    const { faculty } = req.params

    connection = await pool.connect()


    const check = 'SELECT title as name, course_id  FROM courses WHERE faculty = $1'

    const result01 = await connection.query(check, [faculty])

    if (result01.rowCount === 0) {

      return res.status(404).send({ message: `No Course Found with faculty: ${faculty}` })

    }
    else {

      const courses = result01.rows

      const coursePromises = courses.map(async (course) => {

        const id = course.course_id

        const check01 = 'SELECT name, course_scheduler_id as schedulerId,batch_no as batch from course_scheduler WHERE course_id = $1 AND course_status = $2'

        const data = [id, 'completed']

        const result02 = await connection.query(check01, data)

        if (result02.rowCount > 0) {

          return result02.rows

        }
      })

      const courseResults = await Promise.all(coursePromises)

      const finalData = courseResults.filter(Boolean)


      if (finalData.length === 0) {

        return res.status(404).send({ message: 'No completed courses found for this faculty.' })

      }
      else {

        return res.status(200).send({ courses: finalData.flat() })

      }
    }
  }
  catch (error) {

    console.error(error)

    return res.status(500).send({ message: 'Internal Server Error!' })

  }
  finally {

    if (connection) {

      await connection.release()

    }
  }
}


// exports.sendIDForReport = async (req, res) => {

//   let connection

//   try {

//     const { faculty,officer } = req.params

//     connection = await pool.connect()


//     const check = 'SELECT title as name, course_id  FROM courses WHERE faculty = $1 AND course_officer=$2'

//     const result01 = await connection.query(check, [faculty,officer])

//     if (result01.rowCount === 0) {

//       return res.status(404).send({ message: `No Course Found with faculty: ${faculty}, that is assigned to officer: ${officer}` })

//     }
//     else {

//       const courses = result01.rows

//       const coursePromises = courses.map(async (course) => {

//         const id = course.course_id

//         const check01 = 'SELECT name, course_scheduler_id as schedulerId from course_scheduler WHERE course_id = $1 AND course_status = $2'

//         const data = [id, 'completed']

//         const result02 = await connection.query(check01, data)

//         if (result02.rowCount > 0) {

//           return result02.rows

//         }
//       })

//       const courseResults = await Promise.all(coursePromises)

//       const finalData = courseResults.filter(Boolean)


//       if (finalData.length === 0) {

//         return res.status(404).send({ message: 'No completed courses found for this faculty.' })

//       }
//       else {

//         return res.status(200).send({ courses: finalData.flat() })

//       }
//     }
//   }
//   catch (error) {

//     console.error(error)

//     return res.status(500).send({ message: 'Internal Server Error!' })

//   }
//   finally {

//     if (connection) {

//       await connection.release()

//     }
//   }
// 2 }
