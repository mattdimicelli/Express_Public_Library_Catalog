const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const genreSchema = new Schema({
    name: {type: String, required: true, minlength: 3, maxlength: 100 },
});

genreSchema
.virtual('url')
.get(function(){
    return '/catalog/genre/' + this._id;
});

module.exports = mongoose.model('Genre', genreSchema);