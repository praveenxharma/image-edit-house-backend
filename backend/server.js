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

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
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
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    background-color: #0d1117;
                    color: #c9d1d9;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    text-align: center;
                }
                .container {
                    background: #161b22;
                    padding: 3rem;
                    border-radius: 16px;
                    border: 1px solid #30363d;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    max-width: 500px;
                }
                h1 {
                    color: #e6edf3;
                    margin-bottom: 1rem;
                }
                .status {
                    display: inline-block;
                    padding: 0.5rem 1rem;
                    background: rgba(59, 130, 246, 0.15);
                    color: #58a6ff;
                    border-radius: 20px;
                    font-weight: bold;
                    margin-bottom: 2rem;
                    border: 1px solid rgba(59, 130, 246, 0.3);
                }
                p {
                    line-height: 1.6;
                    color: #8b949e;
                    margin-bottom: 2rem;
                }
                .btn {
                    display: inline-block;
                    background: #238636;
                    color: white;
                    padding: 0.75rem 1.5rem;
                    border-radius: 6px;
                    text-decoration: none;
                    font-weight: 600;
                    transition: background 0.2s;
                }
                .btn:hover {
                    background: #2ea043;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="status">● System Online</div>
                <h1>Image Edit House API</h1>
                <p>
                    The backend server is running successfully.<br>
                    You can now connect your frontend application.
                </p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="btn">Visit Frontend</a>
            </div>
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
