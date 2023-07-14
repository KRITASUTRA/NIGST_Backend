const pool = require("../config/pool");
const generateShortId = require("../generator/shortID");








exports.courseCategoryCreation = async (req, res) => {

  let client

  try {

    client = await pool.connect()

    const { name } = req.body

    const checkQuery = `SELECT * FROM course_category WHERE course_category_name = $1`
    const checkId = `SELECT * FROM course_category WHERE category_id = $1`

    const checkValues = [name]

    const checkResult = await client.query(checkQuery, checkValues)

    if (checkResult.rowCount > 0) {

      return res.status(409).json({ message: "Course category already exists" })

    }
    let categoryId = 'C-' + generateShortId(5);
    let result = await client.query(checkId, [categoryId]);

    while (result.rowCount > 0) {
      categoryId = 'C-' + generateShortId(5);
      result = await client.query(checkId, [categoryId]);
    }



    const query = `
      INSERT INTO course_category (course_category_name, category_id)
      VALUES ($1, $2)
    `
    const values = [name, categoryId]

    await client.query(query, values)


    return res.status(201).json({ message: 'Successfully Created' })

  }
  catch (err) {

    console.error(err)

    return res.status(500).json({ message: "Internal server error" })

  }
  finally {

    if (client) {

      await client.release()

    }
  }
}

exports.viewCategoryList = async (req, res) => {

  let client

  try {

    client = await pool.connect()

    const check = 'SELECT course_category_name as category,category_id as catID from course_category'

    const result = await client.query(check)

    if (result.rowCount === 0) {

      return res.status(404).send({ message: 'No Category Found!.' })

    }

    return res.status(200).send({ categories: result.rows })

  }
  catch (error) {

    console.log(error)

    return res.status(500).send({ message: 'Internal Server Error!.' })

  }
  finally {

    if (client) {

      await client.release()

    }
  }
}


exports.addCodeToCategory = async (req, res) => {

  let connection

  try {

    const { name, code } = req.body

    const check = 'SELECT * FROM category_code WHERE category=$1 AND code=$2'

    const result = await client.query(check, [name, code])

    if (result.rowCount > 0) {

      return res.send({ message: `This code already allocated to: ${name}` })

    }
    else {

      const insertQ = 'INSERT INTO category_code (category,code) VALUES ($1,$2)'

      await connection.query(insertQ, [name, code])

      return res.status(201).send({ message: 'Successfully added code.' })

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

exports.addNumberToCategory = async (req, res) => {

  let connection

  try {

    const { name, number } = req.body

    const check = 'SELECT * FROM category_number WHERE category=$1 AND number=$2'

    const result = await client.query(check, [name, number])

    if (result.rowCount > 0) {

      return res.send({ message: `This code already allocated to: ${name}` })

    }
    else {

      const insertQ = 'INSERT INTO category_code (category,number) VALUES ($1,$2)'

      await connection.query(insertQ, [name, number])

      return res.status(201).send({ message: 'Successfully added code.' })

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


exports.getNumberByCategory = async (req, res) => {

  let connection

  try {

    const { category } = req.body

    connection = await pool.connect()

    const query = 'SELECT number FROM category_number WHERE category = $1'

    const result = await connection.query(query, [category])

    if (result.rowCount === 0) {

      return res.status(404).send({ message: `No numbers found for category: ${category}` })

    }
    else {

      const numbers = result.rows.map((row) => row.number)

      return res.status(200).send({ category, numbers })

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





exports.getCodeByCategory = async (req, res) => {

  let connection

  try {

    const { category } = req.body

    connection = await pool.connect()

    const query = 'SELECT number FROM category_code WHERE category = $1'

    const result = await connection.query(query, [category])

    if (result.rowCount === 0) {

      return res.status(404).send({ message: `No numbers found for category: ${category}` })

    }
    else {

      const numbers = result.rows.map((row) => row.number)

      return res.status(200).send({ category, numbers })

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

