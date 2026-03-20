const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_123');
        req.user = verified;
        next();
    } catch (err) {
        console.error('JWT Verification Error:', err.message);
        res.status(400).json({ error: err.message });
    }
};
