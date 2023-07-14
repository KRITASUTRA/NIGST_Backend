const pool = require("../config/pool");
const bcrypt = require('bcrypt')
const generateNumericValue = require("../generator/NumericId");
const jwt = require('jsonwebtoken');


exports.adminCreation = async (req, res) => {

 let client

  try {

    const { username, phone, email, password, role, faculty } = req.body


    const validRoles = ["NIGST Admin", "Faculty Admin"]

    if (!validRoles.includes(role)) {

      throw new Error("Invalid role. Only NIGST Admin, Faculty Admin are allowed.")

    }

     client = await pool.connect()

    const query1 = "SELECT * FROM admin WHERE username=$1 OR email=$2"

    const result = await client.query(query1, [username, email])


    if (result.rows.length !== 0) {

      throw new Error("UserName or email already exists.")

    }

    let adminId = "A-NIGST-" + generateNumericValue(5)

    const query2 = "SELECT * FROM admin WHERE admin_id = $1"

    let result2 = await client.query(query2, [adminId])

    while (result2.rows.length !== 0) {

      adminId = "A-NIGST-" + generateNumericValue(5)

      result2 = await client.query(query2, [adminId])

    }

    const salt = await bcrypt.genSalt(16)

    const hashedPass = await bcrypt.hash(password, salt)


    const data = [username, phone, email, hashedPass, adminId, role, faculty]

    const query3 =  "INSERT INTO admin (username, phone, email, password, admin_id, role,faculty) VALUES ($1, $2, $3, $4, $5, $6,$7)"

    await client.query(query3, data)

   return res.send({ message: "Admin successfully created." })


  }
   catch (error) {

    console.log(error)

    return res.status(500).send({ error: error.message || "Internal Server Error." })

  }
  finally{

    if (client) {

      await client.release()
      
    }
  }
}

exports.adminLogin = async (req, res) => {

  let client

  try {
    const { email, password, username } = req.body

     client = await pool.connect()

    const query = "SELECT * FROM admin WHERE email = $1 OR username=$2"

    const result = await client.query(query, [email, username])

    if (result.rows.length === 0) {

      throw new Error("User Not Exists.")

    }

    const admin = result.rows[0]

    const isMatch = await bcrypt.compare(password, admin.password)


    if (!isMatch) {

      throw new Error("Wrong password.")
    
    }

    const data = {

      id: result.rows[0].admin_id

    }

    const token = jwt.sign(data, process.env.JWT_SECRET, { expiresIn: '1h' })

    const type = result.rows[0].role

    const faculty = result.rows[0].faculty


    return res.send({ message: "Login successful.", token, type, faculty })

  

  } 
  catch (error) {

    console.log(error)

  return  res.status(500).send({ error: "Server Error.", message: error.message })

  }
finally{

  if (client) {

    await client.release()

  }
}
}

// exports.adminFilter = async (req, res) => {

//   let client

//   try {

//      client = await pool.connect()

//     const { admin_id } = req.body

//     const query = `SELECT username, role from admin where admin_id = $1`

//     const result = await client.query(query, [admin_id])

//     if (result.rowCount === 0) {
//       res.send(
//         { message: 'nothing to show' }
//       )
//     }
//     res.send(result.rows)
//     await client.release()

//   } catch (error) {
//     console.log(error);
//     res.status(500).send({ error: "Something went wrong." });
//   }
// }
