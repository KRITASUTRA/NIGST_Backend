const express= require('express')
const { adminCreation, adminLogin } = require('./admincreation')
const router = express.Router()

router.post('/create',adminCreation)
router.post('/login',adminLogin)
// router.get('/filter',adminFilter)

module.exports=router