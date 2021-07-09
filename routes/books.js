var express = require('express');
var router = express.Router();
const { Book } = require('../models');
const { Op } = require("sequelize");



/**=============================
 * Try catch handler
 * @param callback
 * @returns async function
 ==============================*/
const asyncHandler = (cb) => {
  return async (req, res, next) => {
    try {
      await cb(req, res, next);
    } catch (error) {
      next(error);
    }
  }
};

/**============================================================================
 * Search for a book using user input in search bar. it searches for all book attributes
 * @returns list of books and total pages to create pagination in index.pug
 =================================================================================*/
router.get('/search', asyncHandler(async (req, res, next) => {
  const { search } = req.query;
  const bookCount = await Book.count();
  const totalPages = Math.ceil(bookCount / 5);
  const books = await Book.findAll({
    where: {
      [Op.or]: [{
        title: {
          [Op.substring]: `%${search}%`
        }
      },
      {
        author: {
          [Op.substring]: `%${search}%`
        }

      },
      {
        genre: {
          [Op.substring]: `%${search}%`
        }

      },
      {
        year: {
          [Op.substring]: `%${search}%`
        }

      },
      ]
    }
  })
  if (search === '') {
    res.redirect('/books/page/1');
  }
  // if search found renders books else render renders not-found with custom error message
  if (books.length !== 0) {
    res.render('books', { books, search, totalPages, title: "Books" });
  } else {
    const error = new Error('No match found. Search again!')
    error.status = 404;
    next(error);
  }

}));


/**
 * @returns redirect the home page to page one
 */
router.get('/', asyncHandler(async (req, res) => {
  res.redirect("/books/page/1");
}));

// books route
router.get('/books', asyncHandler(async (req, res) => {
  res.render('/books');
}));


/**==============================================================================================
 * @returns render books route and pass the book list and total pages to create pagination in index.pug
 * limits the list to 5 books per page
 =====================================================================================================*/
router.get('/page/:page', asyncHandler(async (req, res) => {
  let { page } = req.params;
  let offSet = (page - 1) * 5;
  const bookCount = await Book.count();
  const totalPages = Math.ceil(bookCount / 5);
  const books = await Book.findAll({
    limit: 5,
    offset: offSet,
    order: [['createdAt', 'DESC']]
  });
  res.render("books", { books, bookCount, page, totalPages, title: "Books" });
}));

/**===================
 * GET new book form
 =====================*/
router.get('/new', asyncHandler(async (req, res) => {
  res.render('books/new-book', { book: {}, title: 'New Book' })
}));

/**==========================================
 * POST new book
 ===========================================*/
router.post('/new', asyncHandler(async (req, res) => {
  let book;
  try {
    book = await Book.create(req.body);
    res.redirect("/books");
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      book = await Book.build(req.body);
      res.render("books/new-book", { book: book, errors: error.errors, title: "New Book" });
    } else {
      throw error;
    }
  }
}));


/**=====================
 * GET individual book form
 =========================*/
router.get("/:id", asyncHandler(async (req, res, next) => {
  const book = await Book.findByPk(req.params.id);
  if (book) {
    res.render("books/update-book", { book: book, title: book.title });
  } else {
    const error = new Error('Books does not exist')
    error.status = 404;
    next(error);
  }

}));

/**===================
 * POST Update Book. 
 * =================*/
router.post('/:id', asyncHandler(async (req, res) => {
  let book;
  try {
    book = await Book.findByPk(req.params.id);
    if (book) {
      await book.update(req.body);
      res.redirect("/books");
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    //provides an array of validation errors that are presented to user if form input are left blank
    // erros are pass donwn to errors.pug
    if (error.name === 'SequelizeValidationError') {
      book = await Book.build(req.body);
      book.id = req.params.id; // make sure correct article gets updated
      res.render('books/update-book', { book: book, errors: error.errors, title: 'Edit Book' });
    } else {
      throw error;
    }
  }
}));

/**===========================
 * Delete individual article.
 * =========================== */
router.post('/:id/delete', asyncHandler(async (req, res) => {
  const book = await Book.findByPk(req.params.id);
  if (book) {
    await book.destroy();
    res.redirect("/books");
  } else {
    res.sendStatus(404);
  }
}));



module.exports = router;
