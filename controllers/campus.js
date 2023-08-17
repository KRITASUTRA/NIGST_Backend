const pool = require("../config/pool");
const generateNumericValue = require("../generator/NumericId");
const { S3Client, GetObjectCommand,DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// =============create===============================
exports.createCampus = async (req, res) => {
  let connection;
  try {
    const { Cdescription } = req.body;
    const image = req.files.image;
    const path = image[0].location;

    connection = await pool.connect();
    // const checkExistence = "SELECT * FROM campus WHERE c_id = $1";
    // const result2 = await connection.query(checkExistence, []);

    let CID = 'C-' + generateNumericValue(7);
    const check = 'SELECT * FROM campus WHERE c_id = $1';
    let result = await connection.query(check, [CID]);

    while (result.rowCount > 0) {
      CID = 'C-' + generateNumericValue(7);
      result = await connection.query(check, [CID]);
    }
    const insertQuery = 'INSERT INTO campus (c_id, c_description, path) VALUES ($1, $2, $3)';
    const data = [CID,Cdescription,path];
    const result1 = await connection.query(insertQuery, data);

    return res.status(200).send({ message: 'created successfully!' });
  } catch (error) {
    console.error(error);
    return res.status(400).send({ message: 'Error creating campus!' });
  }
  finally {
    if (connection) {
      await connection.release();
    }
}
}
