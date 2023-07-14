const pool = require("../config/pool");
const generateNumericValue = require("../generator/NumericId");



exports.createAnnouncement = async (req, res) => {
  
  let connection

  try {
  
    const { title, description, url } = req.body
  
    let pdfPath = null

    if (req.files && req.files.pdf) {
      
      const fileContent = req.files.pdf
      
      pdfPath = fileContent[0].location
    
    }

    connection = await pool.connect()
    
    const check = 'SELECT * FROM announcement WHERE a_id=$1'

    let AID = 'AN-' +generateNumericValue(5)

    let result = await connection.query(check, [AID])

    while (result.rows.length !== 0) {

      fID = 'AN-'+generateNumericValue(5)

      result = await connection.query(check, [AID])

    }

    const insert = "INSERT INTO announcement (title, description, url, pdf_path,a_id) VALUES ($1, $2, $3, $4,$5)"
    
    const data = [title, description, url, pdfPath,AID]

     await connection.query(insert, data)

    return res.status(201).send({
      message: "Successfully created"
    })

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




exports.archiveAnnouncement = async (req, res) => {
  let connection;

  try {
    const { aid } = req.body;
    connection = await pool.connect();

    await connection.query('BEGIN'); 

    const insert = `INSERT INTO archive_announcement (title, description, url, pdf_path, status, created_at, posted_at, a_id) SELECT title, description, url, pdf_path, status, created_at, posted_at, a_id FROM announcement WHERE a_id = $1 AND status = $2`;
    const insertData = [aid, true];
    const insertResult = await connection.query(insert, insertData);

    if (insertResult.rowCount === 0) {
      await connection.query('ROLLBACK'); 
      return res.status(404).send({ message: 'Announcement Not Exists or Cannot archive hidden announcement.' });
    }

    const deleteq = 'DELETE FROM announcement WHERE a_id = $1';
    await connection.query(deleteq, [aid]);

    await connection.query('COMMIT'); 

    return res.status(200).send({
      message: 'Successfully archived'
      
    });
  } catch (error) {
    console.error(error);
    if (connection) {
      await connection.query('ROLLBACK'); 
    }
    return res.status(500).send({ message: 'Internal Server Error!.' });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};


exports.retrieveAnnouncement = async (req, res) => {

  const client = await pool.connect()

  try {

    await client.query('BEGIN')

    const { id } = req.body

    const retrieve = `
      INSERT INTO announcement(title, description, url, photo_path, status, created_at) 
      SELECT title, description, url, photo_path, FALSE, created_at 
      FROM archive_announcement WHERE id=$1

    `;
    await client.query(retrieve, [id])

    const deleteData = "DELETE FROM archive_announcement WHERE id=$1"

    await client.query(deleteData, [id])

    await client.query('COMMIT')

    res.status(200).send({ message: "Successfully restored" })

  }
  catch (error) {

    await client.query('ROLLBACK')

    console.error(error)

    res.status(500).send({ message: "Something went wrong!" })

  }
  finally {

    client.release()

  }
}



exports.viewAnnouncements = async (req, res) => {

  try {

    const connection = await pool.connect()

    const query = "SELECT * FROM announcement"

    const result = await connection.query(query)

    res.status(200).send({ announcements: result.rows })

    await connection.release()

  }
  catch (error) {

    console.error(error)

    return res.status(500).send({ message: 'Something went wrong!' })

  }
}





exports.assignSubjects = async (req, res) => {

  try {

    const connection = await pool.connect()

    const { facultyId, subjects } = req.body


    const check1 = 'SELECT * FROM faculty WHERE faculty_id = $1'

    const result1 = await connection.query(check1, [facultyId])

    if (result1.rows.length === 0) {

      res.status(404).send({ message: 'Please select valid Faculty.' })

      return

    }

    for (const subject of subjects) {

      const check2 = 'SELECT * FROM assigned_subjects WHERE faculty_id = $1 AND subject_name = $2'

      const result2 = await connection.query(check2, [facultyId, subject])

      if (result2.rows.length > 0) {

        continue

      }

      const data = [facultyId, subject]

      const insertQ = 'INSERT INTO assigned_subjects(faculty_id, subject_name) VALUES ($1, $2)'

      await connection.query(insertQ, data)

    }

    res.status(201).send({ message: 'Successfully assigned.' })

    await connection.release()

  }
  catch (error) {

    console.error(error)

    res.status(500).send({ message: 'Something went wrong!' })

  }
}


exports.createFaculty = async (req, res) => {
  let connection;
  try {
    const { name } = req.body;
    connection = await pool.connect();
    const check = 'SELECT * FROM faculty_name WHERE name=$1';
    const result = await connection.query(check, [name]);

    if (result.rowCount > 0) {
      return res.status(409).send({ message: 'Faculty Already Exists.' });
    } else {
      const check = 'SELECT * FROM faculty_name WHERE f_id=$1';
      let fID = generateNumericValue(5);
      let result = await connection.query(check, [fID]);

      while (result.rows.length !== 0) {
        fID = generateNumericValue(5);
        result = await connection.query(check, [fID]);
      }

      const data = [name, fID];
      const create = 'INSERT INTO faculty_name(name,f_id) VALUES($1,$2)';
      await connection.query(create, data);

      return res.status(201).send({ message: 'Successfully Created.' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Internal Server Error.' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
