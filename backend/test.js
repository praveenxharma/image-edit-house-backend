
const mongoose = require('mongoose');

const checkConnection = async () => {
    try {
        console.log("🔄 Connecting to MongoDB...");

        // Connect to the database
        await mongoose.connect('mongodb+srv://praveen:praveen@cluster0.y92vamr.mongodb.net/?appName=Cluster0');

        console.log("✅ Success! Database is connected and working.");

        // Close connection after checking
        await mongoose.connection.close();
        console.log("🔌 Connection closed safely.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Database connection failed!");
        console.error("Error details:", error.message);
        process.exit(1);
    }
};

checkConnection();