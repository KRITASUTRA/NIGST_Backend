const express= require('express')
const { limiter, visitorCounter } = require('../controllers/visitorCount')

const router=express.Router()

router.get('/',limiter,visitorCounter)

module.exports=router