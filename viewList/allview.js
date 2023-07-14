const pool = require("../config/pool");

exports.viewAllDetailsFaculty = async (req, res) => {
    try {
      const connection = await pool.connect();
      const commandQ =
        'SELECT f.first_name, f.middle_name, f.last_name, f.profile, ' +
        'f.designation, f.education,  array_agg(s.subject_name) AS subjects ' +
        'FROM faculty f LEFT JOIN assigned_subjects s ON f.faculty_id = s.faculty_id ' +
        'GROUP BY f.first_name, f.middle_name, f.last_name, f.profile, f.designation, f.education';
      const results = await connection.query(commandQ);
      if (results.rowCount === 0) {
        res.send({ message: 'Nothing to show' });
      }
      res.send({ faculty: results.rows });
      await connection.release();
    } catch (error) {
      console.error(error);
      res.send({ message: 'Something went Wrong.' });
    }
  };
  