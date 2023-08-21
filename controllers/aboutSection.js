const pool = require("../config/pool");
const generateNumericValue = require("../generator/NumericId");

// ================================Created=============================
exports.createSection = async (req, res) => {
    let connection;
    try {
        const{name,description}=req.body;
        const image= req.files.image;
        const path = image[0].location;
        connection=await pool.connect();

    // const checkExistence = 'SELECT * FROM about_section WHERE a_name = $1';
    // const countResult = await connection.query(checkExistence, [name]);
    // const imageCount = parseInt(countResult.rows[0].count);

    // if (imageCount + images.length > 2) {
    //   return res.status(400).send('Maximum limit of 1 image.');
    // }


      const check = 'SELECT * FROM about_section WHERE a_id = $1';
      let aid = 'A-' + generateNumericValue(8);
      let result = await connection.query(check, [aid]);

      while (result.rowCount > 0) {
        aid = 'A-' + generateNumericValue(8);
        result = await connection.query(check, [aid]);
      }

      const query = 'INSERT INTO about_section (a_id,a_name,path,a_description) VALUES ($1, $2, $3, $4)';
      const values = [aid, name, path, description];
      await connection.query(query, values);
    

    return res.status(201).send({ message: 'Created successfully' });
    } catch (error) {
        console.error(error);
    return res.status(400).send({ message: 'Error creating about section!' });
    }
    finally {
        if (connection) {
          await connection.release();
        }
    }
};

//=======================================view data===================================

exports.viewAboutSection = async (req, res) => {
    let connection;
    try {
      const allViewSection = "SELECT a_id as id, a_name as name, path, a_description as description  FROM about_section WHERE visibility=true";
      connection = await pool.connect();
      const allSection = await connection.query(allViewSection);
      if (allSection.rowCount === 0) {
        return res.status(404).send({ message: 'No image Found' });
      }
      const imageData = [];
  
      for (const row of allSection.rows) {
        const { id, name, path, description } = row;
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
  
          imageData.push({ id,name, path, description });
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
  exports.viewWebAboutSection = async (req, res) => {
    let connection;
    try {
      const allViewSection = "SELECT a_id as id, a_name as name, path, a_description as description  FROM about_section WHERE visibility=true";
      connection = await pool.connect();
      const allSection = await connection.query(allViewSection);
      if (allSection.rowCount === 0) {
        return res.status(404).send({ message: 'No image Found' });
      }
      const imageData = [];
  
      for (const row of allSection.rows) {
        const { id, name, path, description } = row;
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
  
          imageData.push({ id,name, path, description });
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
exports.updateAboutSection= async (req, res) => {
    let client;
    try {
      const { description,id,name, visibility,path } = req.body;
      const checkQuery = 'SELECT * FROM about_section WHERE a_id = $1';
      const updateQuery =
        'UPDATE zbout_section SET a_name=$1,a_description=$2,path=$3,visibility=$4 WHERE c_id = $5';
  
      client = await pool.connect();
  
      const checkResult = await client.query(checkQuery, [id]);
      if (checkResult.rowCount === 0) {
        return res.status(404).send({ message: 'This Project Does Not Exist!' });
      }
  
      const sectionData = checkResult.rows[0];
      const { a_name:currentAname,a_description: currentCdescription, path: currentPath, visibility: currentVisibility  } = 
      
      sectionData;
  
      const updatedName=name || currentAname;
      const updatedCdescription = description || currentCdescription;
      const updatedVisibility = (visibility !== undefined) ? visibility : currentVisibility; 
      const updatePath = path || currentPath;
  
      await client.query(updateQuery, [ updatedName, updatedCdescription,  updatePath,updatedVisibility, id]);
  
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

exports.deleteAboutSection = async (req, res) => {
    let connection;
    try {
      const { id } = req.body;
      if (!id) {
        return res.status(400).send({ message: "Please provide the section ID" });
      }
      connection = await pool.connect();
      const ExistanceID = "SELECT * FROM about_section WHERE a_id=$1";
      const result = await connection.query(ExistanceID, [id]);
      if (result.rowCount === 0) {
        return res.status(404).send({ message: "Section ID does not exist!" });
      }
  
      // Retrieve the file path from the database
      const filePathQuery = "SELECT path FROM about_section WHERE a_id=$1";
      const filePathResult = await connection.query(filePathQuery, [id]);
      const filePath = filePathResult.rows[0].path;
  
      const delSection = "DELETE FROM about_section WHERE a_id=$1";
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