const pool = require("../config/pool");
const generateNumericValue = require("../generator/NumericId");
const { S3Client, GetObjectCommand,DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// =============create===============================
exports.createNigstHostel = async (req, res) => {
  let connection;
  try {
    const { description } = req.body;
    const image = req.files.image;
    const path = image[0].location;

    connection = await pool.connect();

    let HID = 'H-' + generateNumericValue(7);
    const check = 'SELECT * FROM nigst_hostel WHERE h_id = $1';
    let result = await connection.query(check, [HID]);

    while (result.rowCount > 0) {
      HID = 'H-' + generateNumericValue(7);
      result = await connection.query(check, [HID]);
    }
    const insertQuery = 'INSERT INTO nigst_hostel (h_id, h_description, path) VALUES ($1, $2, $3)';
    const data = [HID,description,path];
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

exports.viewNigstHostel = async (req, res) => {
  let connection;
  try {
    const allHostel = "SELECT h_id as id, h_description as description, path,visibility FROM nigst_hostel";
    connection = await pool.connect();
    const alHostel = await connection.query(allHostel);
    if (alHostel.rowCount === 0) {
      return res.status(404).send({ message: 'No image Found' });
    }
    const imageData = [];

    for (const row of alHostel.rows) {
      const { id, description,path,visibility } = row;
      const fileUrl = path;
      const key = 'nigst_hostel/' + fileUrl.substring(fileUrl.lastIndexOf('/') + 1);

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
exports.viewWebNigstHostel = async (req, res) => {
    let connection;
    try {
      const allHostel = "SELECT h_id as id, h_description as description, path FROM nigst_hostel WHERE visibility=true";
      connection = await pool.connect();
      const alHostel = await connection.query(allHostel);
      if (alHostel.rowCount === 0) {
        return res.status(404).send({ message: 'No image Found' });
      }
      const imageData = [];
  
      for (const row of alHostel.rows) {
        const { id, description,path } = row;
        const fileUrl = path;
        const key = 'Facility/' + fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
  
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
exports.updateNigstHostel= async (req, res) => {
  let client;
  try {
    const { description,id } = req.body;
    const image = req.files && req.files.image; // Check if req.files is defined
    const path = image[0].location;
    
    const checkQuery = 'SELECT * FROM nigst_hostel WHERE h_id = $1';
    const updateQuery =
      'UPDATE nigst_hostel SET h_description=$1,path=$2 WHERE h_id = $3';

    client = await pool.connect();



    const checkResult = await client.query(checkQuery, [id]);
    if (checkResult.rowCount === 0) {
      return res.status(404).send({ message: 'This Project Does Not Exist!' });
    }

    const HostelData = checkResult.rows[0];
    const { h_description: currentCdescription, path: currentPath  } = HostelData;

    const updatedCdescription = description || currentCdescription; 
    const updatePath = path || currentPath;

    await client.query(updateQuery, [ updatedCdescription,  updatePath, id]);

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

//============================update visibility=====================================================

exports.updateVisibleHostel = async (req, res) => {
  try {

  const { visibility, id } = req.body;
  

  //const path = image[0].location;
       const checkQuery = 'SELECT * FROM nigst_hostel WHERE h_id = $1';
  const updateQuery =
    'UPDATE nigst_hostel SET visibility=$1  WHERE h_id = $2';

  const client = await pool.connect();

  try {
    const checkResult = await client.query(checkQuery, [id]);
    // console.log(checkResult)
    if (checkResult.rowCount === 0) {
      return res.status(404).json({ message: 'This Project Does Not Exist!' });
    }

    const sportsData = checkResult.rows[0];
    const {
      visibility: currentVisibility
      } = sportsData;

      const updatedVisibility =
        visibility !== undefined ? visibility : currentVisibility;

    await client.query(updateQuery, [
      updatedVisibility,
      id
    ]);
    return res.status(200).json({ message: 'Successfully visible Updated!' });
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

exports.deleteNigstHostel = async (req, res) => {
  let connection;
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).send({ message: "Please provide the Hostel ID" });
    }
    connection = await pool.connect();
    const ExistanceID = "SELECT * FROM nigst_hostel WHERE h_id=$1";
    const result = await connection.query(ExistanceID, [id]);
    if (result.rowCount === 0) {
      return res.status(404).send({ message: "Nigst hostel ID does not exist!" });
    }

    // Retrieve the file path from the database
    const filePathQuery = "SELECT path FROM nigst_hostel WHERE h_id=$1";
    const filePathResult = await connection.query(filePathQuery, [id]);
    const filePath = filePathResult.rows[0].path;

    const delNigstHostel = "DELETE FROM nigst_hostel WHERE h_id=$1";
    await connection.query(delNigstHostel, [id]);

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