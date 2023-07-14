const express= require('express')
const {  courseCategoryCreation, viewCategoryList, addCodeToCategory, addNumberToCategory, getCodeByCategory, getNumberByCategory } = require('../controllers/CategoryCreation')
const router= express.Router()


router.post('/create',courseCategoryCreation)
router.get('/view_category',viewCategoryList)
router.post('/add_code',addCodeToCategory)
router.post('/add_no',addNumberToCategory)
router.patch('/get_code',getCodeByCategory)
router.patch('/get_no',getNumberByCategory)



module.exports=router