const pool = require("../config/pool");
const generateNumericValue = require("../generator/NumericId");
const sendMail = require("../mailing_Service/mailconfig");


exports.createOffice = async (req, res) => {

  let connection

  try {

    const { name, email } = req.body

    const check = 'SELECT * FROM office WHERE office_name = $1'

    connection = await pool.connect()

    const result = await connection.query(check, [name])

    if (result.rowCount > 0) {

      return res.status(400).json({ message: 'This name already exists!' })

    }

    let oid = 'O-' + generateNumericValue(5)

    const check2 = 'SELECT * FROM office WHERE o_id = $1'

    let result01 = await connection.query(check2, [oid])

    while (result01.rowCount > 0) {

      oid = 'O-' + generateNumericValue(5)

      result01 = await connection.query(check2, [oid])

    }

    const insertQuery = 'INSERT INTO office (o_id, office_name, office_email, date) VALUES ($1, $2, $3, $4)'

    const date = new Date()

    const data = [oid, name, email, date]

    await connection.query(insertQuery, data)

    return res.status(201).json({ message: 'Successfully created.' })

  }
   catch (error) {

    console.error(error)

    return res.status(500).json({ message: 'Internal Server Error' })

  } 
  finally {

    if (connection) {

      await connection.release()

    }
  }
}

exports.postContact = async (req, res) => {

  let client
  
  try {

    const { name, email, phone, subject, description } = req.body
    
    client = await pool.connect()

    await client.query('BEGIN')

    const queryText = `INSERT INTO contact_form(name, email, phone, subject, description) VALUES ($1, $2, $3, $4, $5)`

    const queryParams = [name, email, phone, subject, description]
    
    await client.query(queryText, queryParams)

    const officeQuery = 'SELECT office_email FROM office WHERE office_name = $1'

    const officeResult = await client.query(officeQuery, [subject])
    
    if (officeResult.rows.length === 0) {

      return res.status(404).json({ message: 'This subject does not exist.' })
    
    }

    const admin = officeResult.rows[0].office_email

    sendMail(
      admin,
      `${subject} Query`,
      `${name} wants to contact you on the topic: ${subject}. Their email is: ${email}. Please address their query.`
    )

    sendMail(
      email,
      `${subject} Query Submitted`,
      `Hello ${name}, your query on the topic ${subject} has been successfully submitted. We will contact you soon.`
    )

    await client.query('COMMIT')

    return res.status(200).send('Successfully sent feedback')
  
  } 
  catch (error) {
  
    console.error(error)
  
    await client.query('ROLLBACK')
  
    return res.status(500).json({ message: 'Internal Server Error' })
  
  } 
  finally {

    if (client) {
  
      await client.release()
  
    }
  }
}



exports.viewContact = async(req,res)=>{

  let connection

  try{

     connection = await pool.connect()

    const query = `SELECT to_char(received_at,'YYYY/MM/DD') as received_at, name,email ,phone ,subject ,description,id  FROM contact_form ORDER BY received_at DESC`


    const result = await connection.query(query)

   return res.send( { details: result.rows })

   
  }
  catch (error) {

    console.error(error)

    return res.status(500).send({ message: 'Internal Server Error!' })

  }
  finally{

    if (connection) {

      await connection.release()

    }
  }
}

exports.sendOffice=async(req,res)=>{

  let client

  try {
    
    client=await pool.connect()
    
    const check='SELECT office_name as office FROM office WHERE visibility=true'

    const result=await client.query(check)

    if (result.rowCount===0) {
      return res.status(404).json({message:'No Data To Display!.'})
    }

    return res.status(200).json({office:result.rows})

  } 
  catch (error) {
    
    console.error(error)

    return res.status(500).send({message:'Internal Server Error!.'})

  }

  finally{

    if (client) {
      
      await client.release()
    }
  }
}

exports.sendOfficeToAdmin=async(req,res)=>{

  let client

  try {
    
    client=await pool.connect()
    
    const check='SELECT office_name as office,office_email as email,visibility,o_id as oid FROM office'

    const result=await client.query(check)

    if (result.rowCount===0) {
      return res.status(404).json({message:'No Data To Display!.'})
    }

    return res.status(200).json({office:result.rows})

  } 
  catch (error) {
    
    console.error(error)

    return res.status(500).send({message:'Internal Server Error!.'})

  }

  finally{

    if (client) {
      
      await client.release()
    }
  }
}

exports.editVisibility = async (req, res) => {
  let connection;
  try {
    const { oid, visibility } = req.body;
    connection = await pool.connect();

    const check = 'SELECT * FROM office WHERE o_id = $1';
    const result = await connection.query(check, [oid]);
    if (result.rowCount === 0) {
      return res.status(404).send({ message: 'Record Not Found!' });
    }

    const updateQuery = 'UPDATE office SET visibility = $1 WHERE o_id = $2';
    await connection.query(updateQuery, [visibility, oid]);
    
    return res.status(200).send({ message: 'Successfully Updated!' });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Internal Server Error!' });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};

exports.editDetails = async (req, res) => {
  let connection;
  try {
    const { oid, subject,email } = req.body;
    connection = await pool.connect();

    const check = 'SELECT * FROM office WHERE o_id = $1';
    const result = await connection.query(check, [oid]);
    if (result.rowCount === 0) {
      return res.status(404).send({ message: 'Record Not Found!' });
    }

    const updateQuery = 'UPDATE office SET office_name = $1,office_email=$2 WHERE o_id = $3';
    await connection.query(updateQuery, [subject,email, oid]);
    
    return res.status(200).send({ message: 'Successfully Updated!' });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Internal Server Error!' });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};

exports.deleteOffice=async(req,res)=>{
  let connection
  try {
    const {oid}=req.body 
    
    connection=await pool.connect()
  
    const check='SELECT * FROM office WHERE o_id=$1'

    const result=await connection.query(check,[oid])

    if (result.rowCount===0) {
      return res.status(404).send({message:'Not Found!.'})
    }

    const deleteQuery='DELETE FROM office WHERE o_id=$1'

    await connection.query(deleteQuery,[oid])

    return res.status(200).send({message:'Successfully Deleted.'})
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