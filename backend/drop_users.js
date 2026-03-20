const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/image-edit-house').then(async () => {
    try {
        await mongoose.connection.db.dropCollection('users');
        console.log('Users collection dropped');
    } catch (e) {
        console.log('Collection might not exist', e.message);
    }
    process.exit(0);
});
