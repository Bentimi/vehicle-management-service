const User = require('../models/user.model')
const bcrypt = require("bcryptjs");
const AppError = require('../utils/AppError.utils');
const { generateRegNumber } = require('../utils/generateNumbers.utils');
const { normalizePhoneNumber } = require('../utils/normalization.utils');
require("dotenv").config();



const userSignUp = async (data) => {
    if (!data.first_name || !data.last_name || !data.email || !data.password || !data.gender) {
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
        gender: data.gender,
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

    if (!user) {
        throw new AppError("Invalid creadentials", 404)
    }

    if (!user.active) {
        throw new AppError("Account not active", 403)
    }

    const comparedPassword = await bcrypt.compare(data.password, user.password)

    if (!comparedPassword) {
        throw new AppError("Invalid credentials", 401)
    }

    const updateUserLogin = await User.findByIdAndUpdate(
        user._id,
        {
            last_login: new Date()
        }
    )

    const userData = user.toObject();
    delete userData.password;

    return { user: userData };
}

const getUsers = async (page, pageSize, search, userId) => {
    const userAuth = await User.findById(userId)

    if (!userAuth.active) {
        throw new AppError('Account is not active', 401)
    }

    if (userAuth.role === "user" || userAuth.role === "staff") {
        throw new AppError("Unauthorized user", 403)
    }

    const query = {};
    if (search) {
        query.$or = [
            { first_name: { $regex: search, $options: 'i' } },
            { last_name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { reg_number: { $regex: search, $options: 'i' } }
        ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .select('-password')
    .lean()

    return { users, total };
}

const userProfile = async (userId, targetId) => {
    const userAuth = await User.findById(userId);

    if (!userAuth.active) {
        throw new AppError("Account is not activated", 401);
    }

    if (String(userAuth._id) !== String(targetId) && userAuth.role !== "admin" && userAuth.role !== "cso") {
        throw new AppError("Unauthorized user", 403);
    } 

    const user = await User.findById(targetId);

    if (!user) {
        throw new AppError("User not found", 400)
    }

    return user;
}

const updateProfile = async (userId, targetId, data) => {
    const userAuth = await User.findById(userId);

    if (!userAuth.active) {
        throw new AppError("Account is not activated", 401);
    }

    if (String(userAuth._id) !== String(targetId) && userAuth.role !== "admin" && userAuth.role !== "cso") {
        throw new AppError("Unauthorized user", 403);
    } 

    if (!data.first_name || !data.last_name || !data.email) {
        throw new AppError("First name, last name, and email are required", 400);
    }

    const updatedUser = await User.findByIdAndUpdate(
        targetId,
        {
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone_number: normalizePhoneNumber(data.phone_number),
            gender: data.gender,
            marital_status: data.marital_status
        },
        { returnDocument: "after" }
    )

    if (!updatedUser) {
        throw new AppError("user not found", 400)
    }

    return { user: updatedUser }
}

const changePassword = async (userId, targetId, data) => {
    const userAuth = await User.findById(userId);

    if (!userAuth.active) {
        throw new AppError("Account is not activated", 401);
    }

    if (!data.oldPassword || !data.newPassword) {
        throw new AppError("Old and new passwords are required", 400);
    }

    const user = await User.findById(targetId);
    if (!user) {
        throw new AppError("User not found", 404);
    }

    const isMatch = await bcrypt.compare(data.oldPassword, user.password);
    if (!isMatch) {
        throw new AppError("Current password is incorrect", 400);
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    const samplePasswordCheck = await bcrypt.compare(data.newPassword, user.password);
    if (samplePasswordCheck) {
        throw new AppError("New password cannot be the same as the old password", 400);
    }

    user.password = hashedPassword;
    await user.save();

    return user;

}

const roleAllocation = async (userId, targetId, data) => {
    console.log('Role allocation service called');
    console.log('User ID:', userId);
    console.log('Target ID:', targetId);
    console.log('Data:', data);

    const userAuth = await User.findById(userId);

    if (!userAuth.active) {
        throw new AppError("Account is not activated", 401);
    }

    if (userAuth.role !== "admin") {
        throw new AppError("Unauthorized user", 403);
    }

    if (String(userAuth._id) === String(targetId)) {
        throw new AppError("Admin cannot change their own role", 400);
    }

    console.log('Target ID:', targetId);

    const user = await User.findById(targetId);
    console.log('User', user)
    if (!user) {
        throw new AppError("User not found", 404);
    }

    user.role = data.role;
    await user.save();

    return user;

}

module.exports = {
    userSignUp,
    userLogin,
    getUsers,
    userProfile,
    updateProfile,
    changePassword,
    roleAllocation
}