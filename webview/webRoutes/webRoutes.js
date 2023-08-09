const express = require('express')
const { viewAllDetailsFaculty } = require('../../viewList/allview')
const { viewWebAnnouncement, viewAllWebAnnouncement, viewPDFAnnouncement, viewAllPDFs, viewArchiveToWebsite, viewArchivePDFAnnouncement } = require('../announcement')
const { createBanner, getBanner } = require('../Banner')
const { bannerUpload, galleryUpload, SOI_PROJECT_UPLOAD, headerUpload, homeCarousel } = require('../../middleware/faculty')

const { FooterCreate, viewFooter, updateFooter, deleteFooter, updateVisible, contactUSFooter, viewFooterWebsite } = require('../footer')
const { createAlbumCategory, viewAlbumCategory, updateAlbumCategory, deleteAlbumCategory } = require('../../controllers/GalleryCategory')
const { createAlbum, viewAlbum } = require('../../controllers/album')
const { createProject, viewProject, updateSoiProject, deleteProject, viewProjectForWeb } = require('../../controllers/soi_project')
const { HeaderCreate, viewHeader, updateVisibility, updateHeader, deleteHeader, ViewHeaderWebsite } = require('../header')
const { CreateMarquee, viewMarqueeToAdmin, editMarqueeDetails, editMarqueeVisibility, viewMarqueeForWeb, deleteMarque } = require('../Marquee')
const { CreateCarousel, viewCarouselToAdmin, visibilityedit, viewCarouselToWeb, deleteCarousel } = require('../Carousel')
const { createSocialMedia, updateVisiblee, viewSocialMedia, updateSocialMedia, deleteSocialMedia, viewMediaForWeb } = require('../../controllers/socialMedia')

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
router.patch('/web_view_media',viewMediaForWeb)

module.exports = router

