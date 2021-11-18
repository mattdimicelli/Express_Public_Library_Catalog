import Author from '../models/author.js';
import Book from '../models/book.js';
import { body, validationResult } from 'express-validator';

//  Display list of all Authors.
export const author_list = function(req, res, next) {
    
    Author.find()
        .sort([['family_name', 'ascending']])
        .exec()
        .then(list_authors => {
            res.render('author_list', { title: 'Author List', author_list: list_authors });
        })
        .catch(err => next(err));
};

// Display detail page for a specific author
export const author_detail = function(req, res, next) {
    Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ 'author': req.params.id }, 'title summary').exec(),
    ])
    .then(results => {
        // results[0] is the author, results[1] is the book
        if (results[0] === null) { // Author not found
            const err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('author_detail', { title: 'Author Detail', author: results[0], author_books: results[1]})
    })
    .catch(err => next(err));
};


// Display Author create form on GET
export const author_create_get = function(req, res, next) {
    res.render('author_form', { title: 'Create Author' });
};

// Handle Author create on POST
export const author_create_post = [

    // Validate and sanitize fields
    body('first_name').trim().isLength({ min: 1 }).escape().withMessage(
        'First name must be specified').isAlphanumeric().withMessage(
            'First name has non-alphanumeric characters'
        ),
    body('family_name').trim().isLength({ min: 1}).escape().withMessage(
        'Family name must be specified').isAlphanumeric().withMessage(
            'Family name has non-alphanumeric characters'
        ),
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true })
    .isISO8601().toDate(),
    //  These validations are only performed if the field has been entered.
    // These check if the dates are ISO-8601 compliant.
    // checkFalsy means that we'll accept either an empty str or a null as an empty value
    body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true })
    .isISO8601().toDate(),
    // parameters are received from the requests as strings.  toDate() (or toBoolean())
    // recasts them to the proper JS types

    // JavaScript treats date strings as including the time of 0 hours,
    //  but additionally treats date strings in that format (the ISO 8601
    //     standard) as including the time 0 hours UTC, rather than the 
    //     local time. If your time zone is west of UTC, the date display,
    //      being local, will be one day before the date you entered. This
    //       is one of several complexities (such as multi-word family names and 
    //         multi-author books) that we are not addressing here.

    // Process request after validation and sanitization
    (req, res, next) => {
        const errors = validationResult(req);

        if(!errors.isEmpty()) {
            // Render form again with sanitized values / error messages
            res.render('author_form', { title: 'Create Author', author: req.body, errors: errors.array() });
            return;
        }
        else {
            // Create an Author object with the escaped and trimmed data
            const author = new Author(
                {
                    first_name: req.body.first_name,
                    family_name: req.body.family_name,
                    date_of_birth: req.body.date_of_birth,
                    date_of_death: req.body.date_of_death,
                }
            );
            // Unlike the Genre's post handler, we don't check whether the author obj already exists 
            // before handling it.  Arguably we should, though as it is now we can have multiple 
            // authors with the same name.
            author.save(err => {
                if (err) return next(err);
                res.redirect(author.url);
            });
        }
    }
];

// Display Author delete form on GET
export const author_delete_get = function(req, res, next) {
    Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ author: req.params.id }).exec(),
    ])
    .then(results => {
        if (results[0] === null) { //Author not found
            res.redirect('/catalog/authors');
        }
        res.render('author_delete', { title: 'Delete Author', author: results[0], author_books: results[1] });
    })
    .catch(err => next(err));
};


// Handle Author delete on POST
export const author_delete_post = function(req, res, next) {
    Promise.all([
        Author.findById(req.body.authorid).exec(),
        Book.find({ 'author': req.body.authorid }).exec(),
    ])
    .then(results => {
        if(results[1].length > 0) {
            // Author has books.  Render in sam way as for GET route
            res.render('author_delete', { title: 'Delete Author', author: results[0], author_books: results[1]});
            return;
        }
        else {
            Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
                if (err) return next(err);
                res.redirect('/catalog/authors');
            });
        }
    })
    .catch(err => next(err));
};

//  Display Author update form on GET
export const author_update_get = function(req, res, next) {
    Author.findById(req.params.id)
    .exec()
    .then(author => {
        if (author === null) {
            const err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }
        res.render('author_form', { title: 'Update Author', author })
    })
    .catch(err => next(err));
};

// Handle Author update on POST
export const author_update_post = [

     // Validate and sanitize fields
     body('first_name').trim().isLength({ min: 1 }).escape().withMessage(
        'First name must be specified').isAlphanumeric().withMessage(
            'First name has non-alphanumeric characters'
        ),
    body('family_name').trim().isLength({ min: 1}).escape().withMessage(
        'Family name must be specified').isAlphanumeric().withMessage(
            'Family name has non-alphanumeric characters'
        ),
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true })
    .isISO8601().toDate(),
    //  These validations are only performed if the field has been entered.
    // These check if the dates are ISO-8601 compliant.
    // checkFalsy means that we'll accept either an empty str or a null as an empty value
    body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true })
    .isISO8601().toDate(),
    // parameters are received from the requests as strings.  toDate() (or toBoolean())
    // recasts them to the proper JS types

    // JavaScript treats date strings as including the time of 0 hours,
    //  but additionally treats date strings in that format (the ISO 8601
    //     standard) as including the time 0 hours UTC, rather than the 
    //     local time. If your time zone is west of UTC, the date display,
    //      being local, will be one day before the date you entered. This
    //       is one of several complexities (such as multi-word family names and 
    //         multi-author books) that we are not addressing here.


    // Process request after validation and sanitization
    (req, res, next) => {
        const errors = validationResult(req);

        // create an author instance with the trimmed/escaped data and the old ID
        const author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
            _id: req.params.id, // This is required, or a new ID will be assigned!
        });

        if (!(errors.isEmpty())) {

            // Re-render the form with sanitized values/error msgs
            res.render('author_form', { 
                title: 'Update Author',
                author,
                errors: errors.array(),
            });
            return;
        }
        else {
            Author.findByIdAndUpdate(req.params.id, author, {})
            .exec()
            .then(theauthor => {
                res.redirect(theauthor.url);
            })
            .catch(err => next(err));
        }
    }
];