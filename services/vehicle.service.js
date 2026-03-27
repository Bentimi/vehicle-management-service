const Vehicle = require("../models/vehicle.model");
const User = require("../models/user.model");
const AppError = require("../utils/AppError.utils");
const mongoose = require("mongoose");
const cloudinary = require("../config/cloudinary");
const QRCode = require("qrcode");


const registerVehicle = async (data, userId) => {
    const userAuth = await User.findById(userId);

    if (!userAuth.active) {
        throw new AppError("Account not active", 401);
    }

    if (userAuth.role === "staff" || userAuth.role === "user") {
        throw new AppError("Unauthorized user", 403);
    }

    if (!data.plate_number || !data.user || !data.vehicle_description || !data.vehicle_type || !data.color || !data.model) {
        throw new AppError("All fields required", 400);
    }

    const existingUser = await User.findOne({
        $or: [
            { email: data.user },
            { phone_number: data.user }
        ]
    });

    if (!existingUser) {
        throw new AppError("User not found", 404);
    }

    // Prevent duplicate plate numbers
    const duplicatePlate = await Vehicle.findOne({ plate_number: data.plate_number });
    if (duplicatePlate) {
        throw new AppError("A vehicle with this plate number already exists", 409);
    }

    const newVehicle = new Vehicle({
        plate_number: data.plate_number,
        user: existingUser._id,
        vehicle_description: data.vehicle_description,
        vehicle_type: data.vehicle_type,
        color: data.color,
        model: data.model,
        created_by: userAuth._id
    });

    await newVehicle.save();

    try {
        const qrPayload = JSON.stringify({
            vehicleId: newVehicle._id,
            plate_number: newVehicle.plate_number,
            vehicle_type: newVehicle.vehicle_type,
            model: newVehicle.model,
            color: newVehicle.color,
            owner: existingUser._id
        });

        const qrDataUrl = await QRCode.toDataURL(qrPayload, {
            errorCorrectionLevel: "H",
            type: "image/png",
            margin: 2,
            width: 300
        });

        const uploadedQrCode = await cloudinary.uploader.upload(qrDataUrl, {
            folder: "vehicle_qrcodes",
            public_id: `qrcode_${newVehicle._id}`,
            resource_type: "image"
        });

        newVehicle.qrCode = uploadedQrCode.secure_url;
        await newVehicle.save();
    } catch (qrError) {
        await Vehicle.findByIdAndDelete(newVehicle._id);
        throw new AppError("Failed to generate or upload QR code. Vehicle registration rolled back.", 500);
    }

    return { data: newVehicle };
}

const vehicleProfile = async (userId, vehicleId) => {
    const userAuth = await User.findById(userId);

    if (!userAuth.active) {
        throw new AppError("Account not active", 401);
    }

    if (userAuth.role === "staff" || userAuth.role === "user") {
        throw new AppError("Unauthorized user", 403);
    }

    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        throw new AppError("Invalid vehicle ID", 400);
    }

    const vehicle = await Vehicle.findById(vehicleId).populate("user", "email phone_number");

    if (!vehicle) {
        throw new AppError("Vehicle not found", 404);
    }

    return vehicle;
};

const updateVehicle = async (data, userId, vehicleId) => {
    const userAuth = await User.findById(userId);

    if (!userAuth.active) {
        throw new AppError("Account not active", 401);
    }

    if (userAuth.role === "staff" || userAuth.role === "user") {
        throw new AppError("Unauthorized user", 403);
    }

    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        throw new AppError("Invalid vehicle ID", 400);
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
        throw new AppError("Vehicle not found", 404);
    }

};

const uploadVehicleImage = async (data, userId, vehicleId) => {

    const userAuth = await User.findById(userId);

    if (!userAuth.active) {
        throw new AppError("Account not active", 401)
    }

    if (userAuth.role === "staff" || userAuth.role === "user") {
        throw new AppError("Unauthorized user", 403)
    }

    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        throw new AppError("Invalid vehicle ID", 400)
    }

    const existingVehicle = await Vehicle.findById(vehicleId);

    if (!existingVehicle) {
        throw new AppError("Vehicle not found");
    }

    const uploadedImage = await cloudinary.uploader.upload(req.file.path, {
        folder: 'vehicle_images',
        public_id: `vehicle_${existingVehicle._id}`
    })

    existingVehicle.image = uploadedImage.secure_url;
    await existingVehicle.save();
}

module.exports = {
    registerVehicle,
    vehicleProfile,
    updateVehicle,
    uploadVehicleImage
}