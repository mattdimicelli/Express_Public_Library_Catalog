import Genre from '../models/genre.js';
import Book from '../models/book.js';
import async from 'async';
import { body, validationResult } from 'express-validator';


// Display a list of all the genres.
export const genre_list = function(req, res, next) {
    Genre.find()
    .sort([['name', 'ascending']])
    .exec(function(err, list_genres) {
        if (err) return next(err);
        res.render('genre_list', { title: 'Genre List', genre_list: list_genres });
    });
};

// Display detail page for a specific Genre.
export const genre_detail = function(req, res, next) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
            .exec(callback);
        },
        genre_books: function(callback) {
            Book.find({ 'genre': req.params.id })
            .exec(callback);
        }
    }, function(err, results) {
        if (err) return next(err);
        if (results.genre === null) { // No results
            const err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books });
    });
};

// Display Genre create form on GET.
export const genre_create_get = function(req, res, next) {
    res.render('genre_form', { title: 'Create Genre' });
};

// Handle Genre create on POST.
export const genre_create_post = [  /* the validators are middleware funcs, so this 
    is an arr of middleware functions */
    // Validate and sanitize the name field
    body('name', 'Genre name required').trim().isLength( {min: 1}).escape(),

    // then process the request
    (req, res, next) => {

        // Extract the validation errors from the req
        const errors = validationResult(req);

        // Create a genre object with trimmed and escaped data (sanitized)
        const genre = new Genre(
            { name: req.body.name }
        );

        if (!errors.isEmpty()) {
            // Render the form again with sanitized values and/or error messages
            res.render('genre_form', { title: 'Create Genre', genre, errors: errors.array()});
            return;
        }
        else {
            // No errors, but check if a genre with the same name already exists
            Genre.findOne({ 'name': req.body.name })
            .exec((err, found_genre) => {
                if (err) return next(err);
                if (found_genre) {
                    // redirect to the found genre's detail page
                    res.redirect(found_genre.url);
                }
                else {
                    genre.save(err => {
                        if (err) return next(err);
                        res.redirect(genre.url);
                    });
                }
            });
        }
    }
];

// Display Genre delete form on GET.
export const genre_delete_get = function(req, res, next) {
    
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id).exec(callback);
        },
        genre_books: function(callback) {
            Book.find({ 
                genre: req.params.id
            }).exec(callback)
        },
    }, function(err, results) {
        if (err) return next(err);
        if (results.genre === null) {
            res.redirect('/catalog/genres');
        }
        res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books });
    });
};

// Handle Genre delete on POST.
export const genre_delete_post = function(req, res, next) {
    
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.body.genreid).exec(callback);
        },
        genre_books: function(callback) {
            Book.find({ 
                'genre': req.body.genreid,
            }).exec(callback)
        },
    }, function(err, results) {
        if (err) return next(err);
        if(results.genre_books.length > 0) {
            // Genre has books.  Render in same way as for GET route
            res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books});
            return;
        }
        else {
            Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err) {
                if (err) return next(err);
                res.redirect('/catalog/genres');
            });
        }
    });
};

// Display Genre update form on GET.
export const genre_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update GET');
};

// Handle Genre update on POST.
export const genre_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update POST');
};