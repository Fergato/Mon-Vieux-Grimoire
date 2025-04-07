const sharp = require("sharp");
const fs = require("fs");

const compressImage = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const imagePath = req.file.path;
  const fileName = req.file.filename.split(".")[0];
  const compressedFileName = `${fileName}${Date.now()}.webp`;
  const compressedImagePath = `${req.file.destination}/${compressedFileName}`;

  sharp(imagePath)
    .metadata()
    .then((metadata) => {
      let width = metadata.width;
      let height = metadata.height;

      if (width > 1000 || height > 1000) {
        if (width > height) {
          width = 1000;
          height = null;
        } else {
          height = 1000;
          width = null;
        }
      }

      sharp(imagePath)
        .resize(width, height)
        .webp()
        .toFile(compressedImagePath, (error) => {
          if (error) {
            return res
              .status(500)
              .json({ error: "Error during image compression" });
          }

          req.file.filename = compressedFileName;
          req.file.path = compressedImagePath;

          fs.unlinkSync(imagePath);

          next();
        });
    })
    .catch((error) => {
      return res.status(500).json({ error: "Error during image processing" });
    });
};

module.exports = compressImage;
