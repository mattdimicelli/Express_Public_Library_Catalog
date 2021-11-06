const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const BookSchema = new Schema(
  {
    title: {type: String, required: true},
    author: {type: Schema.Types.ObjectId, ref: 'Author', required: true},
    summary: {type: String, required: true},
    isbn: {type: String, required: true},
    genre: [{type: Schema.Types.ObjectId, ref: 'Genre'}],
    // the book references the author and genre, but not vice-versa
  }
);

// Virtual for book's URL
BookSchema
.virtual('url')
.get(function() {
    return '/catalog/book/' + this._id;
});

// Export module
module.exports = mongoose.model('Book', BookSchema);