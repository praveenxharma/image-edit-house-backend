const express = require('express');
const multer = require('multer');
const path = require('path');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

// Create Task (User)
router.post('/', auth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Image file is required' });
        }

        const { instructions } = req.body;
        const task = await Task.create({
            instructions,
            originalImagePath: req.file.path,
            user: req.user.id // JWT payload has id, which we put there from user._id
        });

        // Return object with id mapping if needed, or rely on frontend handling
        // Mongoose toJSON usually keeps _id, let's explicit map for safety if frontend is rigid
        const taskObj = task.toObject();
        taskObj.id = task._id;
        res.json(taskObj);
    } catch (err) {
        console.error('Error creating task:', err);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Get Tasks (Admin: All, User: Own)
router.get('/', auth, async (req, res) => {
    try {
        const filter = req.user.role === 'admin' ? {} : { user: req.user.id };
        const tasks = await Task.find(filter).sort({ createdAt: -1 }).populate('user', 'username');

        // Map _id to id for frontend compatibility
        const formattedTasks = tasks.map(t => {
            const temp = t.toObject();
            temp.id = t._id;
            return temp;
        });

        res.json(formattedTasks);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Complete Task (Admin) - Upload Edited Image
router.put('/:id/complete', auth, upload.single('editedImage'), async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found' });

        task.editedImagePath = req.file.path;
        task.status = 'completed';
        await task.save();

        const temp = task.toObject();
        temp.id = task._id;
        res.json(temp);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// Delete Task (Admin)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found' });

        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

module.exports = router;
