var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BookInstanceSchema = new Schema(
    {
        book: {type: Schema.Types.ObjectId, required: true, ref: 'Book'},
        imprint: {type: String, required: true},
        status: {type: String, required: true, default: 'Maintenance', enum: ['Available', 'Maintenance', 'Loaned', 'Reserved']},
        due_back: {type: Date, default: Date.now},
    }
);

// Virtual for bookinstance's URL
BookInstanceSchema
.virtual('url')
.get(function(){
    return '/catalog/bookinstance/' + this._id;
});

// Export module
module.exports = mongoose.model('BookInstance', BookInstanceSchema);

