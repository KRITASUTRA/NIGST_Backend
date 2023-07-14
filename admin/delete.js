const pool = require("../config/pool")



exports.deleteSchedulingCourse = async (req, res) => {
  let client;

  try {
    const { status, batch, courseID } = req.params;
    const check = 'SELECT * FROM course_scheduler WHERE course_status=$1 AND batch_no=$2 AND course_id=$3';
    const data = [status, batch, courseID];

    client = await pool.connect();
    const result = await client.query(check, data);

    if (result.rowCount === 0) {
      return res.status(404).send({ message: 'Record Not Exists!' });
    } else {
      if (result.rows[0].course_status === 'running' || result.rows[0].course_status === 'completed') {
        return res.send(result.rows[0].course_status);
      } else {
      return  res.send(result.rows);
      }
    }
  } catch (error) {
    console.error(error);
   return res.status(500).send({ message: 'Internal Server Error!' });
  } finally {
    if (client) {
      await client.release();
    }
  }
};

