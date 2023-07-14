const nodemailer= require('nodemailer')
const transporter = nodemailer.createTransport
  (
    {
      host: process.env.host,
      port: Number(process.env.mailPort),
      secure: Boolean(process.env.secure),
      auth: 
        {
          user: process.env.adminMail,
          pass: process.env.adminPass,
        },
    }
  );

module.exports=transporter;
  
const sendMail = (to, subject, html) => 
  {
    const mailOptions = 
      {
        from: process.env.from,
        to,
        subject,
        html,
      };
    return transporter.sendMail(mailOptions);
  }

module.exports = sendMail;