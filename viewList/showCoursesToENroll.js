const pool = require("../config/pool");

exports.showCoursesForEnroll= async(req,res)=>{
    try {
        const connection=await pool.connect()
        const check= 'SELECT course_category,name,course_code FROM COURSES WHERE course_status=$1'
        const status='active'
        const results=await connection.query(check,[status])
        if (results.rowCount===0) {
           return res.send({message:'No Course Active Now.'})
        }
        res.send({courses:results.rows})
        await connection.release()
    } catch (error) {
        res.send({message:'Something went wrong!.'})
    }
}