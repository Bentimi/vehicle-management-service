const User = require('../models/user.model')
const bcrypt = require("bcryptjs");
require("dotenv").config();



const userSignUp = async (data) => {
    if (!data.first_name || !data.last_name || !data.email || !data.password) {
        throw new Error("All fields required", 400)
    }

    const existingEmail = await User.findOne({ email: data.email })

    if (existingEmail) {
        throw new Error("Email already exists", 409)
    }

    const hashedpwd = await bcrypt.hash(data.password, 10)

    const newUser = new User({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password: hashedpwd
    })

    await newUser.save();

}


module.exports = {
    userSignUp
}