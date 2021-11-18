import Genre from '../models/genre.js';
import Book from '../models/book.js';
import { body, validationResult } from 'express-validator';


// Display a list of all the genres.
export const genre_list = function(req, res, next) {
    Genre.find().sort([['name', 'ascending']]).exec()
    .then(list_genres => {
        res.render('genre_list', { title: 'Genre List', genre_list: list_genres });
    })
    .catch(err => next(err));
};

// Display detail page for a specific Genre.
export const genre_detail = function(req, res, next) {
    Promise.all([
        Genre.findById(req.params.id).exec(),
        Book.find({ 'genre': req.params.id }).exec(),
    ])
    .then(results => {
        if (results[0] === null) { // No results
            const err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('genre_detail', { title: 'Genre Detail', genre: results[0], genre_books: results[1] });
    })
    .catch(err => next(err));
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
        const genre = new Genre({ name: req.body.name });

        if (!errors.isEmpty()) {
            // Render the form again with sanitized values and/or error messages
            res.render('genre_form', { title: 'Create Genre', genre, errors: errors.array()});
            return;
        }
        else {
            // No errors, but check if a genre with the same name already exists
            Genre.findOne({ 'name': req.body.name }).exec()
            .then(found_genre => {
                if (found_genre) {
                    // redirect to the found genre's detail page
                    res.redirect(found_genre.url);
                }
                else {
                    genre.save().
                    then(() => res.redirect(genre.url))
                    .catch(err => next(err));
                }
            })
            .catch(err => next(err));
        }
    }
];

// Display Genre delete form on GET.
export const genre_delete_get = function(req, res, next) {
    Promise.all([
        Genre.findById(req.params.id).exec(),
        Book.find({ genre: req.params.id}).exec(),
    ])
    .then(results => {
        if (results[0] === null) {
            res.redirect('/catalog/genres');
        }
        res.render('genre_delete', { title: 'Delete Genre', genre: results[0], genre_books: results[1] });
    })
    .catch(err => next(err));
};

// Handle Genre delete on POST.
export const genre_delete_post = function(req, res, next) {
    Promise.all([
        Genre.findById(req.body.genreid).exec(),
        Book.find({ 'genre': req.body.genreid }).exec(),
    ])
    .then(results => {
        if(results[1].length > 0) {
            // Genre has books.  Render in same way as for GET route
            res.render('genre_delete', { title: 'Delete Genre', genre: results[0], genre_books: results[1]});
            return;
        }
        else {
            Genre.findByIdAndRemove(req.body.genreid).exec()
            .then(() => res.redirect('/catalog/genres'))
            .catch(err => next(err));
        }
    })
    .catch(err => next(err));
};

// Display Genre update form on GET.
export const genre_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update GET');
};

// Handle Genre update on POST.
export const genre_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update POST');
};