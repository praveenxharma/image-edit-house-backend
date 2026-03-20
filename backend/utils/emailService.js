const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
    try {
        // Create transporter
        // Ideally, these should be in .env
        const transporter = nodemailer.createTransport({
            service: 'gmail', // or use host/port from env
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const mailOptions = {
            from: process.env.SMTP_USER,
            to,
            subject,
            text
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

module.exports = sendEmail;
