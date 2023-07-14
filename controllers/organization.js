const { Client } = require("pg");
const pool = require("../config/pool");
const generateNumericValue = require("../generator/NumericId");



exports.departments = async (req, res) => {
  let connection;

  try {
    connection = await pool.connect();

    const { organization, type, category, department, ministry, email, phone } = req.body;

  
    if (!organization || !type || !category || !email) {
      return res.status(400).send({
        message: 'Missing required fields',
      });
    }

    const check = `SELECT id FROM organizations WHERE organization = $1`;
    const checkOrgResult = await pool.query(check, [organization]);

    if (checkOrgResult.rowCount > 0) {
      return res.status(400).send({
        message: `Duplicate organization found`,
      });
    } else {
      const insertQ = `INSERT INTO organizations (organization, type, category, department, ministry, email, phone) VALUES ($1, $2, $3, $4, $5, $6, $7)`;
      const data = [organization, type, category, department, ministry, email, phone];
      await connection.query(insertQ, data);
      return res.send({
        message: 'Successfully created',
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Internal Server Error!.' });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};




exports.viewAllOrganizations = async (req, res) => {
  let connection;
  try {
    connection = await pool.connect();
    const result = await connection.query('SELECT * FROM organizations');
    return res.send(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Something went wrong!' });
  } finally {
    if (connection) {
     await connection.release();
    }
  }
};




exports.viewOrganizations = async (req, res) => {
  let connection;
  try {
    connection = await pool.connect();
    const result = await connection.query('SELECT organization FROM organizations');
    return res.send(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Something went wrong!' });
  } finally {
    if (connection) {
    await  connection.release();
    }
  }
};



exports.organizationCourseAssi = async (req, res) => {

  let connection;

  try {

    connection = await pool.connect();

    const { organization, courseid, code, courseNo, batch, schedulingID, commencement, completition } = req.body;

    const checkFacultyExistsQuery = 'SELECT * from organization_course_assi WHERE course_id = $1 AND organization_name = $2 AND batch_no=$3';

    const checkCourseExists = [courseid, organization,batch];

    const result = await connection.query(checkFacultyExistsQuery, checkCourseExists);

    if (result.rows.length !== 0) {

      return res.status(400).json({ message: `This course with batch: ${batch} already assigned to ${organization}` });

    }
    else {

      let organization_course_id = generateNumericValue(7);

      const checkOrganizationIdQuery = 'SELECT * FROM organization_course_assi WHERE organization_course_id = $1';

      let result1 = await connection.query(checkOrganizationIdQuery, [organization_course_id]);


      while (result1.rows.length !== 0) {

        organization_course_id = generateNumericValue(7);

        result1 = await connection.query(checkOrganizationIdQuery, [organization_course_id]);

      }

      const insertQuery = 'INSERT INTO organization_course_assi(organization_name, course_id, code, batch_no, course_no, scheduling_id, date_commencement, date_completion, organization_course_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)';

      const values = [organization, courseid, code, batch, courseNo, schedulingID, commencement, completition, organization_course_id];

      await connection.query(insertQuery, values);

      return res.status(201).send('Organization Courses Creation Successfully');

    }

  }
   catch (err) {

    console.error(err);

    return res.status(500).json({ message: 'Error creating organization' });

  } 
  finally {

    if (connection) {

      await connection.release();

    }
  }
};



exports.removeOrganizationCourse = async (req, res) => {

  let client

  try {
    const { organization, schedulingID } = req.body

    client = await pool.connect()

    await client.query('BEGIN')


    const checkQuery = 'SELECT * FROM organization_course_assi WHERE organization_name = $1 AND scheduling_id = $2'

    const checkResult = await client.query(checkQuery, [organization, schedulingID])


    if (checkResult.rowCount === 0) {

      return res.status(404).send({ message: 'Assigned Course Not Found!' })

    }

    const deleteQuery1 = 'DELETE FROM organization_course_assi WHERE organization_name = $1 AND scheduling_id = $2'

    await client.query(deleteQuery1, [organization, schedulingID])


    const deleteQuery2 = 'DELETE FROM enrolment WHERE scheduling_id = $1 AND student_id IN (SELECT student_id FROM users WHERE organization = $2)'

    const deleteResult = await client.query(deleteQuery2, [schedulingID, organization])


    await client.query('COMMIT')

    return res.status(200).send({ message: 'Course removed successfully.' })

  } 
  catch (error) {

    console.error(error)

    await client.query('ROLLBACK')

    return res.status(500).send({ message: 'Internal Server Error!' })

  } 
  finally {

    if (client) {

      client.release()

    }
  }
}





exports.otherCategory = async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const query = `SELECT category FROM organizations WHERE type=$1`;
    const result = await client.query(query, ['Other']);
    if (result.rows.length === 0) {
      return res.send({ message: "Nothing to show or not created!." });
    }
    return res.send({ organizations: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error!.' });
  } finally {
    if (client) {
    await  client.release();
    }
  }
};


exports.courseAssi = async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const query = `SELECT organization FROM organizations`;
    const result = await client.query(query);
    if (result.rows.length === 0) {
      return res.send({ message: "Nothing To Show" });
    }
    return res.send({ organization: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error creating organization' });
  } finally {
    if (client) {
    await  client.release();
    }
  }
};


exports.idAssi = async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const query = `SELECT course_id FROM courses`;
    const result = await client.query(query);
    if (result.rows.length === 0) {
      return res.send({ message: "Nothing To Show" });
    }
    return res.send({ courses: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error creating organization' });
  } finally {
    if (client) {
    await  client.release();
    }
  }
};



exports.departAssi = async (req, res) => {
  let client;
  try {
    const { org_name, courseId, des } = req.body;
    const query = 'INSERT INTO org_assi(organization_name, course_id, des) VALUES($1, $2, $3)';
    const values = [org_name, courseId, des];
    client = await pool.connect();
    await client.query(query, values);
    return res.status(200).json({ message: 'Successfully created' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error creating organization' });
  } finally {
    if (client) {
    await  client.release();
    }
  }
};



exports.viewdepartAssi = async (req, res) => {
  let connection
  try {
     connection = await pool.connect();
    const result = await connection.query(`SELECT organization_name,course_id,organization_course_id,code,course_no,batch_no,scheduling_id,to_char(date_commencement,'DD/MM/YYYY') as date_commencement,to_char(date_completion,'DD/MM/YYYY') as date_completion,to_char(date_assigned,'DD/MM/YYYY') as date_assigned FROM organization_course_assi`);
    if (result.rowCount===0) {
      return res.status(404).send({message:'No Records to Display!.'})
    }
   return res.status(200).send(result.rows);
  } catch (error) {
    console.error(error);
   return res.status(500).send({ message: 'Something went wrong!' });
  }
  finally {
    if (connection) {
    await  connection.release();
    }
  }
};