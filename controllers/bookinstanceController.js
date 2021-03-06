import BookInstance from '../models/bookinstance.js';
import Book from '../models/book.js';
import { body, validationResult } from 'express-validator';

// Display list of all BookInstances.
export const bookinstance_list = function(req, res, next) {
    BookInstance.find()
        .populate('book')
        .exec()
        .then(list_bookinstances => {
            res.render('bookinstance_list', {
                title: 'Book Copy List', bookinstance_list: list_bookinstances
            })
        })
        .catch(err => next(err)); 
};

// Display detail page for a specific BookInstance.
export const bookinstance_detail = function(req, res, next) {
    BookInstance.findById(req.params.id)
    .populate('book')
    .exec()
    .then(bookinstance => {
        if (bookinstance === null) {
            const err = new Error('Book copy not found');
            err.status = 404;
            next(err);
        }
        res.render('bookinstance_detail', { title: `Copy: ${bookinstance.book.title}`, bookinstance });
    })
    .catch(err => next(err));
};

// Display BookInstance create form on GET.
export const bookinstance_create_get = function(req, res, next) {
    
    Book.find({}, 'title')
    .exec()
    .then(books => res.render('bookinstance_form', {title: 'Create Copy', book_list: books}))
    .catch(err => next(err));
};

// Handle BookInstance create on POST.
export const bookinstance_create_post = [
    
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
            .exec()
            .then(books => {
                res.render('bookinstance_form', {
                    title: 'Create BookInstance',
                    book_list: books,
                    selected_book: bookinstance.book._id,
                    errors: errors.array(),
                    bookinstance: bookinstance,
                });
            })
            .catch(err => next(err));
            return;
        }
        else {
            bookinstance.save()
            .then(() => res.redirect(bookinstance.url))
            .catch(err => next(err));
        }
    }
];

// Display BookInstance delete form on GET.
export const bookinstance_delete_get = function(req, res, next) {  

    BookInstance.findById(req.params.id).exec()
    .then(book_instance => {
        if (book_instance === null) {
            res.redirect('/catalog/bookinstances');
        }
        res.render('bookinstance_delete', { title: 'Delete Copy', book_instance, })
    })
    .catch(err => next(err));
}
        

// Handle BookInstance delete on POST.
export const bookinstance_delete_post = function(req, res, next) {
    BookInstance.findByIdAndRemove(req.body.book_instanceid).exec()
    .then(() => res.redirect('/catalog/bookinstances'))
    .catch(err => next(err));
};

// Display BookInstance update form on GET.
export const bookinstance_update_get = function(req, res, next) {
    
    BookInstance.findById(req.params.id).populate('book').exec()
    .then(bookinstance => {
        if (bookinstance === null) {
            const err = new Error('Copy not found');
            err.status = 404;
            return next(err);
        }
        res.render('bookinstance_form', { title: 'Update Copy', bookinstance })
    })
    .catch(err => next(err));
};

// Handle bookinstance update on POST.
export const bookinstance_update_post = [

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
            BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}).exec()
            .then(thecopy => {
                res.redirect(thecopy.url)
            })
            .catch(err => next(err));
        }
    }
];