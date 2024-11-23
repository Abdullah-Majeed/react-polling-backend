const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');

const Schema = mongoose.Schema;
const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    }
})

userSchema.statics.signup = async function (email, password) {
    if (!email || !password) {
        throw Error("Please add an email or password");
    }
    if (!validator.isEmail(email)) {
        throw Error("Email not valid");
    }
    if (!validator.isStrongPassword(password)) {
        throw Error("Password not strong enough");
    }
    const exist = await this.findOne({ email });

    if (exist) {
        throw Error("Email already in use");
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt)

    const user = await this.create({ email, password: hash });
    return user;


}
userSchema.statics.login = async function (email, password) {
    if (!email || !password) {
        throw Error('Please add an email or password');
    }
    const user = await this.findOne({ email });
    
    if (!user) {
        throw Error('User not found');
    }
    const match = bcrypt.compare(password, user.password);
    if (!match) {
        throw Error('Password mismatch');
    }
    return user;
}
module.exports = mongoose.model('User', userSchema);