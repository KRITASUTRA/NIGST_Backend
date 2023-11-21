const { contextsKey } = require("express-validator/src/base");
const pool = require("../config/pool")
const generateNumericValue = require("../generator/NumericId")
const { v4: uuidv4 } = require('uuid');
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");


exports.CreateCarousel=async(req,res)=>{
    let connection

    try {
        const file=req.files.image 
        const randomName=uuidv4()
        const name= `${randomName}.${file[0].mimetype.split('/')[1]}`;

        const path=file[0].location
        connection=await pool.connect()

        const countQuery = 'SELECT COUNT(*) FROM home_carousel'

        const countResult = await connection.query(countQuery)
    
        const rowCount = countResult.rows[0].count
    
    
        if (rowCount >= 10) {
    
          return res.status(400).send('Maximum limit of 10 Uploads reached.')
    
        }

        let cid='HC-'+generateNumericValue(8)

        const check='SELECT * FROM home_carousel WHERE c_id=$1'
        let result=await connection.query(check,[cid])

        while (result.rowCount>0) {
            cid='HC-'+generateNumericValue(8)
            result=await connection.query(check,[cid])
        }

        const InsertQuery='INSERT INTO home_carousel (name,path,c_id,upload_date) VALUES($1,$2,$3,$4)'
        const date=new Date()
        const data=[name,path,cid,date]
        await connection.query(InsertQuery,data)

        return res.status(201).send({message:'Successfully Uploaded.'})
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

//restrict visiblity of images to 5 true max


exports.viewCarouselToAdmin = async (req, res) => {
    let connection;
    try {
      connection = await pool.connect();
      const check = `SELECT c_id, c_status, path, to_char(upload_date, 'YYYY/MM/DD') as uploaddate FROM home_carousel`;
      const result = await connection.query(check);
      if (result.rowCount === 0) {
        return res.status(404).send({ message: "No Data Found" });
      }
      let images = [];
      for (const row of result.rows) {
        const url = row.path;
        const Key = 'home_carousel/' + url.substring(url.lastIndexOf('/') + 1);
        const client = new S3Client({
          region: process.env.BUCKET_REGION,
          credentials: {
            accessKeyId: process.env.ACCESS_KEY,
            secretAccessKey: process.env.SECRET_ACCESS_KEY,
          },
        });
        const command = new GetObjectCommand({
          Bucket: process.env.BUCKET_NAME,
          Key: Key,
        });
        const imageurl = await getSignedUrl(client, command, { expiresIn: 36000 });
        const imagedata = {
          imageurl,
          CId: row.c_id,
          cstatus: row.c_status,
          uploaddate: row.uploaddate
        };
        images.push(imagedata);
      }
  
      // Sort images by upload date in descending order
      images.sort((a, b) => new Date(b.uploaddate) - new Date(a.uploaddate));
  
      return res.status(200).send({ images });
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: 'Internal Server Error!' });
    } finally {
      if (connection) {
        await connection.release();
      }
    }
  };

  exports.visibilityedit=async(req,res)=>{
    let connection
    try {
        connection=await pool.connect()
        const{cid,status}=req.body
        const check='SELECT * FROM home_carousel WHERE c_id=$1'
        const result=await connection.query(check,[cid])
        if (result.rowCount===0) {
            return res.status(404).send({ message: "No Data Found" });
            
        }
        const update_query='UPDATE home_carousel SET c_status=$1 WHERE c_id=$2'
        await connection.query(update_query,[status,cid])
        return res.status(200).send({ message: "Updated Successfully." });
    } catch (error) {
        console.error(error)
        return res.status(500).send({ message: 'Internal Server Error!' });
    } finally {
      if (connection) {
        await connection.release();
      }
    }
}
  
  
  
  
exports.viewCarouselToWeb = async (req, res) => {
  let connection;
  try {
    connection = await pool.connect();
    const check = `SELECT c_id, path FROM home_carousel WHERE c_status=$1 ORDER BY upload_date DESC`;
    const result = await connection.query(check,[true]);
    if (result.rowCount === 0) {
      return res.status(404).send({ message: "No Data Found" });
    }
    let images = [];
    for (const row of result.rows) {
      const url = row.path;
      const Key = 'home_carousel/' + url.substring(url.lastIndexOf('/') + 1);
      const client = new S3Client({
        region: process.env.BUCKET_REGION,
        credentials: {
          accessKeyId: process.env.ACCESS_KEY,
          secretAccessKey: process.env.SECRET_ACCESS_KEY,
        },
      });
      const command = new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: Key,
      });
      const imageurl = await getSignedUrl(client, command, { expiresIn: 36000 });
      const imagedata = {
        imageurl,
        CId: row.c_id,
        cstatus: row.c_status,
        
      };
      images.push(imagedata);
    }

    // Sort images by upload date in descending order
    images.sort((a, b) => new Date(b.uploaddate) - new Date(a.uploaddate));

    return res.status(200).send({ images });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Internal Server Error!' });
  } finally {
    if (connection) {
      await connection.release()
    }
  }
};

exports.deleteCarousel = async (req, res) => {
  let connection
  try {
    connection=await pool.connect()
    const{cid}=req.body
    const check='select * from home_carousel WHERE c_id=$1'
    const result=await connection.query(check,[cid])
    if (result.rowCount===0) {
      return res.status(404).send({message: 'No Image Found'}) 
    }
    const deleteQuery='delete from home_carousel WHERE c_id=$1'
    await connection.query(deleteQuery,[cid])
return res.status(200).send({message: 'Successfully Deleted'})
  } catch (error) {
    console.error(error)
    return res.status(500).send({message: 'Internal Server Error!'})
  }
  finally{
    if(connection){
      (await connection).release()
    }
  }
}