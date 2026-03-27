const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
    plate_number: {
        type: String,
        unique: true,
        required: true,
        uppercase: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    vehicle_description: {
        type: String,
        default: null
    },
    image: {
        type: String,
        default: null
    },
    vehicle_type: {
        type: String,
        enum: ["car", "bike", "bus", "truck"],
        default: null
    },
    color: {
        type: String,
        default: null
    },
    model: {
        type: String,
        default: null
    },
    qrCode: {
        type: String,
        default: null
    },
    isBlacklisted: {
        type: Boolean,
        default: false
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true,
    versionKey: false
})

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;