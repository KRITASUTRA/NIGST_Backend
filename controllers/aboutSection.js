// const pool = require("../config/pool");
// const generateNumericValue = require("../generator/NumericId");
// exports.createSection = async (req, res) => {
//     let connection;
//     try {
//         const{name,description}=req.body;
//         const image= req.files.image;
//         const path = image[0].location;
//         connection=await pool.connect();

//     const checkExistence = 'SELECT * FROM about_section WHERE a_name = $1';
//     const countResult = await connection.query(checkExistence, [name]);
//     const imageCount = parseInt(countResult.rows[0].count);

//     if (imageCount + images.length > 2) {
//       return res.status(400).send('Maximum limit of 1 image.');
//     }


//       const check = 'SELECT * FROM about_section WHERE a_id = $1';
//       let aid = 'A-' + generateNumericValue(8);
//       let result = await connection.query(check, [aid]);

//       while (result.rowCount > 0) {
//         aid = 'A-' + generateNumericValue(8);
//         result = await connection.query(check, [aid]);
//       }

//       const query = 'INSERT INTO about_section (a_id,a_name,path,a_description) VALUES ($1, $2, $3, $4)';
//       const values = [aid, name, path, description];
//       await connection.query(query, values);
    

//     return res.status(201).send({ message: 'Created successfully' });
//     } catch (error) {
//         console.error(error);
//     return res.status(400).send({ message: 'Error creating about section!' });
//     }
//     finally {
//         if (connection) {
//           await connection.release();
//         }
//     }
// };

const pool = require("../config/pool");
const generateNumericValue = require("../generator/NumericId");

exports.createSection = async (req, res) => {
    let connection;
    try {
        const { name, description } = req.body;
        const file=req.files.image;
        console.log(file);
        if (!req.files || !req.files.image) {
            return res.status(400).send({ message: 'Image file is missing.' });
        }
        const image = req.files.image;
        const path = image[0].location;
        
        
        connection = await pool.connect();

        const checkExistence = 'SELECT COUNT(*) as count FROM about_section WHERE a_name = $1';
        const countResult = await connection.query(checkExistence, [name]);
        const imageCount = parseInt(countResult.rows[0].count);

        if (imageCount  > 2) {
            return res.status(400).send('Maximum limit of 2 images.');
        }

        let aid = 'A-' + generateNumericValue(8);
        const check = 'SELECT * FROM about_section WHERE a_id = $1';

        // Generate a unique aid
        while (true) {
            const result = await connection.query(check, [aid]);
            if (result.rowCount === 0) {
                break;
            }
            aid = 'A-' + generateNumericValue(8);
        }

        const query = 'INSERT INTO about_section (a_id, a_name, path, a_description) VALUES ($1, $2, $3, $4)';
        const values = [aid, name, path, description];
        await connection.query(query, values);

        return res.status(201).send({ message: 'Created successfully' });
    } catch (error) {
        console.error(error);
        return res.status(400).send({ message: 'Error creating about section!' });
    } finally {
        if (connection) {
            await connection.release();
        }
    }
};