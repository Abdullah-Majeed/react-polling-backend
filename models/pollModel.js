const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pollSchema = new Schema({
    question: {
        type: String,
        required: true,
        trim: true,
    },
    options: [
        {
            text: {
                type: String,
                required: true,
            },
            vote: {
                type: Number,
                default: 0
            }
        }
    ]
    ,
    image: {
        type: String,
        required: true,
    },
    user_id: {
        type: String,
        required: true,
    }
}, { timestamps: true });

module.exports = mongoose.model('Poll', pollSchema);