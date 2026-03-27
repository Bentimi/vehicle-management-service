const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone_number: {
        type: String,
        index: {
            unique: true,
            partialFilterExpression: { phone_number: { $type: 'string' } }
        }
    },
    reg_number: {
        type: String,
        unique: true,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'security', 'cso', 'staff', 'admin'],
        default: 'user'
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'others'],
        default: null
    },
    marital_status: {
        type: String,
        enum: ['married', 'single', 'divorced', 'complicated'],
        default: null
    },
    last_login: {
        type: Date,
        default: null
    },
    active: {
        type: Boolean,
        default: true
    },
    password: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    versionKey: false
})


const User = mongoose.model('User', userSchema);

module.exports = User;