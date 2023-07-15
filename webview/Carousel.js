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


exports.viewCarouselToAdmin=async(req,res)=>{
    let connection
    try {
        connection=await pool.connect()
        const check=`SELECT c_id,c_status,path,to_char(upload_date,'YYYY/MM/DD') as uploaddate FROM home_carousel`
        const result=await connection.query(check)
        if (result.rowCount===0) {
            return res.status(404).send({message:"No Data Found"})
        }
        let images=[]
        for (const row of result.rows) {
            const url=row.path
            const Key='home_carousel'+url.substring(url.lastIndexOf('/')+1)
            const clint=new S3Client({
                region:process.env.BUCKET_REGION,
                credentials:{
                    accessKeyId:process.env.ACCESS_KEY,
                    secretAccessKey:process.env.SECRET_ACCESS_KEY,

                }
            })
            const commandCenter=new GetObjectCommand({
                Bucket:process.env.BUCKET_NAME,
                Key:Key
            })
            const imageurl=await getSignedUrl(clint,commandCenter,{expiresIn:3600})
            const imagedata={
                imageurl,
                CId: row.c_Id,
                cstatus:row.c_status,
                uploaddate:row.uploaddate
            }
            images.push(imagedata)
        }
        return res.status(200).send({images})
    } catch (error)  {
        console.error(error)
        return res.status(500).send({message:'Internal Server Error!.'})
    }
    finally{
        if (connection) {
            await connection.release()
        }
    }
}