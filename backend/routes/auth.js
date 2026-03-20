const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const sendEmail = require('../utils/emailService');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/auth');

// Multer Storage for Profile Pictures
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/profiles/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, 'profile-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Only images are allowed'));
    }
});

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        // Check if user exists (Optional as unique index handles it, but good for error msg)
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) return res.status(400).json({ error: 'Username or Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        // Force role to 'user' for public registration
        const user = await User.create({ username, email, password: hashedPassword, role: 'user' });
        res.json({ message: 'User registered' });
    } catch (err) {
        console.log('REGISTRATION ERROR:', err.message);
        console.log(err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Mongoose uses _id
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret_key_123');
        res.json({ token, role: user.role, profilePicture: user.profilePicture, username: user.username });
    } catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get Current User
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
});

// Upload/Update Profile Picture
// Upload/Update Profile Picture
router.post('/profile-picture', authMiddleware, (req, res, next) => {
    upload.single('profilePicture')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: `Upload error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Delete old profile picture if exists
        if (user.profilePicture) {
            const oldPath = path.join(__dirname, '..', user.profilePicture);
            if (fs.existsSync(oldPath)) {
                // Check if it is a file before deleting
                try {
                    const stats = fs.statSync(oldPath);
                    if (stats.isFile()) fs.unlinkSync(oldPath);
                } catch (e) { /* ignore deletion errors */ }
            }
        }

        user.profilePicture = req.file.path.replace(/\\/g, '/'); // Normalize path
        await user.save();

        res.json({ message: 'Profile picture updated', profilePicture: user.profilePicture });
    } catch (err) {
        console.error('Profile upload error:', err);
        res.status(500).json({ error: 'Failed to update profile picture' });
    }
});


// List all admins
router.get('/admins', async (req, res) => {
    try {
        const admins = await User.find({ role: 'admin' }).select('-password');
        res.json(admins);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch admins' });
    }
});

// Send OTP for new admin
router.post('/send-admin-otp', async (req, res) => {
    try {
        const { email } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'Email already exists' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await Otp.create({ email, otp });

        await sendEmail(email, 'Admin Verification OTP', `Your OTP for admin registration is: ${otp}`);
        res.json({ message: 'OTP sent successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

// Add new admin (with OTP)
router.post('/add-admin', async (req, res) => {
    try {
        const { username, email, password, otp } = req.body;

        // Verify OTP
        const otpRecord = await Otp.findOne({ email, otp });
        if (!otpRecord) return res.status(400).json({ error: 'Invalid or expired OTP' });

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) return res.status(400).json({ error: 'Username or Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ username, email, password: hashedPassword, role: 'admin' });

        // Delete OTP after use
        await Otp.deleteOne({ _id: otpRecord._id });

        res.json({ message: 'Admin added successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add admin' });
    }
});

// Remove admin
router.delete('/remove-admin/:id', async (req, res) => {
    try {
        const admin = await User.findById(req.params.id);
        if (!admin) return res.status(404).json({ error: 'Admin not found' });
        if (admin.isRoot) return res.status(403).json({ error: 'Cannot remove Root Admin' });

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'Admin removed successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to remove admin' });
    }
});

module.exports = router;
