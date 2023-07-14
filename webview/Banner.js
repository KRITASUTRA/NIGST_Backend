const pool = require("../config/pool");
const generateNumericValue = require("../generator/NumericId");
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');


exports.createBanner=async(req,res)=>{

    let connection

    try {

        const {alt,url}=req.body 

        const file=req.files.image

        const name=file[0].originalname

        const path=file[0].location

        connection=await pool.connect()


    let BID='B-'+generateNumericValue(5)

    const check01='SELECT * FROM banner WHERE banner_id=$1'

    let result=await connection.query(check01,[BID])
    
    while (result.rowCount>0) {

        BID='B-'+generateNumericValue(5)

        result=await connection.query(check01,[BID])

    }
        const check=`INSERT INTO banner (name,alt,banner_path,url,banner_id) VALUES($1,$2,$3,$4,$5)`

        const data=[name,alt,path,url,BID]
      
        await connection.query(check,data)

return res.send({message:'Successfully created!.'})

    } 
    catch (error) {

        console.error(error)

        return res.status(500).send({message:'Internal Server Error!.'})

    }
    finally{

        if (connection) {

            await connection.release()
            
        }
    }
}


exports.editBanner=async(req,res)=>{

    let client

    try {
        
client=await pool.connect()

const {bid,alt,url}=req.body

const image=req.files.image 

const name=image[0].originalname

const path=image[0].key 


const check='SELECT * FROM banner WHERE banner_id=$1'

const result= await client.query(check,bid)

if (result.rowCount===0) {

    return res.status(404).send({message:'Banner not Found!.'})

}
 
const date= new Date()

const data=[name,alt,url,path,date]

const updateQ='UPDATE banner SET name=$1,alt=$2,url=$3,path=$4,date=$5 WHERE banner_id=$6'

await client.query(updateQ,data)

return res.status(200).send({message:'Successfully Updated!.'})


    } catch (error) {
        
        console.log(error)

        return res.status(500).json({message:'Internal Server Error!.'})
    }
    finally{
        
        if (client) {
            
            await client.release()

        }
    }
}





exports.getBanner = async (req, res) => {
  let connection;

  try {
    connection = await pool.connect();

    const check = 'SELECT alt,banner_path,url FROM banner ORDER BY date DESC LIMIT 2';
    const result = await connection.query(check);

    if (result.rowCount === 0) {
      return res.status(404).send({ message: 'Banner not found!' });
    }

    const banners = [];
    for (const row of result.rows) {
      const fileUrl = row.banner_path;
      const key = 'banner/' + fileUrl.substring(fileUrl.lastIndexOf('/') + 1);

      // Generate a signed URL for the S3 object
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

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 36000 });

      const bannerData = {
        signedUrl,
        url: row.url,
        alt: row.alt,
      };
      banners.push(bannerData);
    }

    return res.json({ banners });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Internal Server Error!' });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};

