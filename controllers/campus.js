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
    const path = image.map(image => image.location);

    connection = await pool.connect();

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
//=======================================view data===================================

exports.viewCampus = async (req, res) => {
  let connection;
  try {
    const allViewCampus = "SELECT c_id as id, c_description as description, path,visibility FROM campus";
    connection = await pool.connect();
    const allCampus = await connection.query(allViewCampus);
    if (allCampus.rowCount === 0) {
      return res.status(404).send({ message: 'No image Found' });
    }
    const imageData = [];

    for (const row of allCampus.rows) {
      const { id, description,path,visibility } = row;
      const fileUrl = path;
      const key = 'campuss/' + fileUrl.substring(fileUrl.lastIndexOf('/') + 1);

      try {
        const s3Client = new S3Client({
          region: process.env.BUCKET_REGION,
          credentials: {
            accessKeyId: process.env.ACCESS_KEY,
            secretAccessKey: process.env.SECRET_ACCESS_KEY,
          },
        });

        const command = new GetObjectCommand({
          Bucket: process.env.BUCKET_NAME,
          Key: key,
        });
        const path = await getSignedUrl(s3Client, command, { expiresIn: 36000 });

        imageData.push({ id,description,path,visibility });
      } catch (error) {
        console.error(`Error retrieving file '${key}': ${error}`);
      }
    }
    if (imageData.length === 0) {
      return res.status(404).send({ error: 'Image not found.' });
    }

    return res.send({ data: imageData });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: 'Internal server error!' });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};

// =======================================view for web==========================================
exports.viewWebCampus = async (req, res) => {
  let connection;
  try {
    const allViewCampus = "SELECT c_id as id, c_description as description, path,visibility FROM campus WHERE visibility=true";
    connection = await pool.connect();
    const allCampus = await connection.query(allViewCampus);
    if (allCampus.rowCount === 0) {
      return res.status(404).send({ message: 'No image Found' });
    }
    const imageData = [];

    for (const row of allCampus.rows) {
      const { id, description,path } = row;
      const fileUrl = path;
      const key = 'campuss/' + fileUrl.substring(fileUrl.lastIndexOf('/') + 1);

      try {
        const s3Client = new S3Client({
          region: process.env.BUCKET_REGION,
          credentials: {
            accessKeyId: process.env.ACCESS_KEY,
            secretAccessKey: process.env.SECRET_ACCESS_KEY,
          },
        });

        const command = new GetObjectCommand({
          Bucket: process.env.BUCKET_NAME,
          Key: key,
        });
        const path = await getSignedUrl(s3Client, command, { expiresIn: 36000 });

        imageData.push({ id,description,path });
      } catch (error) {
        console.error(`Error retrieving file '${key}': ${error}`);
      }
    }
    if (imageData.length === 0) {
      return res.status(404).send({ error: 'Image not found.' });
    }

    return res.send({ data: imageData });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: 'Internal server error!' });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};


//======================================UPDATE=========================================

const { validationResult } = require('express-validator');

exports.updateCampus = async (req, res) => {
  try {
    // Validate inputs using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { description, id} = req.body;
     const image = req.files.image;
     const path = image[0].location;
    const checkQuery = 'SELECT * FROM campus WHERE c_id = $1';
    const updateQuery =
      'UPDATE campus SET c_description=$1, path=$2 WHERE c_id = $3';

    const client = await pool.connect();

    try {
      const checkResult = await client.query(checkQuery, [id]);

      if (checkResult.rowCount === 0) {
        return res.status(404).json({ message: 'This Project Does Not Exist!' });
      }

      const campusData = checkResult.rows[0];
      const {
        c_description: currentCdescription,
        path: currentPath
      } = campusData;

      const updatedCdescription = description || currentCdescription;
     
      const updatePath = path || currentPath;

      await client.query(updateQuery, [
        updatedCdescription,
        updatePath,
        id
      ]);

      return res.status(200).json({ message: 'Successfully Updated!' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error!' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error!' });
  }
};



exports.updateVisibilityCampus = async (req, res) => {
  try {
    // Validate inputs using express-validator
    

    const {id, visibility} = req.body;
    const checkQuery = 'SELECT * FROM campus WHERE c_id = $1';
    const updateQuery =
      'UPDATE campus SET  visibility=$1 WHERE c_id = $2';

    const client = await pool.connect();

    try {
      const checkResult = await client.query(checkQuery, [id]);
  
      if (checkResult.rowCount === 0) {
        return res.status(404).json({ message: 'This Project Does Not Exist!' });
      }

      const campusData = checkResult.rows[0];
      const {
        visibility: currentVisibility
      } = campusData;

      
      const updatedVisibility =
        (visibility !== undefined) ? visibility : currentVisibility;

      await client.query(updateQuery, [
        updatedVisibility,
        id
      ]);

      return res.status(200).json({ message: 'Successfully Visibility Updated!' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error!' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error!' });
  }
};



// =============================delete=======================

exports.deleteCampus = async (req, res) => {
  let connection;
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).send({ message: "Please provide the campus ID" });
    }
    connection = await pool.connect();
    const ExistanceID = "SELECT * FROM campus WHERE c_id=$1";
    const result = await connection.query(ExistanceID, [id]);
    if (result.rowCount === 0) {
      return res.status(404).send({ message: "Campus ID does not exist!" });
    }

    // Retrieve the file path from the database
    const filePathQuery = "SELECT path FROM campus WHERE c_id=$1";
    const filePathResult = await connection.query(filePathQuery, [id]);
    const filePath = filePathResult.rows[0].path;

    const delCampus = "DELETE FROM campus WHERE c_id=$1";
    await connection.query(delCampus, [id]);

    // Delete file from S3
    const s3Client = new S3Client({
      region: process.env.BUCKET_REGION,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
      },
    });
    const key = filePath.substring(filePath.lastIndexOf('/') + 1);
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
    });
    await s3Client.send(deleteCommand);

    return res.status(200).send({ message: "Successfully Deleted!" });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Internal server error!" });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};