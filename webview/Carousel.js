const pool = require("../config/pool")
const generateNumericValue = require("../generator/NumericId")
const { v4: uuidv4 } = require('uuid');


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
        const check='SELECT c_id,'
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