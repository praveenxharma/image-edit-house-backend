const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const connStr = process.env.MONGODB_URI;
        if (!connStr) {
            console.error('MongoDB Connection Error: MONGODB_URI is not defined in environment variables.');
            process.exit(1);
        }
        await mongoose.connect(connStr);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    }
};

module.exports = connectDB;
