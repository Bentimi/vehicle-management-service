const mongoose = require("mongoose");

const vehicleSchema = new mongoose.schema({
    vehicle_number: {
        type: String,
        unique: true,
        required: true
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
    }
}, {
    timestamps: true,
    versionKey: false
})

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;