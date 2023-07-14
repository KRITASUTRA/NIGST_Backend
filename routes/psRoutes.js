const express= require('express')
const { signUp, login, ForgotPassword, passwordReset, verifyEmail, sendVeriMailAgain, viewUsers, adminVerify, viewVeriStatus} = require('../controllers/psAuth')
const router=express.Router()

router.post('/signup', signUp)
router.post('/login', login)
router.post('/forget',ForgotPassword)
router.patch('/reset',passwordReset)
router.get('/:token',verifyEmail)
router.patch('/resend',sendVeriMailAgain)

router.patch('/verify',adminVerify)
router.get('/view_veri_status/:email',viewVeriStatus)
module.exports=router