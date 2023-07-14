const pool = require("../config/pool");
const generateNumericValue = require("../generator/NumericId");

// ===============create ===================
exports.FooterCreate = async (req, res) => {
    let connection;
    try {
      const { name, link, type, phone, email, address } = req.body;
  
      if (!type) {
        return res.status(400).send({ message: "Type is required" });
      }
  
      if (
        type !== "Contact Us" &&
        type !== "Quick Links" &&
        type !== "Important Links"
      ) {
        return res.status(400).send({ message: "Invalid type value" });
      }
  
      connection = await pool.connect();
  
      const checkExxistence =
        "SELECT * FROM footer WHERE phone = $1 AND email = $2 AND address = $3";
      const result2 = await connection.query(checkExxistence, [
        phone,
        email,
        address,
      ]);
  
      if (result2.rowCount > 0) {
        return res.status(500).send({ message: "Data Already Exists!" });
      }
  
      let FID = "F-" + generateNumericValue(7);
  
      const check01 = "SELECT * FROM footer WHERE footer_id = $1";
      let result = await connection.query(check01, [FID]);
  
      while (result.rowCount > 0) {
        FID = "F-" + generateNumericValue(7);
        result = await connection.query(check01, [FID]);
      }
  
      let check;
      let data;
  
      if (type === "Contact Us") {
        check =
          "INSERT INTO footer (phone, email, address, footer_id) VALUES ($1, $2, $3, $4)";
        data = [phone, email, address, FID];
      } else {
        if (!name || !link) {
          return res
            .status(400)
            .send({ message: "Name and link are required" });
        }
  
        check = "INSERT INTO footer (name, link, footer_id) VALUES ($1, $2, $3)";
        data = [name, link, FID];
      }
  
      const result1 = await connection.query(check, data);
  
      return res.status(201).send({ message: "Successfully Created!" });
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: "Internal Server Error!" });
    } finally {
      if (connection) {
        await connection.release();
      }
    }
  };
  

// ==================get all data =================
exports.viewFooter=async(req,res)=>{
    let connection
    try{
    const allFooter="SELECT * from footer ORDER BY type ASC"
    connection=await pool.connect()
    
    
    const alFooter=await connection.query(allFooter)
    if (alFooter.rowCount===0) {
        return res.status(404).send({message:'No Data Found'})
    }
    return res.status(200).send({data:alFooter.rows})
    }
    catch (error) {
        console.error(error)
        return res.status(500).send({message:'Internal Server Eroor!.'})
    }
finally{
    if (connection) {
        await connection.release()
    }
}
}

// ====================Update ============================
exports.updateFooter=async(req,res)=>{
    let connection
    try{
        const {footer_id,name,link,type,phone,email,address}=req.body
        const updateFoot="UPDATE footer SET name=$1,link=$2,type=$3,phone=$4,email=$5,address=$6  WHERE footer_id=$7"
        connection=await pool.connect()
    
    
    const uFooter=await connection.query(updateFoot,[name,link,type,phone,email,address, footer_id])
    return res.status(200).send({message: "Successfully Updated!"})
    }

    catch (error) {
        console.error(error)
        return res.status(500).send({message:'Internal Server Eroor!.'})
    }
finally{
    if (connection) {
        await connection.release()
    }
}
}


exports.updateVisible=async(req,res)=>{
    let connection
    try{
        const {Fid,Fvisible}=req.body
        const updateFoot="UPDATE footer SET visibile=$1 WHERE footer_id=$2"
        connection=await pool.connect()
    
    
    const uFooter=await connection.query(updateFoot,[Fvisible, Fid])
    return res.status(200).send({message: "Successfully Updated!"})
    }

    catch (error) {
        console.error(error)
        return res.status(500).send({message:'Internal Server Eroor!.'})
    }
finally{
    if (connection) {
        await connection.release()
    }
}
}

// ==================Delete========================
exports.deleteFooter=async(req,res)=>{
    let connection
    try{
        const {footer_id}=req.body
        if (!footer_id) {
            return res.status(400).send({ message: "Please provide the footer_id" });
          }
          connection=await pool.connect()
          const ExistanceFooter_id="SELECT * FROM footer WHERE footer_id=$1"
          const result=await connection.query(ExistanceFooter_id,[footer_id]);
          if(result.rowCount==0)
          return res.status(404).send({message:"footer_id does not exist!"})
          
          
          const delFoot="DELETE FROM footer WHERE footer_id=$1"
          const dFooter=await connection.query(delFoot,[footer_id])
          return res.status(200).send({message: "Successfully Deleted!"})
    }

    catch (error) {
        console.error(error)
        return res.status(500).send({message:'Internal Server Eroor!.'})
    }
finally{
    if (connection) {
        await connection.release()
    }
}
}
