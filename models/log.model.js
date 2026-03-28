const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vehicle",
        required: true
    },
    entryTime: {
        type: Date,
        default: Date.now
    },
    exitTime: {
        type: Date,
        default: null,
    },
    status: {
        type: String,
        enum: ["IN", "OUT"],
        default: "IN"
    },
    scannedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    duration: {
        type: Number,
        default: null
    }

}, {
    timestamps: true,
    versionKey: false
})

const Log = mongoose.model("Log", logSchema);
module.exports = Log;