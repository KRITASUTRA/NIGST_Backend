const pool = require("../config/pool")

const generateNumericValue = require("../generator/NumericId");




exports.course_scheduling = async (req, res) => {

  let client;

  try {
    const { courseName, courseID, courseCapacity, dateCommencement, dateCompletion, currency, fees, runningDate } = req.body

    client = await pool.connect()

    let batch = 1

    const check = 'SELECT * FROM course_scheduler WHERE course_id=$1 ORDER BY id ASC'

    const result = await client.query(check, [courseID])

    let generateid = generateNumericValue(6)

    const check1 = 'SELECT * FROM course_scheduler WHERE course_scheduler_id=$1'

    let result1 = await client.query(check1, [generateid])

    while (result1.rowCount > 0) {

      generateid = generateNumericValue(6)

      result1 = await client.query(check1, [generateid])

    }

    if (result.rows.length > 0) {

      const lastStatus = result.rows[result.rows.length - 1].course_status

      const lastBatchNumber = result.rows[result.rows.length - 1].batch_no

      const lastRunningDate = result.rows[result.rows.length - 1].running_date

      const lastCommencementDate = result.rows[result.rows.length - 1].date_comencement

      const lastCompletionDate = result.rows[result.rows.length - 1].date_completion

      if (lastStatus === 'completed' || lastStatus === 'running' || lastStatus === 'scheduled') {

        batch = parseInt(lastBatchNumber) + 1

        if (runningDate >= dateCommencement && runningDate <= dateCompletion) {

          const data = [courseName, courseID, courseCapacity, dateCommencement, dateCompletion, currency, fees, runningDate, batch, generateid]

          const feed = 'INSERT INTO course_scheduler(name,course_id,course_capacity,date_comencement,date_completion,currency,fee,running_date,batch_no,course_scheduler_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) '

          await client.query(feed, data)

          return res.status(201).send({ message: 'Course Scheduled Successfully.' })

        }
        else {

          return res.send({ message: 'Running date is not between commencement and completion dates.' })

        }
      }
      else if (lastStatus === 'postponed') {

        return res.send({ message: 'There is already a postponed course!.' })

      }
      else {

        return res.send({ message: 'You can\'t create a new course when there is a course for scheduling!.' })

      }
    }
    else {

      const insert = 'INSERT INTO course_scheduler(name,course_id,course_capacity,date_comencement,date_completion,currency,fee,running_date,batch_no,course_scheduler_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)'

      if (runningDate >= dateCommencement && runningDate <= dateCompletion) {

        await client.query(insert, [courseName, courseID, courseCapacity, dateCommencement, dateCompletion, currency, fees, runningDate, batch, generateid])

        return res.status(200).send({ message: 'New course Scheduled.' })

      }
      else {

        return res.send({ message: 'Running date is not between commencement and completion dates.' })

      }
    }
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
};



exports.viewScheduledCourses = async (req, res) => {

  let client

  try {

    const check = `SELECT name as title, course_capacity as coursecapacity,to_char(date_comencement,'YYYY/MM/DD') as datecomencement, to_char(date_completion,'YYYY/MM/DD') as datecompletion,currency,fee, batch_no as batch, course_status as status, to_char(running_date,'YYYY/MM/DD') as runningdate,to_char(scheduled_at, 'YYYY/MM/DD') as schedulingdate,course_scheduler_id as scheduling_id,course_id as courseid FROM course_scheduler ORDER BY name ASC, batch_no ASC`

    client = await pool.connect()

    const result = await client.query(check)

    if (result.rowCount === 0) {

      return res.status(404).send({ message: 'No records found' })

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

    if (client) {

      await client.release()

    }
  }
};

exports.viewScheduledCoursesByFaculty=async(req,res)=>{

let connection

try {
  
    const {faculty}=req.params

  
    const checkCourse = `SELECT c.title,  to_char(cs.running_date,'YYYY/MM/DD') as runningdate ,cs.course_id  as courseid,to_char(cs.date_comencement,'YYYY/MM/DD') as datecomencement,cs.course_capacity as coursecapacity,to_char(cs.date_completion,'YYYY/MM/DD') as datecompletion,cs.batch_no as batch,cs.course_status,to_char(cs.scheduled_at, 'YYYY/MM/DD') as schedulingdate,cs.course_scheduler_id as scheduling_id,CONCAT(cs.currency, ' ', cs.fee) AS fee,cs.course_scheduler_id as schedulerid FROM courses c INNER JOIN course_scheduler cs ON c.course_id = cs.course_id WHERE c.faculty = $1`

 
    connection=await pool.connect()

    const courseResult=await connection.query(checkCourse,[faculty])
    
    if (courseResult.rowCount===0) {

      return res.status(404).send({message:'No Courses Found!.'})

    }

    return res.status(200).json({courses:courseResult.rows})

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




exports.courseCreation = async (req, res) => {

  let client

  try {

    let { courseCategory, title, courseCode, courseNo, eligibility, courseDirector, courseOfficer, courseDurationInDays, courseDurationInWeeks, faculty, mode, type, description } = req.body
    courseDirector = 'Head of Faculty ' + faculty

    client = await pool.connect()

    let course_id = generateNumericValue(6)

    const checkCourseIdQuery = 'SELECT * from courses where course_id = $1'

    let result1 = await client.query(checkCourseIdQuery, [course_id])

    while (result1.rows.length !== 0) {

      course_id = generateNumericValue(6)

      result1 = await client.query(checkCourseIdQuery, [course_id])

    }

    const insertQuery = 'INSERT INTO courses (course_category, title, course_code, course_no, course_id, eligibility, course_duration_days, course_duration_weeks, course_director, course_officer, faculty, course_mode, course_type, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)'

    const values = [courseCategory, title, courseCode, courseNo, course_id, eligibility, courseDurationInDays, courseDurationInWeeks, courseDirector, courseOfficer, faculty, mode, type, description]

    await client.query(insertQuery, values)

   return res.status(201).send('Course created successfully')

  }
  catch (error) {

    console.error(error)

    if (error.code === '23505') {

    return  res.status(409).json({ message: 'This course already exists.' })

    } else if (error.code === '23502') {

     return res.status(400).json({ message: 'Missing required field.' })

    } else {

     return res.status(500).json({ message: 'Something went wrong!' })

    }
  }
  finally {

    if (client) {

      await client.release()

    }
  }
};






exports.viewCourses = async (req, res) => {

  let client

  try {

    client = await pool.connect()

    const query =
      'SELECT  c.course_category, c.course_code, c.course_no, c.title, c.description, c.course_mode, c.course_duration_weeks, c.course_duration_days, c.eligibility, c.course_type, c.course_director, c.faculty, TO_CHAR(c.created_at::date, \'YYYY-MM-DD\') AS created_at, CONCAT(f.first_name, \' \', COALESCE(f.middle_name, \'\'), \' \', f.last_name) AS courseOfficer FROM courses c JOIN faculty f ON c.course_officer = f.faculty_id'

    const result = await client.query(query)

    if (result.rowCount === 0) {

      return res.status(404).send({ message: 'Nothing to display.' })

    }

    return res.status(200).send({ courses: result.rows })

  }
   catch (error) {

    console.log(error)

    return res.status(500).send({ error: 'Something went wrong.' })

  }
   finally {

    if (client) {

      await client.release()

    }
  }
}



exports.filterCourse = async (req, res) => {

  let client;

  try {

    const { startDate, endDate, courseCategory, facultyId, eligibility } = req.body;

    client = await pool.connect();

    let query = `
      SELECT *
      FROM courses
      WHERE 1 = 1
    `;

    if (startDate && endDate) {

      query += `AND date_comencement >= '${startDate}' 
                 AND date_completion <= '${endDate}'`;

    }
    if (courseCategory) {

      query += `AND course_category = '${courseCategory}'`;

    }

    if (facultyId) {

      query += `AND faculty_id = '${facultyId}'`;

    }

    if (eligibility) {

      query += `AND eligibility = '${eligibility}'`;

    }

    query += 'ORDER BY date_comencement ASC';

    const result = await client.query(query);

    if (result.rows.length === 0) {

      return res.send({ message: 'No courses found' });

    }
    else {

      return res.send({ courses: result.rows });

    }
  }
  catch (error) {

    console.error(error);

    return res.send({ message: 'Something went wrong' });

  }
  finally {

    if (client) {

      await client.release();

    }
  }
};

exports.sendCourseCodeNo = async (req, res) => {

  let client

  try {

    client = await pool.connect()

    const check = 'SELECT DISTINCT course_code, course_no FROM courses'

    const result = await client.query(check)

    if (result.rowCount === 0) {

      return res.status(404).send({ message: 'Not Found!' })

    }
    else {

      const data = result.rows.map(row => {

        return { course_code: row.course_code, course_no: row.course_no }

      })

      return res.status(200).send({ data })

    }
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



exports.takeCodeNo = async (req, res) => {

  let connection

  try {

    const { code, no, type } = req.params

    const data = [code, no, type]

    connection = await pool.connect()

    const check = 'SELECT course_id as courseid, title as coursename, description FROM courses WHERE course_code = $1 AND course_no = $2 AND course_category = $3'

    const result = await connection.query(check, data)

    if (result.rowCount === 0) {

      return res.status(404).send({ message: 'No Course Found!' })

    }
    else {

      return res.status(200).send({ course: result.rows })

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


exports.sendBatchAndInfo = async (req, res) => {

  let connection

  try {

    const { courseID } = req.params

    connection = await pool.connect()

    const check =` SELECT course_scheduler_id as schedulingid, batch_no as batch, to_char(date_comencement,'YYYY/MM/DD') as commencementdate, to_char(date_completion,'YYYY/MM/DD') as completiondate FROM course_scheduler WHERE course_id=$1 AND course_status IN ($2, $3)`

    const data = [courseID, 'created', 'scheduled']

    const result = await connection.query(check, data)

    if (result.rowCount === 0) {

      return res.status(404).send({ message: 'No Course Found or Course Not Scheduled for Assigning!' })

    }
    else {

      return res.status(200).send({ course: result.rows })

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



exports.courseCalender = async (req, res) => {
  
  let client

  try {

    client = await pool.connect()

    const query = `
      SELECT
        c.title AS course_title,
        c.course_id,
        c.course_no,
        c.course_code,
        c.description,
        CONCAT(f.first_name, ' ', f.middle_name, ' ', f.last_name) AS course_officer,
        c.faculty,
        c.course_mode,
        c.course_type,
        c.course_category,
        c.eligibility,
        CONCAT(c.course_duration_weeks, ' weeks ', c.course_duration_days, ' days') AS course_duration,
        cs.batch_no,
        CONCAT(cs.currency, ' ', cs.fee) AS fee,
        cs.course_capacity,
        to_char(cs.date_comencement,'YYYY/MM/DD') AS start_date,
        to_char(cs.date_completion,'YYYY/MM/DD') AS completion_date
      FROM
        courses c
        INNER JOIN course_scheduler cs ON c.course_id = cs.course_id
        INNER JOIN faculty f ON c.course_officer = f.faculty_id
      WHERE
        cs.course_status IN ('created', 'scheduled')
    `

    const result = await client.query(query)

    if (result.rowCount === 0) {

      return res.status(404).send({ message: 'Nothing to Show!' })

    } 
    else {

      return res.send({ data: result.rows })

    }
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
