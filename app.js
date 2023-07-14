const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const helmet = require('helmet')
var hpp = require('hpp')
dotenv.config()

const app = express()

app.use(helmet())
app.disable('x-powered-by')




const coursec = require('./routes/coursesRoutes')
const psauth = require('./routes/psRoutes')
const cat=require('./routes/courseCategoryRoute')
const fAuth=require('./routes/FacultyRoutes')
const contact=require('./routes/ContactRoute')
const enrol=require('./routes/EnrollRoutes')
const announcement=require('./routes/announcement')
const web =require('./webview/webRoutes/webRoutes')
const admin=require('./admin/adminRoutes')
const visit = require('./routes/vcount')
const superadmin = require('./remote/admincreationroutes')
const gallery=require('./routes/albumRoutes')
const depart=require('./routes/departRoutes')
const smsv=require('./routes/smsRoutes')
const tender = require('./routes/tenderRouter')



app.use(cors())

app.use(
  express.json(
    {
      limit: "30mb",
      extended: true,
    }
  )
)

app.use(
  express.urlencoded(
    {
      limit: "30mb",
      extended: true,
    }
  )
)


app.use(hpp())
app.use('/course',coursec)
app.use('/secure',psauth)
app.use('/category',cat)
app.use('/sauth',fAuth)
app.use('/enrollment',enrol)
app.use('/announcement',announcement)
app.use('/viewweb',web)
app.use('/contact',contact)
app.use('/admin',admin)
app.use('/viscount',visit)
app.use('/sadmin',superadmin)
app.use('/gallery',gallery)
app.use('/dep',depart)
app.use('/sms',smsv)
app.use('/tender',tender)

module.exports = app
