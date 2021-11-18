import Book from '../models/book.js';
import Author from '../models/author.js';
import Genre from '../models/genre.js';
import BookInstance from '../models/bookinstance.js';
import { body, validationResult } from 'express-validator';


export const index = function(req, res) {
    Promise.all([
        Book.countDocuments({}).exec(), 
        BookInstance.countDocuments({}).exec(), 
        BookInstance.countDocuments({status: 'Available'}).exec(), 
        Author.countDocuments({}).exec(), 
        Genre.countDocuments({}).exec(), 
    ])
    .then(resultsArr => {
        const results = {
            book_count: resultsArr[0],
            book_instance_count: resultsArr[1],
            book_instance_available_count: resultsArr[2],
            author_count: resultsArr[3],
            genre_count: resultsArr[4],
        };
        res.render('index', { title: 'Local Library Home', data: results, error: undefined });
    })
    .catch(err => {
        res.render('index', { title: 'Local Library Home', error: err });
    });
};

// Display list of all books.
export const book_list = function(req, res, next) {
    
    Book.find({}, 'title author')
    .sort([['title', 'ascending']])
    // same as .sort({title : 1})
    .populate('author')
    .exec()
    .then(list_books => {
        res.render('book_list', { title: 'Book List', book_list: list_books });
    })
    .catch(err => next(err));
};


// Display detail page for a specific book.
export const book_detail = function(req, res, next) {
    Promise.all([
        Book.findById(req.params.id).populate('author').populate('genre').exec(),
        BookInstance.find({ 'book': req.params.id }).exec(),
    ])
    .then(resultsArr => {
        const results = { book: resultsArr[0], book_instance: resultsArr[1] };
        if (results.book === null) { // no results
            const err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }
        res.render('book_detail', {
             title: results.book.title, book: results.book,
              book_instances: results.book_instance });
    })
    .catch(err => next(err));
};

// Display book create form on GET.
export const book_create_get = function(req, res, next) {
    // Get all authors and genres, which we can use for adding to our book
    Promise.all([
        Author.find().exec(),
        Genre.find().exec(),
    ])
    .then(results => {
        res.render('book_form', { 
            title: 'Create Book',
            authors: results[0],
            genres: results[1],
        });
    })
    .catch(err => next(err));
};

// Handle book create on POST.
export const book_create_post = [
    // Convert the genre to an array.
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === 'undefined') {
                req.body.genre = [];
            }
            else {
                req.body.genre = new Array(req.body.genre);
            }
        }
        next();
    },

    // Validate and sanitize fields
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('author', 'Author must not be empty').trim().isLength({ min: 1 }).escape(),
    body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('isbn', 'ISBN must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('genre.*').escape(),  // the wildcard is used to individually validate
    // each of the genre array entries

    // Process request after validation and sanitization.
    (req, res, next) => {
        // Extract the validation errors from the request
        const errors = validationResult(req);

        // Create a Book instance with the trimmed and escaped data
        const book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre,
        });

        if(!errors.isEmpty()) {
            //Render form again with sanitized values and/or error messages

            // Get all authors and genres for form
            Promise.all([
                Author.find().exec(),
                Genre.find().exec(),
            ])
            .then(results => {
                // Mark our selected genres as checked.
                for (let i = 0; i < results[1].length; i ++) {
                    if (book.genre.indexOf(results[1][i]._id) > -1) {
                        results[1][i].checked = 'true';
                    }
                }
                res.render('book_form', { title: 'Create Book', authors: results[0], genres: results[1], book, errors: errors.array() });
            })
            .catch(err => next(err));
            return;
        }
        else {
            // Data from the form is valid.  Save the book.
            book.save()
            .then(() => res.redirect(book.url))
            .catch(err => next(err));
        }
    }
];

// Display book delete form on GET.
export const book_delete_get = function(req, res, next) {
    Promise.all([
        Book.findById(req.params.id).exec(),
        BookInstance.find({ book: req.params.id }).exec(),
    ])
    .then(results => {
        if (results[0] === null) {
            res.redirect('/catalog/books');
        }
        res.render('book_delete', { title: 'Delete Book', book: results[0], book_instances: results[1] });
    })
    .catch(err => next(err));
};

// Handle book delete on POST.
export const book_delete_post = function(req, res, next) {
    Promise.all([
        Book.findById(req.body.bookid).exec(),
        BookInstance.find({ 'book': req.body.bookid }).exec(),
    ])
    .then(results => {
        if(results[1].length > 0) {
            // Book has copies.  Render in same way as for GET route
            res.render('book_delete', { title: 'Delete Book', book: results[0], book_instances: results[1] });
            return;
        }
        else {
            Book.findByIdAndRemove(req.body.bookid)
            .exec()
            .then(() => res.redirect('/catalog/books'))
            .catch(err => next(err));
        }
    })
    .catch(err => next(err));
};

// Display book update form on GET.
export const book_update_get = function(req, res, next) {
    // Get book, authors, and genres for form
    Promise.all([
        Book.findById(req.params.id).populate('author').populate('genre').exec(),
        Author.find().exec(),
        Genre.find().exec(),
    ])
    .then(results => {
        if (results[0] === null) {
            const err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }
        // Otherwise, success
        // Mark the selected genres with check marks.
        for (let i = 0; i < results[2].length; i++) {
            for (let y = 0; y < results[0].genre.length; y++) {
                if (results[2][i]._id.toString() === results[0].genre[y]._id.toString()) {
                    results[2][i].checked = 'true';
                }
            }
        }
        res.render('book_form', { title: 'Update Book', authors: results[1], genres: results[2], book: results[0] });
    })
    .catch(err => next(err));
};

// Handle book update on POST.
export const book_update_post = [

    // Convert the genre to an array
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === 'undefined') {
                req.body.genre = [];
            }
            else {
                req.body.genre = new Array(req.body.genre);
            }
        }
        next();
    },

    // Validate and sanitize the form fields
    body('title', 'Title must not be empty').trim().isLength({ min: 1 }).escape(),
    body('author', 'Author must not be empty').trim().isLength({ min: 1 }).escape(),
    body('summary', 'Summary must not be empty').trim().isLength({ min: 1 }).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
    body('genre.*').escape(),

    // Process request after validation and sanitization
    (req, res, next) => {
        const errors = validationResult(req);

        // create a book instance with the trimmed/escaped data and the old ID
        const book = new Book({
            title: req.body.title,
            author: req.body.author,
            isbn: req.body.isbn,
            summary: req.body.summary,
            genre: typeof req.body.genre === undefined ? [] : req.body.genre,
            _id: req.params.id, // This is required, or a new ID will be assigned!
        });

        if (!(errors.isEmpty())) {

            // Get all the authors and genres to re-render the form (with sanitized values/error msgs)
            Promise.all([
                Author.find().exec(),
                Genre.find().exec(),
            ])
            .then(results => {
                 // Mark the selected genres as checked
                 for (let i = 0; i < results[1].length; i++) {
                    if (book.genre.indexOf(results[1][i]._id) > -1) {
                        results[1][i].checked = 'true';
                    }
                }
                res.render('book_form', { 
                    title: 'Update Book',
                    authors: results.authors,
                    genres: results.genres,
                    book,
                    errors: errors.array(),
                });
            })
            .catch(err => next(err))

            return;
        }
        else {
            Book.findByIdAndUpdate(req.params.id, book, {})
            .exec()
            .then(thebook => res.redirect(thebook.url))
            .catch(err => next(err))
        }
    }
];