const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    signIn_Date: {
        type: Date,
        default: null
    },
    signOut_Date: {
        type: Date,
        default: null
    }

}, {
    timestamps: true,
    versionKey: false
})

const Log = mongoose.model("Log", logSchema);
module.exports = Log;