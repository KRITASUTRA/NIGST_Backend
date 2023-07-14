const express= require('express')
const {  organizationCourseAssi, otherCategory, courseAssi, idAssi, departAssi, viewOrganizations, viewAllOrganizations, viewdepartAssi, departments, removeOrganizationCourse } = require('../controllers/organization')
const router =express.Router()

router.get('/view',viewAllOrganizations)
router.get('/v',viewOrganizations)
router.post('/organization_assign',organizationCourseAssi)
router.get('/othercategory',otherCategory)
router.get('/orgname',courseAssi)
router.get('/idassi',idAssi)
router.post('/departassi',departAssi)
router.get('/viewda',viewdepartAssi)
router.post('/d',departments)
router.delete('/deassign',removeOrganizationCourse)

module.exports=router