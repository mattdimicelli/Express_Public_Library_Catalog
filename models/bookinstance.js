import mongoose from 'mongoose';
const Schema = mongoose.Schema;
import { DateTime } from 'luxon';

const BookInstanceSchema = new Schema(
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

// Virtual for due date formatted to be read by user
BookInstanceSchema
.virtual('due_back_formatted')
.get(function () {
    return DateTime.fromJSDate(this.due_back).toLocaleString(DateTime.DATE_MED);
});

// Virtual for due date formatted as YYYY-MM-DD
BookInstanceSchema
.virtual('due_back_formatted_iso')
.get(function() {
    return DateTime.fromJSDate(this.due_back).toISODate();
});

// Export module
export default mongoose.model('BookInstance', BookInstanceSchema);

