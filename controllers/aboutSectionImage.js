const pool = require("../config/pool")
const { S3Client, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3")
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { generate } = require("generate-password");
const { v4: uuidv4 } = require('uuid');
const generateNumericValue = require("../generator/NumericId");


//====================================create====================================

exports.createAboutImage = async (req, res) => {
    let connection;
    try {
        const uploadedImages = req.files.image; // Renamed variable
        connection = await pool.connect();
        const countQuery = "SELECT count(*) FROM about_section_image";
        const countResult = await connection.query(countQuery);
        const imageCount = parseInt(countResult.rows[0].count);

        if (imageCount+uploadedImages.length > 5) {
            return res.status(400).send('Maximum limit reached (5 images allowed).');
        }

        for (let i = 0; i < uploadedImages.length; i++) { // Renamed variable
            const uploadedImage = uploadedImages[i]; // Renamed variable
            const path = uploadedImage.location;

            const check = 'SELECT * from about_section_image where a_id = $1';
            let AID = 'A-' + generateNumericValue(8);
            let result = await connection.query(check, [AID]);

            while (result.rowCount > 0) {
                AID = 'A-' + generateNumericValue(8);
                result = await connection.query(check, [AID]);
            }

            const query = 'INSERT INTO about_section_image (path, a_id) values ($1, $2)';
            await connection.query(query, [path, AID]);
        }
        return res.status(201).send({ message: 'Image upload Successful!' });

    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: 'Internal server error!' });
    } finally {
        await connection.release();
    }
}


//===========================view=======================================

exports.viewImages=async(req,res)=>
{
    try{
        let limit=3;
    const allView='SELECT * from about_section_image limit=$1';
    const connection=await pool.connect();
    const allImage=await connection.query(allView,[limit]);
    if (allImage.rowCount === 0) {
        await connection.release();
        return res.status(404).send({ message: 'No image Found' });
      }

    const images = imagesResult.rows; // Assuming each row contains image data

    await connection.release();

    res.status(200).json(images); // Send the first three images as a JSON response
} catch (error) {
    console.error(error);
    return res.status(500).send({ error: 'Internal server error' });
}
}

