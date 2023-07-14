const express= require('express')
const { sendsms, sendOTP, verifyOTP, resendOTP } = require('../controllers/smsVerf')


const router=express.Router()

router.post('/ss',sendsms)
router.post('/so',sendOTP)
router.patch('/resend',resendOTP)
router.post('/vs',verifyOTP)


module.exports=router