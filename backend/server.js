require('dns').setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./database');
const seedRootAdmin = require('./seed_root');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database
connectDB().then(() => {
    seedRootAdmin();
});

// ✅ Allowed Origins (NO trailing slash)
const allowedOrigins = [
    "https://image-edit-house.netlify.app",
    "http://localhost:5173"
];

// ✅ CORS Fix
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));

// Middleware
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Root Route - Friendly Landing Page
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Image Edit House API</title>
        </head>
        <body style="font-family:sans-serif; text-align:center; padding:50px;">
            <h1>✅ Server Running</h1>
            <p>Backend is live and working 🚀</p>
            <a href="https://image-edit-house.netlify.app">Go to Frontend</a>
        </body>
        </html>
    `);
});

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/tasks', require('./routes/tasks'));
app.use('/gallery', require('./routes/gallery'));
app.use('/work', require('./routes/work'));

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});