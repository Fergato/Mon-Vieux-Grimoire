const Book = require("../models/Book");
const User = require("../models/User");
const fs = require("fs");

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject.userId;
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });
  book
    .save()
    .then(() => {
      res.status(201).json({ message: "Objet enregistré !" });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.modifyBook = (req, res, next) => {
  const bookId = req.params.id;
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };

  Book.findOne({ _id: bookId })
    .then((book) => {
      if (book.userId !== req.auth.userId) {
        return res.status(401).json({ message: "Non autorisé" });
      }

      if (req.file) {
        const imagePath = book.imageUrl.split("/images/")[1];
        fs.unlinkSync(`images/${imagePath}`);
      }

      Book.updateOne({ _id: bookId }, { ...bookObject, _id: bookId })
        .then(() => res.status(200).json({ message: "Livre modifié" }))
        .catch((error) => res.status(500).json({ error }));
    })
    .catch((error) => res.status(400).json({ error }));
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId !== req.auth.userId) {
        res.status(401).json({ message: "Non autorisé" });
      } else {
        const filename = book.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
          Book.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: "Objet supprimé" });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => res.status(500).json({ error }));
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(404).json({ error }));
};

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
};

exports.getBestRatedBooks = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((books) => {
      res.status(200).json(books);
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.bookRating = async (req, res, next) => {
  const bookId = req.params.id;
  const rating = req.body.rating;
  const userId = req.auth.userId;

  if (rating < 0 || rating > 5) {
    return res
      .status(400)
      .json({ error: "La note doit être comprise entre 0 et 5." });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non existant." });
    }

    const rated = await Book.findOne({ _id: bookId, "ratings.userId": userId });
    if (rated) {
      return res.status(400).json({ error: "Vous avez déja noté ce livre." });
    }

    await Book.updateOne(
      { _id: bookId },
      { $push: { ratings: { userId, grade: rating } } }
    );

    const updatedBook = await Book.findById(bookId);

    const ratings = updatedBook.ratings;
    const totalRating = ratings.reduce((sum, rating) => sum + rating.grade, 0);
    const averageRating = totalRating / ratings.length;

    updatedBook.averageRating = Math.floor(averageRating);
    await updatedBook.save();
    return res.status(200).json(updatedBook);
  } catch (error) {
    return res.status(500).json({ error: "Une erreur est survenue." });
  }
};
