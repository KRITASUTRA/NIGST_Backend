const express= require('express')
const { adminCreation, adminLogin } = require('./admincreation')
const { checkBlockedIP,  IPlimiter } = require('../middleware/limiter')
const router = express.Router()
// router.use(limiter)
router.post('/create',adminCreation)
router.post('/login',IPlimiter,adminLogin)
// router.get('/filter',adminFilter)

module.exports=router