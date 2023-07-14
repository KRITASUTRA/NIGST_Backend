const jwt = require('jsonwebtoken');
const secret = 'your_secret_key';

function authorize(req, res, next) 
{
  const authHeader = req.headers.authorization;
  if (!authHeader) 
  {
    return res.status(401).send({ message: 'Unauthorized access' });
  }

  const token = authHeader.split(' ')[1];

  try 
    {
      const decoded = jwt.verify(token, secret);

      if (decoded.role !== 'admin') 
      {
        return res.status(403).send({ message: 'Forbidden access' });
      }

      next();
    } 
  catch (error) 
    {
      console.error(error);
      return res.status(401).send({ message: 'Unauthorized access' });
    }
}
