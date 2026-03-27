const Vehicle = require("../models/vehicle.model");
const User = require("../models/user.model");
const AppError = require("../utils/AppError.utils");
const mongoose = require("mongoose");

const registerVehicle = async (data, userId) => {
    const userAuth = await User.findById(userId);

    if (!userAuth.active) {
        throw new AppError("Account not active", 401)
    }

    if (userAuth.role === "staff" || userAuth.role === "user") {
        throw new AppError("Unauthorized user", 403)
    }

    if (!data.plate_number || !data.user || !data.vehicle_description || !data.vehicle_type || !data.color || !data.model) {
        throw new AppError("All fields required", 400)
    }

    const existingUser = await User.findOne({
        $or: [
            { email: data.user },
            { phone_number: data.user }
        ]
    });

    if (!existingUser) {
        throw new AppError("User not found", 400)
    }

    const newVehicle = new Vehicle({
        plate_number: data.plate_number,
        user: existingUser._id,
        vehicle_description: data.vehicle_description,
        vehicle_type: data.vehicle_type,
        color: data.color,
        model: data.model,
        created_by: userAuth._id
    })

    await newVehicle.save()

    return { vehicle: newVehicle }
}

const vehicleProfile = async (userId, vehicleId) => {
    const userAuth = await User.findById(userId);

    if (!userAuth.active) {
        throw new AppError("Account not active", 401)
    }

    if (userAuth.role === "staff" || userAuth.role === "user") {
        throw new AppError("Unauthorized user", 403)
    }

    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        throw new AppError("Vehicle not found", 400)
    }

    const vehicle = await Vehicle.findOne({
        _id: vehicleId,
        user: userId
    })

    if (!vehicle) {
        throw new AppError("Vehicle not found", 400)
    }

    return vehicle;
}

const updateVehicle = async (data, userId, vehicleId) => {
    const userAuth = await User.findById(userId);

    if (!userAuth.active) {
        throw new AppError("Account not active", 401)
    }

    if (userAuth.role === "staff" || userAuth.role === "user") {
        throw new AppError("Unauthorized user", 403)
    }

    if (!data.plate_number || !data.user || !data.vehicle_description || !data.vehicle_type || !data.color || !data.model) {
        throw new AppError("All fields required", 400)
    }
}

module.exports = {
    registerVehicle,
    vehicleProfile,
    updateVehicle
}