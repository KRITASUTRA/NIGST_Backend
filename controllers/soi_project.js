const pool = require("../config/pool");
const generateNumericValue = require("../generator/NumericId");
const { S3Client, GetObjectCommand,DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// =============create===============================
exports.createProject = async (req, res) => {
  let connection;
  try {
    const { Pname, Pdescription, Purl } = req.body;
    const image = req.files.image;
    const path = image[0].location;

    connection = await pool.connect();

    if (!Pname || !Pdescription) {
      return res.status(400).send({ message: "Please enter all the data" });
    }

    const checkExistence = "SELECT * FROM soi_project WHERE p_name = $1";
    const result2 = await connection.query(checkExistence, [Pname]);

    if (result2.rowCount > 0) {
      return res.status(500).send({ message: 'Data Already Exists!' });
    }

    let PID = 'P-' + generateNumericValue(7);
    const check = 'SELECT * FROM soi_project WHERE p_id = $1';
    let result = await connection.query(check, [PID]);

    while (result.rowCount > 0) {
      PID = 'P-' + generateNumericValue(7);
      result = await connection.query(check, [PID]);
    }

    const insertQuery = 'INSERT INTO soi_project (p_id, p_name, p_description, path, url) VALUES ($1, $2, $3, $4, $5)';
    const data = [PID, Pname, Pdescription, path, Purl];
    const result1 = await connection.query(insertQuery, data);

    return res.status(200).send({ message: 'Project created successfully!' });
  } catch (error) {
    console.error(error);
    return res.status(400).send({ message: 'Error creating project!' });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};



// ====================get all data======================

exports.viewProject = async (req, res) => {
  let connection;
  try {
    const allViewProject = "SELECT p_name as name, p_description, path,url,visibility, p_id as pid FROM soi_project";
    connection = await pool.connect();
    const allProject = await connection.query(allViewProject);
    if (allProject.rowCount === 0) {
      return res.status(404).send({ message: 'No image Found' });
    }
    const imageData = [];

    for (const row of allProject.rows) {
      const { name, p_description,path,pid,visibility,url } = row;
      const fileUrl = path;
      const key = 'soi_project/' + fileUrl.substring(fileUrl.lastIndexOf('/') + 1);

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
        const Purl = await getSignedUrl(s3Client, command, { expiresIn: 36000 });

        imageData.push({ name, url,pid,p_description,visibility,Purl });
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

exports.viewProjectForWeb = async (req, res) => {
  let connection;
  try {
    const allViewProject = "SELECT p_name as name, p_description, path,url, p_id as pid FROM soi_project WHERE visibility=true";
    connection = await pool.connect();
    const allProject = await connection.query(allViewProject);
    if (allProject.rowCount === 0) {
      return res.status(404).send({ message: 'No image Found' });
    }
    const imageData = [];

    for (const row of allProject.rows) {
      const { name, p_description,path,pid,url } = row;
      const fileUrl = path;
      const key = 'soi_project/' + fileUrl.substring(fileUrl.lastIndexOf('/') + 1);

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
        const Purl = await getSignedUrl(s3Client, command, { expiresIn: 36000 });

        imageData.push({ name, Purl,pid,p_description,url });
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



// ===================update============================

exports.updateSoiProject = async (req, res) => {
  let client;
  try {
    const { Pname, Pdescription, Pid, visibility, Purl } = req.body;
    const checkQuery = 'SELECT * FROM soi_project WHERE p_id = $1';
    const updateQuery =
      'UPDATE soi_project SET p_name = $1, p_description = $2, visibility = $3, url = $4 WHERE p_id = $5';

    client = await pool.connect();

    const checkResult = await client.query(checkQuery, [Pid]);
    if (checkResult.rowCount === 0) {
      return res.status(404).send({ message: 'This Project Does Not Exist!' });
    }

    const projectData = checkResult.rows[0];
    const { p_name: currentPname, p_description: currentPdescription, visibility: currentVisibility, url: currentUrl } = projectData;

    const updatedPname = Pname || currentPname;
    const updatedPdescription = Pdescription || currentPdescription;
    const updatedVisibility = (visibility !== undefined) ? visibility : currentVisibility; 
    const updatedUrl = Purl || currentUrl;

    await client.query(updateQuery, [updatedPname, updatedPdescription, updatedVisibility, updatedUrl, Pid]);

    return res.status(200).send({ message: 'Successfully Updated!' });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Internal server error!' });
  } finally {
    if (client) {
      client.release();
    }
  }
};






// =============================delete=======================

exports.deleteProject = async (req, res) => {
  let connection;
  try {
    const { Pid } = req.body;
    if (!Pid) {
      return res.status(400).send({ message: "Please provide the Project ID" });
    }
    connection = await pool.connect();
    const ExistanceProject_ID = "SELECT * FROM soi_project WHERE p_id=$1";
    const result = await connection.query(ExistanceProject_ID, [Pid]);
    if (result.rowCount === 0) {
      return res.status(404).send({ message: "Project ID does not exist!" });
    }

    // Retrieve the file path from the database
    const filePathQuery = "SELECT path FROM soi_project WHERE p_id=$1";
    const filePathResult = await connection.query(filePathQuery, [Pid]);
    const filePath = filePathResult.rows[0].path;

    const delProject = "DELETE FROM soi_project WHERE p_id=$1";
    await connection.query(delProject, [Pid]);

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