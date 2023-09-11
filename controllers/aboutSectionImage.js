const pool = require("../config/pool")
const { S3Client, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3")
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { generate } = require("generate-password");
const { v4: uuidv4 } = require('uuid');
const generateNumericValue = require("../generator/NumericId");


//====================================create====================================

exports.createAboutImage = async (req, res) => {
    let connection;
    try {
        const uploadedImages = req.files.image; // Renamed variable
        connection = await pool.connect();
        const countQuery = "SELECT count(*) FROM about_section_image";
        const countResult = await connection.query(countQuery);
        const imageCount = parseInt(countResult.rows[0].count);

        if (imageCount+uploadedImages.length > 5) {
            return res.status(400).send('Maximum limit reached (5 images allowed).');
        }

        for (let i = 0; i < uploadedImages.length; i++) { // Renamed variable
            const uploadedImage = uploadedImages[i]; // Renamed variable
            const path = uploadedImage.location;

            const check = 'SELECT * from about_section_image where a_id = $1';
            let AID = 'A-' + generateNumericValue(8);
            let result = await connection.query(check, [AID]);

            while (result.rowCount > 0) {
                AID = 'A-' + generateNumericValue(8);
                result = await connection.query(check, [AID]);
            }

            const query = 'INSERT INTO about_section_image (path, a_id) values ($1, $2)';
            await connection.query(query, [path, AID]);
        }
        return res.status(201).send({ message: 'Image upload Successful!' });

    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: 'Internal server error!' });
    } finally {
        await connection.release();
    }
}


//===========================view=======================================

exports.viewImages=async(req,res)=>
{
    let connection;
    try{
    const allView='SELECT a_id as id,path,visibility from about_section_image ';
    const connection=await pool.connect();
    const allImage= await connection.query(allView);
    if (allImage.rowCount === 0) {
        return res.status(404).send({ message: 'No image Found' });
      }

    
   
const imageData = [];

    for (const row of allImage.rows) {
      const { id, path,visibility } = row;
      const fileUrl = path;
      const key = 'aboutImage/' + fileUrl.substring(fileUrl.lastIndexOf('/') + 1);

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

        imageData.push({ id, path,visibility });
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


//==================================view for web============================================

exports.viewWebImages=async(req,res)=>
{
    let connection;
    try{
        let limit=3;
    const allView='SELECT a_id as id,path from about_section_image WHERE visibility=true LIMIT $1';
    const connection=await pool.connect();
    const allImage= await connection.query(allView,[limit]);
    if (allImage.rowCount === 0) {
        return res.status(404).send({ message: 'No image Found' });
      }

    
   
const imageData = [];

    for (const row of allImage.rows) {
      const { id, path } = row;
      const fileUrl = path;
      const key = 'aboutImage/' + fileUrl.substring(fileUrl.lastIndexOf('/') + 1);

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

        imageData.push({ id, path });
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


//====================================update==================================================



exports.updateVisibleImages = async (req, res) => {
  let connection;
  try {
    const { id, visibility } = req.body;
    console.log(req.body);

    if(visibility===true)
    {
      const checkQuery = 'SELECT * FROM about_section_image WHERE a_id = $1';
      const checkQuery1 = 'SELECT * FROM about_section_image WHERE  visibility=true';
      const updateQuery = 'UPDATE about_section_image SET visibility = $1 WHERE a_id = $2';
  
      connection = await pool.connect();
  
      const resultQuery = await connection.query(checkQuery, [id]);
      const resultQuery1 = await connection.query(checkQuery1);
      if (resultQuery.rowCount === 0) {
        return res.status(404).send({ message: 'No Images found!' });
      }
  
    
  
      if (resultQuery1.rowCount>=3 ) {
        return res.status(404).send({ message: 'they Only update 3 image!' });
      }
      const aboutData = resultQuery.rows[0];
      const { visibility: currentVisibility } = aboutData;
      const updatedVisibility = visibility !== undefined ? visibility : currentVisibility;
  
      await connection.query(updateQuery, [updatedVisibility, id]);
  
      return res.status(200).send({ message: 'Successfully updated  status of image!' });
    }
    else{
      const query='SELECT * FROM about_section_image WHERE a_id=$1';
      const updateQuery11 = 'UPDATE about_section_image SET visibility = $1 WHERE a_id = $2';
      connection = await pool.connect();
  
      const resultQuery = await connection.query(query, [id]);

      if (resultQuery.rowCount === 0) {
        return res.status(404).send({ message: 'No Images found!' });
      }

      const aboutData = resultQuery.rows[0];
      const { visibility: currentVisibility } = aboutData;
      const updatedVisibility1 = visibility !== undefined ? visibility : currentVisibility;
  
      await connection.query(updateQuery11, [updatedVisibility1, id]);
  
      return res.status(200).send({ message: 'Successfully updated status of image!' });

    }
    
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Internal server error!' });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};



//============================================delete========================================
exports.deleteImages = async (req, res) => {
  let connection;
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).send({ message: "Please provide ID" });
    }
    connection = await pool.connect();
    const ExistanceID = "SELECT * FROM about_section_image WHERE a_id=$1";
    const result = await connection.query(ExistanceID, [id]);
    if (result.rowCount === 0) {
      return res.status(404).send({ message: "ID does not exist!" });
    }

    // Retrieve the file path from the database
    const filePathQuery = "SELECT path FROM about_section_image WHERE a_id=$1";
    const filePathResult = await connection.query(filePathQuery, [id]);
    const filePath = filePathResult.rows[0].path;

    const delSection = "DELETE FROM about_section_image WHERE a_id=$1";
    await connection.query(delSection, [id]);

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




