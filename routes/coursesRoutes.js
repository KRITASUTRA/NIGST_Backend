const express=require('express')
const { viewCourses, courseCreation, updateCourse, filterCourse, updateCourseStatus, changeCourseStatus, course_scheduling, viewScheduledCourses, sendCourseCodeNo, takeCodeNo, sendBatchAndInfo, courseCalender, viewScheduledCoursesByFaculty} = require('../controllers/courseController')
const router=express.Router()

router.post('/creation',courseCreation)
router.get('/view',viewCourses)
router.get('/filter',filterCourse)
router.post('/scheduler',course_scheduling)
router.get('/view_scheduled',viewScheduledCourses)
router.get('/view_code_no',sendCourseCodeNo)
router.get('/send_course/:code/:no/:type',takeCodeNo)
router.get('/send_batch_info/:courseID',sendBatchAndInfo)
router.get('/calender',courseCalender)
router.get('/view_scheduled_by_faculty/:faculty',viewScheduledCoursesByFaculty)

module.exports=router