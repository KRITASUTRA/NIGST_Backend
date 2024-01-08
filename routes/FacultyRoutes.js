const express =require('express')
const { updateFacultyDetails } = require('../admin/edit')
const { facultyCreation, facultyPassForgot, facultyLogin, fPassReset, fChangePassword, facultyPosition, positionSend, officerFaculty, facultyPositionAssi, viewAllFacultyPositions, viewFaculty, reportSubmission, displayReport, filterReportsByFaculty, sendIDForReport, viewFacultyPositionAssi, facultyPositionReAssign, filterReportsByOfficer } = require('../controllers/facultyAuth')
const { uploadFacultyPhoto, reportSubmit } = require('../middleware/faculty')
const {  IPlimiter, checkBlockedIP, LimitUpload } = require('../middleware/limiter')
const router= express.Router()

router.post('/create',facultyCreation)
router.post('/forget',facultyPassForgot)
router.post('/login',checkBlockedIP,IPlimiter,facultyLogin)
router.patch('/reset', fPassReset)
router.patch('/change',fChangePassword)
// router.patch('/update',uploadFacultyPhoto,updateFacultyDetails)
router.post('/position',facultyPosition)
router.get('/send',positionSend)
router.get('/officer/:profile',officerFaculty)
router.post('/possition_assi',facultyPositionAssi)
router.patch('/update_position',facultyPositionReAssign)
router.get('/view',viewAllFacultyPositions)
router.get('/faculty_view',viewFaculty)
router.post('/report/submit',LimitUpload,reportSubmit,reportSubmission)
router.get('/report/view/:scheduleId',displayReport)
router.get('/view_by_faculty/:faculty',filterReportsByFaculty)
router.get('/view_by_officer/:facultyId',filterReportsByOfficer)
router.get('/send_course/:faculty',sendIDForReport)
router.get('/faculty_position/:faculty',viewFacultyPositionAssi)
module.exports=router