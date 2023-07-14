const pool = require("../config/pool")
const { S3Client, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3")
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { generate } = require("generate-password");
const { v4: uuidv4 } = require('uuid');
const generateNumericValue = require("../generator/NumericId");

exports.createAlbum = async (req, res) => {
  let connection;

  try {
    const { Cname } = req.body;
    const images = req.files.image;

    connection = await pool.connect();

    const countQuery = 'SELECT COUNT(*) FROM album WHERE category_name = $1';
    const countResult = await connection.query(countQuery, [Cname]);
    const imageCount = parseInt(countResult.rows[0].count);

    if (imageCount + images.length > 100) {
      return res.status(400).send('Maximum limit of 100 images per album reached.');
    }

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const randomName = uuidv4();
      const Aname = `${randomName}.${image.mimetype.split('/')[1]}`;
      const Apath = image.location;

      const check = 'SELECT * FROM album WHERE a_id = $1';
      let aid = 'A-' + generateNumericValue(8);
      let result = await connection.query(check, [aid]);

      while (result.rowCount > 0) {
        aid = 'A-' + generateNumericValue(8);
        result = await connection.query(check, [aid]);
      }

      const query = 'INSERT INTO album (category_name, name, path, a_id) VALUES ($1, $2, $3, $4)';
      const values = [Cname, Aname, Apath, aid];
      await connection.query(query, values);
    }

    return res.status(201).send({ message: 'Images uploaded successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: 'Error uploading images.' });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};



// =====================view==========================

exports.viewAlbum = async (req, res) => {
  try {
    const AllAlbumView =
      'SELECT name, path, album.category_name FROM album INNER JOIN album_category ON album.category_name=album_category.category_name WHERE album_category.visibility=true ORDER BY category_name ASC';

    const connection = await pool.connect();
    const allAlbum = await connection.query(AllAlbumView);

    if (allAlbum.rowCount === 0) {
      await connection.release();
      return res.status(404).send({ message: 'No image Found' });
    }

    const attachments = allAlbum.rows.map((row) => row.path).filter(Boolean);
    const imageData = await Promise.all(
      allAlbum.rows.map(async (row) => {
        const attachment = row.path;
        const fileUrl = attachment;
        const key = 'gallery/' + fileUrl.substring(fileUrl.lastIndexOf('/') + 1);

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

          const url = await getSignedUrl(s3Client, command, { expiresIn: 36000 });

          return {
            image: url,
            category: row.category_name,
            name: row.name,
          };
        } catch (error) {
          console.error(`Error retrieving file '${key}': ${error}`);
          return null;
        }
      })
    );

    await connection.release();

    const validImageData = imageData.filter((image) => image !== null);

    if (validImageData.length === 0) {
      return res.status(404).send({ error: 'Image not found.' });
    }

    return res.status(200).send({ data: validImageData });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: 'Internal server error!' });
  }
};




exports.viewAlbumByCategory = async (req, res) => {
  try {
    const { category } = req.body;
    const check = 'SELECT * FROM album WHERE category_name=$1';
    const client = await pool.connect();
    const result = await client.query(check, [category]);

    if (result.rowCount === 0) {
      await client.release();
      return res.status(404).json({ message: 'No Images Found!' });
    }

    const images = await Promise.all(
      result.rows.map(async (row) => {
        const attachment = row.path;
        const fileUrl = attachment;
        const key = 'gallery/' + fileUrl.substring(fileUrl.lastIndexOf('/') + 1);

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

          const url = await getSignedUrl(s3Client, command, { expiresIn: 36000 });

          return {
            fileName: url,
            aid: row.a_id,
          };
        } catch (error) {
          console.error(`Error retrieving file '${key}': ${error}`);
          return null;
        }
      })
    );

    await client.release();

    const validImages = images.filter((image) => image !== null);

    return res.status(200).send({ images: validImages });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Internal Server Error!' });
  }
};



exports.deleteAlbum = async (req, res) => {
 
  let client

  try {
 
    const { aid } = req.body

    if (!aid) {

      return res.status(400).json({ message: 'Missing album ID (aid).' })

    }

    client = await pool.connect()

    const selectQuery = 'SELECT * FROM album WHERE a_id = $1'

    const selectResult = await client.query(selectQuery, [aid])

    if (selectResult.rowCount === 0) {
    
      return res.status(404).json({ message: 'Album not found.' })
    
    }

    const deleteQuery = 'DELETE FROM album WHERE a_id = $1'

    await client.query(deleteQuery, [aid])

    const attachment = selectResult.rows[0].path

    const fileUrl = attachment
    
    const key = 'gallery/' + fileUrl.substring(fileUrl.lastIndexOf('/') + 1)

    const s3Client = new S3Client({
      region: process.env.BUCKET_REGION,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
      },
    })

    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
    })

    await s3Client.send(deleteCommand)

    return res.status(200).json({ message: 'Image deleted successfully.' })

  } 
  catch (error) {
  
    console.error(error)
  
    return res.status(500).json({ message: 'Internal Server Error.' })
  
  } 
  finally {
  
    if (client) {
  
      client.release()
  
    }
  }
}
