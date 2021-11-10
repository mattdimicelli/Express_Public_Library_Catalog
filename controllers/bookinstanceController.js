const BookInstance = require('../models/bookinstance');
const Book = require('../models/book');
const { body, validationResult } = require('express-validator');

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {
    BookInstance.find()
        .populate('book')
        .exec(function (err, list_bookinstances) {
            if (err) return next(err);
            //Successful, so render
            res.render('bookinstance_list', {
                title: 'Book Copy List', bookinstance_list: list_bookinstances
            }); 
        });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res, next) {
    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function(err, bookinstance) {
        if (err) return next(err);
        if (bookinstance === null) {
            const err = new Error('Book copy not found');
            err.status = 404;
            next(err);
        }
        res.render('bookinstance_detail', { title: `Copy: ${bookinstance.book.title}`, bookinstance });
    });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {
    
    Book.find({}, 'title')
    .exec((err, books) => {
        if (err) return next(err);
        res.render('bookinstance_form', { title: 'Create Copy', book_list: books });
    });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    
    // Validate and sanitize fields
    body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601().toDate(),

    // Process request after validation and sanitization
    (req, res, next) => {
        const errors = validationResult(req);

        // Create a bookinstance with escaped and trimmed data
        const bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
        });

        if(!errors.isEmpty()) {
            // Re-render form with sanitized values and/or error messages
            Book.find({}, 'title')
            .exec((err, books) => {
                if (err) return next(err);
                res.render('bookinstance_form', {
                    title: 'Create BookInstance',
                    book_list: books,
                    selected_book: bookinstance.book._id,
                    errors: errors.array(),
                    bookinstance: bookinstance,
                });
            });
            return;
        }
        else {
            bookinstance.save(err => {
                if (err) return next(err);
                res.redirect(bookinstance.url);
            });
        }
    }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res, next) {  

    BookInstance.findById(req.params.id).exec((err, book_instance) => {
        if (err) return next(err);
        if (book_instance === null) {
            res.redirect('/catalog/bookinstances');
        }
        res.render('bookinstance_delete', { title: 'Delete Copy', book_instance, });
    });
}
        

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res, next) {
    BookInstance.findByIdAndRemove(req.body.book_instanceid, function deleteCopy(err) {
        if (err) return next(err);
        res.redirect('/catalog/bookinstances');
    });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res, next) {
    
    BookInstance.findById(req.params.id).populate('book').exec((err, bookinstance) => {
        if (err) return next(err);
        if (bookinstance === null) {
            const err = new Error('Copy not found');
            err.status = 404;
            return next(err);
        }
    
        res.render('bookinstance_form', { title: 'Update Copy', bookinstance });
    });
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [

    // Validate and sanitize fields
    body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601().toDate(),

    // Process request after validation and sanitization
    (req, res, next) => {
        const errors = validationResult(req);

        // create a copy with the trimmed/escaped data and the old ID
        const bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id, // This is required, or a new ID will be assigned!
        });

        if (!(errors.isEmpty())) {

            res.render('bookinstance_form', { 
                title: 'Update Copy',
                bookinstance,
                errors: errors.array(),
            });
            return;
        }
        else {
            BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, (err, thecopy) => {
                if (err) return next(err);
                res.redirect(thecopy.url);
            });
        }
    }
];