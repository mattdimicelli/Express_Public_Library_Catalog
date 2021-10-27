var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const { DateTime } = require('luxon');

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

// Virtual for formatted due date
BookInstanceSchema
.virtual('due_back_formatted')
.get(function () {
    return DateTime.fromJSDate(this.due_back).toLocaleString(DateTime.DATE_MED);
});

// Export module
module.exports = mongoose.model('BookInstance', BookInstanceSchema);

