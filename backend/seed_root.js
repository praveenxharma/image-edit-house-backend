const bcrypt = require('bcrypt');
const User = require('./models/User');

const seedRootAdmin = async () => {
    try {
        const username = process.env.ROOT_ADMIN_USERNAME || 'root';
        const email = process.env.ROOT_ADMIN_EMAIL || 'root@admin.com';
        const password = process.env.ROOT_ADMIN_PASSWORD || 'rootpassword';

        const hashedPassword = await bcrypt.hash(password, 10);

        // Remove any existing root admins to ensure there is only one
        await User.deleteMany({ isRoot: true });

        // Create the root admin from .env
        await User.create({
            username: username,
            email: email,
            password: hashedPassword,
            role: 'admin',
            isRoot: true
        });
        
        console.log(`Root admin synced with .env (Username: ${username})`);
    } catch (error) {
        console.error('Error seeding root:', error);
    }
};

module.exports = seedRootAdmin;
