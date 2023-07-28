const pool = require("../config/pool");
const generateNumericValue = require("../generator/NumericId");
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');


// ===============create ===================
exports.HeaderCreate = async (req, res) => {
  let connection;
  try {
    const { Hname, url} = req.body;
    const image = req.files.image;
    const Hpath = image[0].location;

    connection = await pool.connect();

    const checkExistence = "SELECT * FROM header WHERE h_name = $1";
    const result = await connection.query(checkExistence, [Hname]);

    if (result.rowCount > 0) {
      return res.status(409).send({ message: "Data Already Exists!" });
    }

    const maxAttempts = 10;
    let attempts = 0;
    let HID;
    let result1; 
    do {
      HID = 'H-' + generateNumericValue(7);
      const check01 = 'SELECT * FROM header WHERE h_id = $1';
      result1 = await connection.query(check01, [HID]); 
      attempts++;
    } while (result1.rowCount > 0 && attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      return res.status(500).send({ message: "Failed to generate a unique HID. Please try again later." });
    }

    const check1 = `INSERT INTO header (h_id,h_name,h_path,url) VALUES($1,$2,$3,$4)`;
    const data = [HID, Hname, Hpath,url];
    const result2 = await connection.query(check1, data);

    return res.status(201).send({ message: 'Successfully Created' });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Internal server error!' });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};




// =============view=======================

exports.viewHeader = async (req, res) => {
  let connection;
  try {
    const allViewHeader = "SELECT h_id, h_name, h_path,url, visibility FROM header";
    connection = await pool.connect();
    const allHeader = await connection.query(allViewHeader);

    if (allHeader.rowCount === 0) {
      return res.status(404).send({ message: 'No image Found' });
    }

    const attachments = allHeader.rows.map(row => row.h_path).filter(Boolean);
    const imageData = [];

    for (const attachment of attachments) {
      const fileUrl = attachment;
      const key = 'header_upload/' + fileUrl.substring(fileUrl.lastIndexOf('/') + 1);

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

        const imgurl = await getSignedUrl(s3Client, command, { expiresIn: 36000 });
        const url = allHeader.rows.find(row => row.h_path === attachment).url;
        const h_id = allHeader.rows.find(row => row.h_path === attachment).h_id;
        const visibility = allHeader.rows.find(row => row.h_path === attachment).visibility;

        imageData.push({
          h_id,
          fileName: key,
          imageurl:imgurl,
          header_url: url,
          h_name: allHeader.rows.find(row => row.h_path === attachment).h_name,
          visibility, 
        });
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



// ===================update============================

exports.updateHeader = async (req, res) => {
  let connection;
  try {
    const { Hname, HID, url} = req.body;
    connection = await pool.connect();
    const check_header= "select * from updateHeader Where h_id=$1"
    const result = await connection.query(check_header,[h_id])
    if (result.rowCount===0) {
      return res.status(404).send({ message: "No Data Found" });
    }
    const updateH = "UPDATE header SET  h_name=$1, url=$2 WHERE h_id=$3";

    const updateHeader = await connection.query(updateH, [Hname, url, HID]);
    return res.status(200).send({ message: "Successfully Updated!" });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Internal server error!" });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};


exports.updateVisibility = async (req, res) => {
  let connection;
  try {
    const { HID, Hvisible } = req.body;
    const updateH = "UPDATE header SET visibility=$1 WHERE h_id=$2";
    connection = await pool.connect();

    const check_visibility = "SELECT COUNT(*) AS visible_count FROM header WHERE visibility = true";
    const result = await connection.query(check_visibility);
    const visibleCount = parseInt(result.rows[0].visible_count);

    if (Hvisible && visibleCount >= 2) {
      return res.status(400).send({ message: "Only two images are allowed to display in the header" });
    }

    const updateHeader = await connection.query(updateH, [Hvisible, HID]);
    return res.status(200).send({ message: "Successfully Updated!" });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Internal server error!" });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};

exports.deleteHeader=async(req,res)=>{
  let connection
  try {
   const{hid}=req.body
    connection=await pool.connect()
   const check_header="select * from header where h_id=$1"
   const result=await connection.query(check_header,[hid]);
   if (result===0) {
    return res.status(404).send({message:"Header not found!"})
   }
   const delete_header='DELETE from header WHERE h_id=$1'
   await connection.query(delete_header,[hid])
   return res.status(200).send({message: "Successfully Deleted!"})
  } catch (error) {
    console.error(error)
    return res.status(500).send({message:'Internal Server Error!'})
  }
  finally{
    if (connection) {
      await connection.release()
    }
  }

}

exports.ViewHeaderWebsite = async (req, res) => {
  let connection;
  try {
    const selectheaderwebsite = "SELECT h_id, h_name, h_path, url FROM header WHERE visibility=true ORDER BY date DESC";
    connection = await pool.connect();
    const allHeader = await connection.query(selectheaderwebsite);

    if (allHeader.rowCount === 0) {
      return res.status(404).send({ message: 'No image Found' });
    }

    const attachments = allHeader.rows.map(row => row.h_path).filter(Boolean);
    const imageData = [];

    for (const attachment of attachments) {
      const fileUrl = attachment;
      const key = 'header_upload/' + fileUrl.substring(fileUrl.lastIndexOf('/') + 1);

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

        const imgurl = await getSignedUrl(s3Client, command, { expiresIn: 36000 });
        const url = allHeader.rows.find(row => row.h_path === attachment).url;
        const h_id = allHeader.rows.find(row => row.h_path === attachment).h_id;
        const visibility = allHeader.rows.find(row => row.h_path === attachment).visibility;

        imageData.push({
          h_id,
          fileName: key,
          imageurl:imgurl,
          header_url: url,
          h_name: allHeader.rows.find(row => row.h_path === attachment).h_name,
          visibility, 
        });
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