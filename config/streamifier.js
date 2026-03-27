const streamifier = require("streamifier");
const cloudinary = require("./cloudinary");

const uploadFromBuffer = (buffer, publicId) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "vehicle_qrcodes",
        public_id: publicId,
        resource_type: "image"
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary Error:", error);
          return reject(error);
        }
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

module.exports = uploadFromBuffer;