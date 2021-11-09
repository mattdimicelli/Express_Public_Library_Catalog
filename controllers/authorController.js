const Author = require('../models/author');
const async = require('async');
const Book = require('../models/book');
const { body, validationResult } = require('express-validator');

//  Display list of all Authors.
exports.author_list = function(req, res, next) {
    
    Author.find()
        .sort([['family_name', 'ascending']])
        .exec(function(err, list_authors){
            if (err) return next(err);
            //Successful, so render
            res.render('author_list', { title: 'Author List', author_list: list_authors });
        });
};

// Display detail page for a specific author
exports.author_detail = function(req, res, next) {
    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id)
            .exec(callback);
        },
        author_books: function(callback) {
            Book.find({ 'author': req.params.id }, 'title summary')
            .exec(callback);
        }
    }, function(err, results) {
        if(err) return next(err);
        if (results.author === null) { //author not found
            const err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('author_detail', { title: 'Author Detail', author: results.author, author_books: results.author_books });
    });
};

// Display Author create form on GET
exports.author_create_get = function(req, res, next) {
    res.render('author_form', { title: 'Create Author' });
};

// Handle Author create on POST
exports.author_create_post = [

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
]

// Display Author delete form on GET
exports.author_delete_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Author delete GET');
};

// Handle Author delete on POST
exports.author_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Author delete POST');
};

//  Display Author update form on GET
exports.author_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Author update GET');
};

// Handle Author update on POST
exports.author_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Author update POST');
};