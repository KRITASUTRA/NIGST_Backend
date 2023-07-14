const express= require('express')
const { Enrol, GetEnrolledCourses, CancelEnrollment, reEnroll, viewEnrollmentOfStudent, viewCanceledEnrollmentOfStudent, viewCoursesForEnrollment } = require('../controllers/Enrollment')
const router =express.Router()

router.post('/enrol',Enrol)
router.get('/view_enroll/:studentId',GetEnrolledCourses)
router.patch('/cancel/:enrollmentId',CancelEnrollment)
router.put('/renroll/:enrollmentID',reEnroll)
router.get('/view_enrol/:studentID',viewEnrollmentOfStudent)
router.get('/view_cancel/:studentID',viewCanceledEnrollmentOfStudent)
router.post('/view_courses/',viewCoursesForEnrollment)

module.exports=router