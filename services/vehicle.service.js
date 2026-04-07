const Vehicle = require("../models/vehicle.model");
const User = require("../models/user.model");
const AppError = require("../utils/AppError.utils");
const mongoose = require("mongoose");
const cloudinary = require("../config/cloudinary");
const QRCode = require("qrcode");
const Log = require("../models/log.model");
const { normalizePhoneNumber } = require("../utils/normalization.utils");


const registerVehicle = async (data, userId) => {
    
    const userAuth = await User.findById(userId);

    let existingUser;

    if (!userAuth.active) {
        throw new AppError("Account not active", 401);
    }

    if (!data.plate_number || !data.vehicle_description || !data.vehicle_type || !data.color || !data.model) {
        throw new AppError("All fields required", 400);
    }
    
    if (userAuth.role === "admin" || userAuth.role === "cso") {
        if (!data.user) throw new AppError("Vehicle owner required", 400);
        
        const isEmail = data.user.includes('@');
        const lookupValue = isEmail ? data.user.trim() : normalizePhoneNumber(data.user);
        
        existingUser = await User.findOne({
            $or: [
                { email: lookupValue },
                { phone_number: lookupValue }
            ]
        });
    } else {
        existingUser = userAuth;
    }

    if (!existingUser) {
        throw new AppError("Invalide user credentials", 404);
    }

    // Prevent duplicate plate numbers
    const duplicatePlate = await Vehicle.findOne({ plate_number: data.plate_number });
    if (duplicatePlate) {
        throw new AppError("A vehicle with this plate number already exists", 409);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const newVehicle = new Vehicle({
            plate_number: data.plate_number,
            user: existingUser._id,
            vehicle_description: data.vehicle_description,
            vehicle_type: data.vehicle_type,
            color: data.color,
            model: data.model,
            created_by: userAuth._id
        });

        await newVehicle.save({ session });

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
        await newVehicle.save({ session });

        await session.commitTransaction();

        return { data: newVehicle };
    } catch (e) {
       if (session.inTransaction()) {
            await session.abortTransaction();
        }
        console.error("Register Error:", e);
        throw new AppError(`Vehicle registration failed: ${e.message}`, 400);
    } finally {
        session.endSession();
    }
}

const vehicleProfile = async (userId, vehicleId) => {
    const userAuth = await User.findById(userId);

    if (!userAuth.active) {
        throw new AppError("Account not active", 401);
    }

    // Ownership check happens after fetching the vehicle

    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        throw new AppError("Invalid vehicle ID", 400);
    }

    const vehicle = await Vehicle.findById(vehicleId).populate("user", "email phone_number fist_name last_name");

    if (!vehicle) {
        throw new AppError("Vehicle not found", 404);
    }

    if (userAuth.role === "staff" || userAuth.role === "user") {
        if (String(vehicle.user._id) !== String(userId)) {
            throw new AppError("Unauthorized user", 403);
        }
    }

    return vehicle;
};

const updateVehicle = async (data, userId, vehicleId) => { 

    const userAuth = await User.findById(userId);

    if (!userAuth.active) {
        throw new AppError("Account not active", 401);
    }

    // Ownership check happens after fetching the vehicle

    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        throw new AppError("Invalid vehicle ID", 400);
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
        throw new AppError("Vehicle not found", 404);
    }

    if (userAuth.role === "staff" || userAuth.role === "user") {
        if (String(vehicle.user) !== String(userId)) {
            throw new AppError("Unauthorized user", 403);
        }
    }

    if (vehicle.isBlacklisted) {
        throw new AppError("Vehicle was blacklisted", 403)
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
        vehicleId,
        {
            plate_number: data.plate_number,
            vehicle_description: data.vehicle_description,
            vehicle_type: data.vehicle_type,
            color: data.color,
            model: data.model
        },
        {
            new : true,
            runValidators: true
        }
    ).session(session)

    const qrPayload = JSON.stringify({
        vehicleId: updatedVehicle._id,
        plate_number: updatedVehicle.plate_number,
        vehicle_type: updatedVehicle.vehicle_type,
        model: updatedVehicle.model,
        color: updatedVehicle.color,
        owner: updatedVehicle.user
    });

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
        errorCorrectionLevel: "H",
        type: "image/png",
        margin: 2,
        width: 300
    });

    const uploadedQrCode = await cloudinary.uploader.upload(qrDataUrl, {
        folder: "vehicle_qrcodes",
        public_id: `qrcode_${updatedVehicle._id}`,
        resource_type: "image"
    });

    updatedVehicle.qrCode = uploadedQrCode.secure_url;
    await updatedVehicle.save({ session });

    await session.commitTransaction();
    session.endSession();

    return { user: updatedVehicle }

    } catch (e) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        console.log(e)
        throw new AppError("Failed to update", 400)
    } finally {
        session.endSession();
    }

};

const uploadVehicleImage = async (data, userId, vehicleId) => {

    const userAuth = await User.findById(userId);

    if (!userAuth.active) {
        throw new AppError("Account not active", 401)
    }

    // Ownership check happens after fetching the vehicle

    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        throw new AppError("Invalid vehicle ID", 400)
    }

    const existingVehicle = await Vehicle.findById(vehicleId);

    if (!existingVehicle) {
        throw new AppError("Vehicle not found", 404);
    }

    if (userAuth.role === "staff" || userAuth.role === "user") {
        if (String(existingVehicle.user) !== String(userId)) {
            throw new AppError("Unauthorized user", 403);
        }
    }

    if (existingVehicle.isBlacklisted) {
        throw new AppError("Vehicle was blacklisted", 403);
    }

    if (!data) {
        throw new AppError("No file selected", 400)
    }

    const uploadedImage = await cloudinary.uploader.upload(data.path, {
        folder: 'vehicle_images',
        public_id: `vehicle_${existingVehicle._id}`,
        resorce_type: "image"
    })

    existingVehicle.image = uploadedImage.secure_url;
    await existingVehicle.save();

    return { vehicle: existingVehicle }
}

const vehicleBlackList = async (userId, vehicleId) => {
    const userAuth = await User.findById(userId);

    if (!userAuth.active) {
        throw new AppError("Account not active", 401)
    }

    if (userAuth.role === "staff" || userAuth.role === "user") {
        throw new AppError("Unauthorized user", 403);
    }

    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        throw new AppError("Invalid vehicle ID", 400)
    }

    const existingVehicle = await Vehicle.findById(vehicleId)

    if (userAuth._id === existingVehicle._id) {
        throw new AppError("Unauthorized user", 403)
    }

    if (!existingVehicle) {
        throw new AppError("Vehicle not found", 404)
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        let updatedData;

        if (existingVehicle.isBlacklisted) {
            existingVehicle.isBlacklisted = false;
            await existingVehicle.save({ session })
            updatedData = existingVehicle;
        } else {
            existingVehicle.isBlacklisted = true;
            await existingVehicle.save({ session })
            updatedData = existingVehicle;
        }

        await session.commitTransaction();

        return { data: updatedData };

    } catch (e) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        console.log(e);
        throw new AppError("Vehicle status failed to update", 400)
    } finally {
        await session.endSession();
    }
}

const getAllVehicles = async (page = 1, pageSize = 10, userId, search = "", ownerId = null) => {
    const userAuth = await User.findById(userId);

    if (!userAuth || !userAuth.active) {
        throw new AppError("Account not active", 401);
    }

    let query = {};
    if (userAuth.role !== "admin" && userAuth.role !== "cso") {
        // Users and staff can only see their own vehicles
        query.user = userId;
    } else if (ownerId) {
        // Admins viewing a specific profile
        query.user = ownerId;
    }

    if (search) {
        const isEmailSearch = search.includes('@');
        const normalizedSearch = isEmailSearch ? search.trim() : normalizePhoneNumber(search);
        
        const matchingUsers = await User.find({
            $or: [
                { email: { $regex: search, $options: 'i' } },
                { phone_number: { $regex: normalizedSearch, $options: 'i' } }
            ]
        }).select('_id');
        const userIds = matchingUsers.map(u => u._id);
        
        // If a user is only querying for their own vehicles, preserve that $and
        if (query.user) {
            query = {
                $and: [
                    { user: query.user },
                    { $or: [
                        { plate_number: { $regex: search, $options: 'i' } }
                    ]}
                ]
            };
        } else {
            query.$or = [
                { plate_number: { $regex: search, $options: 'i' } },
                { user: { $in: userIds } }
            ];
        }
    }

    const vehicles = await Vehicle.find(query)
        .populate("user", "email phone_number first_name last_name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean();

    const populatedVehicles = await Promise.all(vehicles.map(async (v) => {
        const lastLog = await Log.findOne({ vehicle: v._id }).sort({ entryTime: -1 }).select('entryTime exitTime').lean();
        return {
            ...v,
            lastEntry: lastLog ? lastLog.entryTime : null,
            lastExit: lastLog ? lastLog.exitTime : null
        };
    }));

    const total = await Vehicle.countDocuments(query);

    return { vehicles: populatedVehicles, total, page: parseInt(page), pageSize: parseInt(pageSize) };
};

module.exports = {
    registerVehicle,
    vehicleProfile,
    updateVehicle,
    uploadVehicleImage,
    vehicleBlackList,
    getAllVehicles
}