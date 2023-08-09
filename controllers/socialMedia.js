const { SipDomainContextImpl } = require("twilio/lib/rest/routes/v2/sipDomain");
const pool = require("../config/pool");
const generateNumericValue = require("../generator/NumericId");





exports.createSocialMedia=async(req,res) =>{
  let connection;
  try {
    const{name,url,color}=req.body;
    connection=await pool.connect();
    if(!name || !url || !color){
      return res.send({message: "Please enter all the data"});

    }
    const checkExistence='SELECT * from social_media WHERE icon_name=$1'
    const result=await connection.query(checkExistence,[name]);
    if(result.rowCount>0){
      return res.status(500).send({message:'Data Already Exist!'})
  }
  let SID='S-'+ generateNumericValue(7)
    const check01='SELECT * FROM social_media WHERE sm_id=$1'
    const result1=await connection.query(check01,[SID])
    
        while(result1.rowCount>0){
                FID='F-'+ generateNumericValue(7)
                result=await connection.query(check01,[FID])
        }

        const check=`INSERT INTO  social_media (sm_id,icon_name,icon_url,icon_color) VALUES($1,$2,$3,$4)`
        const data=[SID,name,url,color]
        const result2=await connection.query(check,data)
        return res.status(201).send({message:'Successfully Created!'})
  } catch (error) {
    console.error(error)
    return res.status(500).send({message:'Internal Server error!'})
  }
}



exports.updateVisiblee = async (req, res) => {
  let connection;
  try {
    const { SID, Svisible } = req.body;
    const updateSocial = "UPDATE social_media SET visibility=$1 WHERE sm_id=$2";
    connection = await pool.connect();

    const uMedia = await connection.query(updateSocial, [Svisible, SID]);

    return res.status(200).send({ message: 'Successfully Updated!' });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Internal Server Error!' });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};


exports.viewSocialMedia = async (req, res) => {
  let connection;
  try {
    const allMedia = "SELECT * from social_media order by icon_name ASC";
    connection = await pool.connect();

    const alMedia = await connection.query(allMedia);

    if (alMedia.rows.length === 0) {
      return res.status(404).send({ message: 'No social media data found.' });
    }

    return res.status(200).send({ data: alMedia.rows });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Internal Server Error!' });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};


exports.viewSocialMediaToWebsite = async (req, res) => {
  let connection;
  try {
    const allMedia = "SELECT * from social_media WHERE visibility=true order by icon_name ASC";
    connection = await pool.connect();

    const alMedia = await connection.query(allMedia);

    if (alMedia.rows.length === 0) {
      return res.status(404).send({ message: 'No visible social media data found.' });
    }

    return res.status(200).send({ data: alMedia.rows });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Internal Server Error!' });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};



exports.updateSocialMedia = async (req, res) => {
  let connection;
  try {
    const { name, url, color, SID } = req.body;
    const updateMedia = "UPDATE social_media SET icon_name=$1, icon_url=$2, icon_color=$3 WHERE sm_id=$4";
    connection = await pool.connect();

    const uMedia = await connection.query(updateMedia, [name, url, color, SID]);


    return res.status(200).send({ message: 'Successfully Updated!' });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Internal Server Error!' });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};



exports.deleteSocialMedia=async(req,res)=>{
  let connection
  try{
      const {Sid}=req.body
      if (!Sid) {
          return res.status(400).send({ message: "Please provide the Media id" });
        }
        connection=await pool.connect()
        const ExistanceMediaId="SELECT * FROM social_media WHERE sm_id=$1"
        const result=await connection.query(ExistanceMediaId,[Sid]);
        if(result.rowCount==0)
        return res.status(404).send({message:"Media id does not exist!"})
        
        
        const delMedia="DELETE FROM social_media WHERE sm_id=$1"
        const dMedia=await connection.query(delMedia,[Sid])
        return res.status(200).send({message: "Successfully Deleted!"})
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
