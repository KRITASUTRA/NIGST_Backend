const pool = require("../config/pool")
const path = require('path')
const fs = require('fs');


exports.viewAllStudents = async (req, res) => {

  let client

  try {

    client = await pool.connect()

    const query = 'SELECT * FROM users'

    const result = await client.query(query)

    if (result.rowCount === 0) {

      return res.send({ message: 'Nothing to show!.' })

    }

    return res.status(200).send({ students: result.rows })

  } catch (error) {

    console.log(error)

    return res.status(500).send({ message: 'Something went wrong!.' })

  }
  finally {

    if (client) {

      await client.release()

    }
  }
}


exports.organizationFilter = async (req, res) => {
  let client;

  try {
    const { type, category } = req.query;
    client = await pool.connect();
    const params = [];
    let query = 'SELECT * FROM organizations';

    if (type) {
      params.push(type);
      query += ' WHERE type = $1';
    }

    if (category) {
      if (params.length === 0) {
        query += ' WHERE';
      } else {
        query += ' AND';
      }
      params.push(category);
      query += ' category = $' + params.length

    }

    const result = await client.query(query, params)


    if (result.rowCount === 0) {

      return res.status(404).send({ message: 'No matching records found.' })

    }

    return res.status(200).send(result.rows)

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


exports.viewAllCourses = async (req, res) => {

  let client

  try {
    client = await pool.connect()

    const query = 'SELECT * EXCEPT(id) FROM courses'

    const result = await client.query(query)

    if (result.rowCount === 0) {

      return res.send({ message: 'Nothing to Show!.' })

    }

    return res.status(200).send({ courses: result.rows })

  }
  catch (error) {

    console.error(error)

    return res.status(500).send({ message: 'Something went wrong!.' })

  }
  finally {

    if (client) {

      await client.release()

    }
  }
}




exports.viewArchiveAnnouncementToAdmin = async (req, res) => {

  let client

  try {

    client = await pool.connect()

    const check = `SELECT title,description,url,pdf_path,status, to_char(created_at,'DD/MM/YYYY')as createdat,to_char(posted_at,'DD/MM/YYYY')as postedat,to_char(archive_at,'DD/MM/YYYY')as archivedat,a_id as aid FROM archive_announcement`

    const result = await client.query(check)

    if (result.rowCount === 0) {

      return res.status(404).send({ message: "Nothing to show" })

    }

    return res.status(200).send(result.rows)
  }
  catch (error) {

    console.error(error)

    return res.status(500).send({ message: "Something went wrong." })

  }
  finally {

    if (client) {

      await client.release()

    }
  }
}

exports.allFacultyDetail = async (req, res) => {

  let client
  try {

    client = await pool.connect()

    const query1 = `
      SELECT faculty.first_name, faculty.middle_name, faculty.last_name, faculty.dob, faculty.phone, faculty.gender, faculty.email, faculty.admin_verified, faculty.education, faculty.designation, faculty.faculty_id, faculty.profile, faculty.created_on_date_time, faculty.updated_at TIMESTAMP, assigned_subjects.subject_name
      FROM faculty 
      INNER JOIN assigned_subjects 
      ON faculty.id = assigned_subjects.faculty_id
    `

    const result = await client.query(query1)

    return res.status(200).send({ data: result.rows })

  }
  catch (error) {

    console.error(error)

    return res.status(500).json({ message: 'Something went wrong.' })

  }
  finally {

    if (client) {

      await client.release()

    }
  }
}



exports.viewFacultyName = async (req, res) => {

  let client

  try {

    const check = `SELECT id, name FROM faculty_name WHERE name <> 'NIGST'`

    client = await pool.connect()

    const result = await client.query(check)

    if (result.rowCount === 0) {

      return res.send({ message: 'Something went wrong.' })

    }

    return res.status(200).send(result.rows)

  }
  catch (error) {

    console.error(error)

    return res.status(400).send({ message: 'Something went wrong.' })

  }
  finally {

    if (client) {

      await client.release()

    }
  }
}

exports.viewFacultyWithAccess = async (req, res) => {

  let client

  try {

    const { access } = req.params

    client = await pool.connect()

    const check = 'SELECT * FROM faculty WHERE status = $1'

    const result = await client.query(check, [access])

    if (result.rowCount === 0) {

      return res.status(404).send({ message: 'Nothing to Show.' })

    }
    else {

      return res.status(200).send({ data: result.rows })

    }
  }
  catch (error) {

    console.error(error)

    return res.status(500).send({ message: 'Internal Server Error.' })

  }
  finally {

    if (client) {

      await client.release()

    }
  }
}



exports.viewFacultyMembersWithFaculty = async (req, res) => {

  let client

  try {

    const { faculty } = req.params

    client = await pool.connect()

    const check = `SELECT first_name as firstname, middle_name as middlename, last_name as lastname, faculty_id as facultyid,dob as dateofbirth,phone as mobileno, email,education,designation,profile,to_char(created_on_date_time,'YYYY/MM/DD') as created_at,faculty,admin_verified, status FROM faculty WHERE faculty = $1`

    const result = await client.query(check, [faculty])

    if (result.rowCount === 0) {

      return res.status(404).send({ message: 'Nothing to Show.' })

    }
    else {

      return res.status(200).send({ data: result.rows })

    }
  }
  catch (error) {

    console.error(error)

    return res.status(500).send({ message: 'Internal Server Error.' })

  }
  finally {

    if (client) {

      await client.release()

    }
  }
}


exports.viewCourseByFaculty = async (req, res) => {

  let client

  try {

    const { faculty } = req.params
    const check = `
    SELECT
      c.title,
      c.course_id,
      c.description,
      (course_duration_weeks || ' Weeks ' || course_duration_days || ' Days') AS duration,
      c.course_code,
      c.course_category,
      c.course_no,
      CONCAT(f.first_name, ' ', f.middle_name, ' ', f.last_name) AS course_officer,
      c.course_director,
      c.course_mode,
      c.course_type,
      to_char(c.created_at, 'DD/MM/YYYY') AS createdAt
    FROM
      courses c
      INNER JOIN faculty f ON f.faculty_id = c.course_officer
    WHERE
      c.faculty = $1
  `;
  

    client = await pool.connect()

    const result = await client.query(check, [faculty])

    if (result.rowCount === 0) {

      return res.status(404).send({ message: 'Course Not Found.' })

    }
    else {

      return res.status(200).send({ course: result.rows })

    }
  }
  catch (error) {

    console.error(error)

    return res.status(500).send({ message: 'Internal Server Error.' })

  }
  finally {

    if (client) {

      await client.release()

    }
  }
}



exports.viewAllEnrollment = async (req, res) => {

  let client

  try {

    client = await pool.connect()

    const check = `SELECT DISTINCT e.course_paid_status, e.enrolment_status, e.enrolment_date, e.enrolment_id, s.name, s.date_completion, s.running_date, s.course_status, s.currency || ' ' || s.fee AS fee, e.nigst_approval as nigstapproval FROM enrolment e LEFT JOIN course_scheduler s ON e.scheduling_id = s.course_scheduler_id;`

    const result = await client.query(check)

    if (result.rowCount === 0) {

      return res.status(404).send({ message: 'No records found.' })

    }
    else {

      return res.status(200).send({ data: result.rows })

    }
  }
  catch (error) {

    console.error(error)

    return res.status(500).send({ message: 'Internal Server Error.' })

  }
  finally {

    if (client) {

      await client.release()

    }
  }
}


exports.viewAllCancelEnrollment = async (req, res) => {

  let client

  try {

    client = await pool.connect()

    const check = `SELECT DISTINCT e.course_paid_status, e.enrolment_status, e.enrolment_date, e.enrolment_id, s.name, s.date_completion, s.running_date, s.course_status, s.currency || ' ' || s.fee AS fee, e.nigst_approval as nigstapproval, e.cancel_date as cancelDate FROM archive_enroll e LEFT JOIN course_scheduler s ON e.scheduling_id = s.course_scheduler_id;`

    const result = await client.query(check)

    if (result.rowCount === 0) {

      return res.status(404).send({ message: 'No records found.' })

    }
    else {

      return res.status(200).send({ data: result.rows })

    }
  }
  catch (error) {

    console.error(error)

    return res.status(500).send({ message: 'Internal Server Error.' })

  }
  finally {

    if (client) {

      await client.release()

    }
  }
}


exports.showReportsToAdmin = async (req, res) => {

  let client

  try {

    client = await pool.connect()

    const filterQuery = 'SELECT * FROM report_submission '

    const reports = await client.query(filterQuery)

    if (reports.rowCount === 0) {

      return res.status(404).send({ message: 'No Reports Found!.' })

    }

    return res.status(200).send({ reports: reports.rows })

  }
  catch (error) {

    console.error(error)

    return res.status(500).send({ message: 'Internal Server Error!' })

  }
  finally {

    if (client) {

      await client.release()

    }
  }
}


exports.filter = async (req, res) => {

  let client

  try {

    const { email, organization, status, startDate, endDate } = req.query

    client = await pool.connect()

    const params = []

    let query = 'SELECT *, TO_CHAR(created_at::date, \'YYYY-MM-DD\') as created_at FROM users'


    if (email) {
      params.push(email);
      query += ' WHERE email = $1';
    }

    if (organization) {
      if (params.length === 0) {
        query += ' WHERE';
      } else {
        query += ' AND';
      }
      params.push(organization);
      query += ' organization = $' + (params.length);
    }

    if (status === 'true' || status === 'false') {
      if (params.length === 0) {
        query += ' WHERE';
      } else {
        query += ' AND';
      }
      params.push(status === 'true');
      query += ' admin_verified = $' + (params.length);
    }

    if (startDate && endDate) {
      if (params.length === 0) {
        query += ' WHERE';
      } else {
        query += ' AND';
      }
      params.push(startDate);
      query += ' created_at >= $' + (params.length);
      params.push(endDate);
      query += ' AND created_at <= $' + (params.length);
    } else if (startDate) {
      if (params.length === 0) {
        query += ' WHERE';
      } else {
        query += ' AND';
      }
      params.push(startDate);
      query += ' created_at >= $' + (params.length);
    } else if (endDate) {
      if (params.length === 0) {
        query += ' WHERE';
      } else {
        query += ' AND';
      }
      params.push(endDate);
      query += ' created_at <= $' + (params.length);
    }

    const result = await client.query(query, params)

    if (result.rowCount === 0) {

      return res.status(404).send({ message: 'No matching records found.' })

    }

    return res.send(result.rows)

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



exports.viewAnnouncementToAdmin = async (req, res) => {

  let connection

  try {

    const check = `SELECT title,description,url,pdf_path,status, a_id as aid,to_char(created_at,'YYYY/MM/DD')as createdat,to_char(posted_at,'YYYY/MM/DD')as postedat FROM announcement`

    connection = await pool.connect()

    const result = await connection.query(check)

    if (result.rowCount === 0) {

      return res.status(404).send({ message: 'No Announcement To Display!.' })

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


exports.viewCancelledCourses=async(req,res)=>{
  let connection

  try {
    const {faculty}=req.params
    connection=await pool.connect()
    const queryCheck = `
    SELECT
      cs.name,
      cs.course_id AS courseid,
      cs.course_capacity AS capacity,
      TO_CHAR(cs.date_comencement, 'DD/MM/YYYY') AS enrollmentdate,
      TO_CHAR(cs.date_completion, 'DD/MM/YYYY') AS completiondate,
      TO_CHAR(cs.running_date, 'DD/MM/YYYY') AS runningdate,
      cs.batch_no AS batch,
      TO_CHAR(cs.archived_at, 'DD/MM/YYYY') AS cancelleddate,
      cs.course_scheduler_id AS schedulerid,
      cs.currency || ' ' || cs.fee AS fee,
      c.description,
      c.faculty
    FROM
      course_scheduler_archive cs
      INNER JOIN courses c ON cs.course_id = c.course_id
    WHERE
      c.faculty = $1
  `;
  
     const result=await connection.query(queryCheck,[faculty])
    if (result.rowCount===0) {
      return res.status(404).send({message:'No Courses Found!.'})
    }
    return res.status(200).send({courses:result.rows})
  } catch (error) {
    console.error(error)
    return res.status(500).send({message:'Internal Server Error!.'})
  }
  finally{
    if (connection) {
      await connection.release()
    }
  }
}