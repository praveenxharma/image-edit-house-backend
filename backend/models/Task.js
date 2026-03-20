const mongoose = require('mongoose');
const Counter = require('./Counter');

const TaskSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    taskId: {
        type: String,
        unique: true,
        default: function () {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let result = '';
            for (let i = 0; i < 6; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        }
    },
    instructions: {
        type: String,
        required: true
    },
    originalImagePath: {
        type: String,
        required: true
    },
    editedImagePath: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending'
    }
}, { timestamps: true });

// Removed pre-save hook for auto-increment

module.exports = mongoose.model('Task', TaskSchema);
