const multer = require('multer');
const path = require("path");

const storage = multer.diskStorage({
    fileFilter: (req, file, cb) => {
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.mp4', '.mov', '.avi', '.pdf', '.docx'];

        let ext = path.extname(file.originalname);

        if (allowedExtensions.includes(ext.toLocaleLowerCase())) {
            cb(null, true);
        } else {
            cb(new Error('unsupported file type'), false);
        }
    },
});

const upload = multer({ storage, fileFilter });

module.exports = upload;