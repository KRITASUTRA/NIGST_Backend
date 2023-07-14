// const multer = require('multer');
// const path = require('path');
// const fs=require('fs')




// function createUploadMiddleware(destination) {
//   if (!fs.existsSync(destination)) {
//     fs.mkdirSync(destination, { recursive: true });
//   }

//   const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, destination);
//     },
//     filename: function (req, file, cb) {
//       cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
//     },
//   });

//   function checkFileType(file, cb) {
//     const filetypes = /jpeg|jpg|png|gif|mp4|mov|pdf|files/;
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
//     const mimetype = filetypes.test(file.mimetype);
  
//     if (mimetype && extname) {
//       return cb(null, true);
//     } else {
//       return cb('Error: Images, Videos, and PDFs Only!');
//     }
//   }
  

//   return function (req, res, next) {
//     const uploadType = req.query.uploadType || 'single'; 
//     const uploadMethod = uploadType === 'single' ? 'single' : 'array';
//     const upload = multer({
//       storage: storage,
//       limits: { fileSize: 1024 * 1024 * 500 }, 
//       fileFilter: function (req, file, cb) {
//         checkFileType(file, cb);
//       },
//     }).fields([{ name: 'photo', maxCount: 1 }, { name: 'video', maxCount: 1 },{ name: 'pdf', maxCount: 1 },{name:'file',maxCount:1}]);

//     upload(req, res, function (err) {
//       if (err instanceof multer.MulterError) {
//         return res.status(500).json({ message: 'Multer Error: ' + err.message });
//       } else if (err) {
//         return res.status(500).json({ message: 'Error: ' + err });
//       }
//       next();
//     });
//   };
// }


// // const uploadFacultyPhoto = createUploadMiddleware('./faculty/');
// const uploadFacultyPhoto = createUploadMiddleware('./Images/faculty/');
// const uploadStudentPhoto = createUploadMiddleware('./student/');
// const uploadAnnouncement = createUploadMiddleware('./announcement/');
// const galleryUpload= createUploadMiddleware('./Images/gallery/')
// const videoUpload=createUploadMiddleware('./Videos/')
// const pdfUpload=createUploadMiddleware('./pdf/')
// const tenderpdf=createUploadMiddleware('./tender/')
// const corrigendum=createUploadMiddleware('./tender/corrigendum/')

// const multer = require('multer');
// const multerS3 = require('multer-s3');
// const aws = require('aws-sdk');
// const path = require('path');

// // Configure the AWS SDK with your access keys and region
// aws.config.update({
//   accessKeyId: process.env.ACCESS_KEY,
//   secretAccessKey: process.env.SECRET_ACCESS_KEY,
//   region: process.env.BUCKET_REGION
// });

// // Create an S3 client
// const s3 = new aws.S3();

// function createUploadMiddleware(destination) {
//   // We no longer need to create a local directory using fs module

//   const storage = multerS3({
//     s3: s3,
//     bucket:process.env.BUCKET_NAME,
//     key: function (req, file, cb) {
//       const extname = path.extname(file.originalname);
//       const filename = file.fieldname + '-' + Date.now() + extname;
//       const fullPath = `${destination}/${filename}`;
//       cb(null, fullPath);
//     }
//   });

//   function checkFileType(file, cb) {
//     const filetypes = /jpeg|jpg|png|gif|mp4|mov|pdf|files/;
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
//     const mimetype = filetypes.test(file.mimetype);
  
//     if (mimetype && extname) {
//       return cb(null, true);
//     } else {
//       return cb('Error: Images, Videos, and PDFs Only!');
//     }
//   }
  

//   return function (req, res, next) {
//     const uploadType = req.query.uploadType || 'single'; 
//     const uploadMethod = uploadType === 'single' ? 'single' : 'array';
//     const upload = multer({
//       storage: storage,
//       limits: { fileSize: 1024 * 1024 * 500 }, 
//       fileFilter: function (req, file, cb) {
//         checkFileType(file, cb);
//       },
//     }).fields([{ name: 'photo', maxCount: 1 }, { name: 'video', maxCount: 1 },{ name: 'pdf', maxCount: 1 },{name:'file',maxCount:1}]);

//     upload(req, res, function (err) {
//       if (err instanceof multer.MulterError) {
//         return res.status(500).json({ message: 'Multer Error: ' + err.message });
//       } else if (err) {
//         return res.status(500).json({ message: 'Error: ' + err });
//       }
//       next();
//     });
//   };
// }

// // Update the destination paths to the appropriate S3 bucket paths
// const uploadFacultyPhoto = createUploadMiddleware('faculty');
// const uploadStudentPhoto = createUploadMiddleware('student');
// const uploadAnnouncement = createUploadMiddleware('announcement');
// const galleryUpload= createUploadMiddleware('gallery')
// const videoUpload=createUploadMiddleware('videos')
// const pdfUpload=createUploadMiddleware('pdf')
// const tenderpdf=createUploadMiddleware('tender')
// const corrigendum=createUploadMiddleware('tender/corrigendum')


const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

// AWS S3 configuration
const s3 = new S3Client({
  region:  process.env.BUCKET_REGION,
  credentials: {
    accessKeyId:  process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  }
});
const s3BucketName = process.env.BUCKET_NAME;

// Middleware to upload files to S3
const s3Storage = multerS3({
  s3,
  bucket: s3BucketName,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: function (req, file, cb) {
    const { destination } = req;
    const filetypes = /jpeg|jpg|png|gif|mp4|mov|pdf|files/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      // Include destination directory in S3 object key
      const key = `${destination}/${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`;

      // Replace %2F with /
      const correctedKey = key.replace(/%2F/g, '/');

      return cb(null, correctedKey);
    } else {
      return cb('Error: Images, Videos, and PDFs Only!');
    }
  }
});


function createUploadMiddleware(destination) {
  const upload = multer({
    storage: s3Storage,
    limits: { fileSize: 1024 * 1024 * 500 },
    fileFilter: function (req, file, cb) {
      const filetypes = /jpeg|jpg|png|gif|mp4|mov|pdf|files/;
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = filetypes.test(file.mimetype);

      if (mimetype && extname) {
        return cb(null, true);
      } else {
        return cb('Error: Images, Videos, and PDFs Only!');
      }
    },
  }).fields([{ name: 'image', maxCount: 10 }, { name: 'video', maxCount: 1 }, { name: 'pdf', maxCount: 1 }, { name: 'file', maxCount: 1 }]);

  return function (req, res, next) {
    // Set destination directory in request object
    req.destination = destination;

    const uploadType = req.query.uploadType || 'single';
    const uploadMethod = uploadType === 'single' ? 'single' : 'array';

    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(500).json({ message: 'Multer Error: ' + err.message });
      } else if (err) {
        return res.status(500).json({ message: 'Error: ' + err });
      }
      next();
    });
  };
}

// Use createUploadMiddleware to create middleware for different paths
const uploadFacultyPhoto = createUploadMiddleware('faculty');
const uploadStudentPhoto = createUploadMiddleware('student');
const uploadAnnouncement = createUploadMiddleware('announcement');
const galleryUpload = createUploadMiddleware('gallery');
const videoUpload = createUploadMiddleware('videos');
const pdfUpload = createUploadMiddleware('pdf');
const tenderpdf = createUploadMiddleware('tender');
const corrigendum = createUploadMiddleware('tender/corrigendum');
const reportSubmit= createUploadMiddleware('report')
const bannerUpload=createUploadMiddleware('banner')

const SOI_PROJECT_UPLOAD=createUploadMiddleware('soi_project')
const headerUpload=createUploadMiddleware('header_upload')
const homeCarousel=createUploadMiddleware('home_carousel')



module.exports = { uploadFacultyPhoto, uploadStudentPhoto,uploadAnnouncement,galleryUpload,videoUpload,pdfUpload,tenderpdf,corrigendum,reportSubmit,bannerUpload,SOI_PROJECT_UPLOAD,headerUpload,homeCarousel };