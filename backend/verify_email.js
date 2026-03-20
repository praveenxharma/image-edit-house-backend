require('dotenv').config();
const nodemailer = require('nodemailer');

const verifySmtp = async () => {
    console.log('Testing SMTP Connection...');
    console.log('User:', process.env.SMTP_USER);
    // Mask password for log safety, show length
    console.log('Pass Length:', process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    try {
        await transporter.verify();
        console.log('✅ SMTP Connection Successful!');
    } catch (error) {
        console.error('❌ SMTP Connection Failed:');
        console.error(error.message);
        if (error.code === 'EAUTH') {
            console.log('\n💡 Hint: For Gmail, you likely need to use an "App Password" instead of your regular password.');
            console.log('   Go to Google Account > Security > 2-Step Verification > App passwords.');
            console.log('   The password should be 16 characters long.');
        }
    }
};

verifySmtp();
