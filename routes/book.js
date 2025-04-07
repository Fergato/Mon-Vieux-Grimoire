const express = require("express");
const auth = require("../middleware/auth");
const router = express.Router();
const multer = require("../middleware/multer-config");
const compressImage = require("../middleware/compress-image");

const bookCtrl = require("../controllers/book");

router.post("/", auth, multer, compressImage, bookCtrl.createBook);
router.post("/:id/rating", auth, bookCtrl.bookRating);
router.put("/:id", auth, multer, compressImage, bookCtrl.modifyBook);
router.delete("/:id", auth, bookCtrl.deleteBook);
router.get("/", bookCtrl.getAllBooks);
router.get("/bestrating", bookCtrl.getBestRatedBooks);
router.get("/:id", bookCtrl.getOneBook);

module.exports = router;
