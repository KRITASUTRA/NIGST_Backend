const pool = require("../config/pool");
const generateNumericValue = require("../generator/NumericId");
const { S3Client, GetObjectCommand,DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// =============create===============================
exports.createEvaluation=async(req,res) =>{
    let connection;
    try{
    const{name,designation,position}=req.body;
    const image=req.files.image;
    const path=image[0].location;

    connection= await pool.connect();

    let GID='G-'+generateNumericValue(7);
    const check='SELECT * FROM board_of_evaluation WHERE g_id=$1';
    let result=await connection.query(check,[GID]);


while(result.rowCount>0)
{
    GID='G-'+generateNumericValue(7);
    result=await connection.query(check,[GID]);
}

const insertQuery='INSERT INTO board_of_evaluation (g_id,g_name,g_designation,g_position,path) VALUES($1,$2,$3,$4,$5)';
const result1=await connection.query(insertQuery,[GID,name,designation,position,path]);

return res.status(200).send({message:'Created Successfully!'});
}
catch(error){
    console.error(error);
    return res.status(400).send({message:'Error creating board of Evaluation!'})

}
finally{
    if(connection){
        await connection.release();
    }
}
};

exports.viewEvaluation=async(req,res)=>{
    let connection;
    try{
    const allEvaluation='SELECT g_id as id,g_name as name, g_designation as designation,path from board_of_evaluation';
    connection=await pool.connect();
    const alEvaluation=await connection.query(allEvaluation)
    if(alEvaluation.rowCount===0){
        return res.status(404).send({message:'No image found!'});

    }
    const imageData=[];

    for(const row of alEvaluation.rows){
        const{id,name,designation,position,path}=row;
        const fileUrl=path;
        const key='/evaluation' + fileUrl.substring(fileUrl.lastIndexOf('/')+1);
        try {
            const s3Client=new S3Client({
                resign:process.env.BUCKET_REGION,
                credentials:{
                    accessKeyId: process.env.ACCESS_KEY,
                    secretAccessKey: process.env.SECRET_ACCESS_KEY,
                }
            });
            const command = new GetObjectCommand({
                Bucket: process.env.BUCKET_NAME,
                Key: key,
              });
              const path = await getSignedUrl(s3Client, command, { expiresIn: 36000 });
      
              imageData.push({ id, name, description,position, path });
        } catch (error) {
            console.error(`Error retrieving file '${key}': ${error}`);
        } 
    }
    if (imageData.length === 0) {
        return res.status(404).send({ error: 'Image not found.' });
      }
  
      return res.send({ data: imageData });


}catch (error) {
    console.log(error);
    return res.status(500).send({ message: 'Internal server error!' });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};

// =======================================view for web==========================================
exports.viewWebEvaluation = async (req, res) => {
    let connection;
    try {
      const allEvaluation = "SELECT g_id as id, g_name as name, g_description as description, path FROM board_of_evaluation WHERE visibility=true";
      connection = await pool.connect();
      const alEvaluation = await connection.query(allEvaluation);
      if (alEvaluation.rowCount === 0) {
        return res.status(404).send({ message: 'No image Found' });
      }
      const imageData = [];
  
      for (const row of alEvaluation.rows) {
        const { id, name, description,position, path } = row;
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
  
          imageData.push({ id, name, description,position, path });
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
exports.updateEvaluation= async (req, res) => {
    let client;
    try {
      const { description,name,id,visibility,path } = req.body;
      const checkQuery = 'SELECT * FROM board_of_evaluation WHERE g_id = $1';
      const updateQuery =
        'UPDATE board_of_evaluation SET g_name=$1, g_description=$2,g_position=$3, path=$4,visibility=$5 WHERE g_id = $6';
  
      client = await pool.connect();
  
  
  
      const checkResult = await client.query(checkQuery, [id]);
      if (checkResult.rowCount === 0) {
        return res.status(404).send({ message: 'This Project Does Not Exist!' });
      }
  
      const evaluationData = checkResult.rows[0];
      const { g_name:currentName,g_description: currentCdescription,g_position:currentPosition,  path: currentPath, visibility: currentVisibility  } =evaluationData;
  
      const updateName=name || currentName;
      const updatedCdescription = description || currentCdescription;
      const updatedVisibility = (visibility !== undefined) ? visibility : currentVisibility; 
      const updatePath = path || currentPath;
  
      await client.query(updateQuery, [ updateName, updatedCdescription,  updatePath,updatedVisibility, id]);
  
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

exports.deleteEvaluation = async (req, res) => {
    let connection;
    try {
      const { id } = req.body;
      if (!id) {
        return res.status(400).send({ message: "Please provide the Governance ID" });
      }
      connection = await pool.connect();
      const ExistanceID = "SELECT * FROM board_of_evaluation WHERE g_id=$1";
      const result = await connection.query(ExistanceID, [id]);
      if (result.rowCount === 0) {
        return res.status(404).send({ message: "evaluation ID does not exist!" });
      }
  
      // Retrieve the file path from the database
      const filePathQuery = "SELECT path FROM board_of_evaluation WHERE g_id=$1";
      const filePathResult = await connection.query(filePathQuery, [id]);
      const filePath = filePathResult.rows[0].path;
  
      const delEvaluation = "DELETE FROM board_of_evaluation WHERE g_id=$1";
      await connection.query(delEvaluation, [id]);
  
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