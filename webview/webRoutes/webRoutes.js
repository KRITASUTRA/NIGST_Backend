const express = require('express')
const { viewAllDetailsFaculty } = require('../../viewList/allview')
const { viewWebAnnouncement, viewAllWebAnnouncement, viewPDFAnnouncement, viewAllPDFs, viewArchiveToWebsite, viewArchivePDFAnnouncement } = require('../announcement')
const { createBanner, getBanner } = require('../Banner')
const { bannerUpload, galleryUpload, SOI_PROJECT_UPLOAD, headerUpload, homeCarousel, campus_upload, aboutSection, sportsFacility, nigstHostel, nigstHostell, boardGovernancee, boardOfEvaluation } = require('../../middleware/faculty')

const { FooterCreate, viewFooter, updateFooter, deleteFooter, updateVisible, contactUSFooter, viewFooterWebsite } = require('../footer')
const { createAlbumCategory, viewAlbumCategory, updateAlbumCategory, deleteAlbumCategory } = require('../../controllers/GalleryCategory')
const { createAlbum, viewAlbum } = require('../../controllers/album')
const { createProject, viewProject, updateSoiProject, deleteProject, viewProjectForWeb } = require('../../controllers/soi_project')
const { HeaderCreate, viewHeader, updateVisibility, updateHeader, deleteHeader, ViewHeaderWebsite } = require('../header')
const { CreateMarquee, viewMarqueeToAdmin, editMarqueeDetails, editMarqueeVisibility, viewMarqueeForWeb, deleteMarque } = require('../Marquee')
const { CreateCarousel, viewCarouselToAdmin, visibilityedit, viewCarouselToWeb, deleteCarousel } = require('../Carousel')
const { createSocialMedia, updateVisiblee, viewSocialMedia, updateSocialMedia, deleteSocialMedia, viewMediaForWeb } = require('../../controllers/socialMedia')
const { createSection, viewAboutSection, viewWebAboutSection, deleteAboutSection, updateAboutSection } = require('../../controllers/aboutSection')
const { createCampus, viewCampus, updateCampus, deleteCampus, viewWebCampus, updateVisibilityCampus } = require('../../controllers/campus')
const { createSportsFacility, viewSportsFacility, viewWebSportsFacility, updateSportsFacility, deleteSportsFacility, updateVisibleSportsFacility } = require('../../controllers/sportsFacility')
const { createNigstHostel, viewNigstHostel, viewWebNigstHostel, updateNigstHostel, deleteNigstHostel, updateVisibleHostel } = require('../../controllers/hostel')
const { createGovernance, viewGovernance, viewWebGovernance, updateGovernance, deleteGovernance, updateVisibleGovernance } = require('../../controllers/boardOfGovernance')
const { createEvaluation } = require('../../controllers/boardOfEvaluation')

const router = express.Router()

router.get('/webannouncement', viewWebAnnouncement)
router.get('/facultynsub', viewAllDetailsFaculty)
router.get('/view_ann_all', viewAllWebAnnouncement)
router.get('/view_ann/:aid', viewPDFAnnouncement)
router.get('/view', viewAllPDFs)
router.get('/view_archive', viewArchiveToWebsite)
router.get('/view_archive/:aid', viewArchivePDFAnnouncement)


router.post('/create_banner', bannerUpload, createBanner)
router.get('/view_banner', getBanner)



router.delete('/delete_album_category',deleteAlbumCategory)
router.post('/create_album_category', createAlbumCategory)
router.get('/view_album_category', viewAlbumCategory)
router.patch('/update_album_category', updateAlbumCategory)
router.post('/create_album', galleryUpload, createAlbum)
router.get('/view_album', viewAlbum)


router.post('/create_project', SOI_PROJECT_UPLOAD, createProject)
router.get('/view_project', viewProject)
router.get('/web_project',viewProjectForWeb)
router.patch('/update_project', updateSoiProject)
router.delete('/delete_project', deleteProject)


router.post('/create_header', headerUpload, HeaderCreate)
router.get('/view_header', viewHeader)
router.patch('/update_header',updateHeader)
router.patch('/update_visible_header',updateVisibility)
router.delete('/delete_header',deleteHeader)
router.get('/web_header',ViewHeaderWebsite)

router.post('/footer_create', FooterCreate)
router.get('/footer_view', viewFooter)
router.patch('/footer_update', updateFooter)
router.patch('/update_visible_footer',updateVisible)
router.delete('/footer_delete', deleteFooter)
router.get('/contact_footer',contactUSFooter)
router.get('/footer_web',viewFooterWebsite)


router.post('/create_marquee',CreateMarquee)
router.get('/view_amarquee',viewMarqueeToAdmin)
router.patch('/edit_marquee',editMarqueeDetails)
router.patch('/edit_mvisiblity',editMarqueeVisibility)
router.get('/marquee_view',viewMarqueeForWeb)
router.delete('/delete_marquee',deleteMarque)


router.post('/upload_carousel',homeCarousel,CreateCarousel)
router.get('/carousel_admin',viewCarouselToAdmin)
router.patch('/carousel_visibility',visibilityedit)
router.get('/view_carousel', viewCarouselToWeb)
router.delete('/delete_carousel', deleteCarousel)

router.post('/social_media_create',createSocialMedia)
router.patch('/update_visible_media',updateVisiblee)
router.get('/view_social_media',viewSocialMedia)
router.patch('/update_social_media',updateSocialMedia)
router.delete('/delete_social_media',deleteSocialMedia)
router.get('/web_view_media',viewMediaForWeb)

router.post('/create_about_section',aboutSection,createSection)
router.get('/view_about_section',viewAboutSection)
router.get('/view_web_abou_section',viewWebAboutSection)
router.patch('/update_about_section',viewWebAboutSection)
router.delete('/delete_about_section',deleteAboutSection)

router.post('/create_campus',campus_upload,createCampus)
router.get('/view_campus',viewCampus)
router.patch('/update_campus',campus_upload,updateCampus)
router.delete('/delete_campus',deleteCampus)
router.get('/view_web_campus',viewWebCampus)
router.patch('/update_visibility_campus',updateVisibilityCampus)

router.post('/create_sports_facility',sportsFacility,createSportsFacility);
router.get('/view_sports_facility',viewSportsFacility);
router.get('/view_web_sports_facility',viewWebSportsFacility);
router.patch('/update_sports_facility',sportsFacility,updateSportsFacility);
router.delete('/delete_sports_facility',deleteSportsFacility);
router.patch('/update_visibility_facility',updateVisibleSportsFacility);

router.post('/create_nigst_hostel',nigstHostell,createNigstHostel);
router.get('/view_nigst_hostel',viewNigstHostel);
router.get('/view_web_nigst_hostel',viewWebNigstHostel);
router.patch('/update_nigst_hostel',nigstHostell,updateNigstHostel);
router.delete('/delete_nigst_hostel',deleteNigstHostel);
router.patch('/update_visibility_hostel',updateVisibleHostel)

router.post('/create_governance',boardGovernancee,createGovernance)
router.get('/view_governance',viewGovernance)
router.get('/view_web_governance',viewWebGovernance)
router.patch('/update_governance',boardGovernancee,updateGovernance)
router.delete('/delete_governance',deleteGovernance)
router.patch('/update_visible_governance',updateVisibleGovernance)

router.post('/create_board_of_evaluation',boardOfEvaluation,createEvaluation)
module.exports = router

