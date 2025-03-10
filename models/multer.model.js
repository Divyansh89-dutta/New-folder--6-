const multer = require('multer');
const path = require('path');
const crypto = require('crypto'); // Corrected typo

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/uploads'); // Ensure this folder exists
    },
    filename: function (req, file, cb) {
        crypto.randomBytes(16, (err, buf) => {
            if (err) return cb(err);
            const filename = buf.toString('hex') + path.extname(file.originalname);
            cb(null, filename);
        });
    }
});

const upload = multer({ storage: storage });
module.exports = upload;
