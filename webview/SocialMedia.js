const pool = require("../config/pool");
const generateNumericValue = require("../generator/NumericId");


exports.sendSMToAdmin=async(req,res)=>{
    let connection 
    try {

        connection=await pool.connect()

        const check=`SELECT sm_id as sid,icon_name as icon,url as link,visibility,to_char(change_date,'YYYY/MM/DD')`
        const result=await connection.query(check)
        if (result.rowCount===0) {
            return res.status(404).send({message:'Nothing to Display!.'})
        }
        return res.status(200).send({data:result.rows})
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

exports.addURL=async(req,res)=>{

    let connection 
    try {
        const {url,sid}=req.body 
        connection=await pool.connect()
        const check='SELECT * FROM social_media WHERE sm_id=$1'
        const result=await connection.query(check,[sid])
        if (result.rowCount===0) {
            return res.status(404).send({message:'Record Not Exists!.'})
        }
        const addurl='UPDATE social_media SET url=$1 WHERE sm_id=$2'
        await connection.query(addurl,[url,sid])
        return res.status(200).send({message:'URL Added Successfully.'})
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