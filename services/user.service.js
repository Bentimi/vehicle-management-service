const User = require('../models/user.model')
const bcrypt = require("bcryptjs");
const AppError = require('../utils/AppError.utils');
const { generateRegNumber } = require('../utils/generateNumbers.utils');
require("dotenv").config();



const userSignUp = async (data) => {
    if (!data.first_name || !data.last_name || !data.email || !data.password) {
        throw new AppError("All fields required", 400)
    }

    const existingEmail = await User.findOne({ email: data.email })

    if (existingEmail) {
        throw new AppError("Email already exists", 409)
    }

    const hashedpwd = await bcrypt.hash(data.password, 10)

    const newUser = new User({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password: hashedpwd,
        reg_number: await generateRegNumber()
    })

    await newUser.save();
    
    const user = newUser.toObject();
    delete user.password;

    return user;
}


const userLogin = async (data) => {
    if (!data.email || !data.password) {
        throw new AppError("All fields required", 400);
    }

    const user = await User.findOne({
        email: data.email
    })

    if (!user.active) {
        throw new AppError("Account is deactivated", 403)
    }

    const comparedPassword = await bcrypt.compare(data.password, user.password)

    if (!comparedPassword) {
        throw new AppError("Invalid credentials", 401)
    }

    const userData = user.toObject();
    delete userData.password;

    return { user: userData };
}

const getUsers = async (page, pageSize, userId) => {
    const userAuth = await User.findById(userId)

    if (!userAuth.active) {
        throw new AppError('Account is not active', 401)
    }

    if (userAuth.role === "user" || userAuth.role === "staff") {
        throw new AppError("Unauthorized user", 403)
    }

    const users = await User.find({})
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .select('-password')
    .lean()

    return users;
}


module.exports = {
    userSignUp,
    userLogin,
    getUsers
}