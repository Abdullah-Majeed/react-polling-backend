const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const requireAuth = async (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization) {
        res.status(401).json({ error: 'Autorization token is required' })
    }
    
    const token = authorization.split(' ')[1];
    try {
        const { _id } = jwt.verify(token, process.env.SECRET_KEY);
        req.user = await User.findOne({ _id }).select('_id');
        next();
    }
    catch (error) {
        res.status(401).json({ error: error.message });
    }

}
module.exports = requireAuth