const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    fileFilter: (req, file, cb) => {
        const allowedExtensions = ['.jpg', '.jpeg', '.png'];

        let ext = path.extname(file.originalname);

        if (allowedExtensions.includes(ext.toLowerCase())) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file type'), false);
        }
    },
});

const upload = multer({ storage });

module.exports = upload;