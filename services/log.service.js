const User = require("../models/user.model");
const Vehicle = require("../models/vehicle.model");
const Log = require("../models/log.model");
const AppError = require("../utils/AppError.utils");
const mongoose = require("mongoose");

const checkVehicle = async (data, userId) => {
    const userAuth = await User.findById(userId);

    if (!userAuth.active) {
        throw new AppError("Account not active", 401)
    }

    if (userAuth.role === "staff" || userAuth.role === "user") {
        throw new AppError("Unauthorized user", 403)
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let vehicleIdentifier = data.vehicleId;

        // If the scanned data is a JSON string, extract the actual ID
        if (typeof vehicleIdentifier === 'string' && vehicleIdentifier.trim().startsWith('{')) {
            try {
                const parsed = JSON.parse(vehicleIdentifier);
                if (parsed.vehicleId) {
                    vehicleIdentifier = parsed.vehicleId;
                }
            } catch (err) {
                // Not valid JSON, keep it as is
            }
        }

        console.log(vehicleIdentifier)
        
        let existingVehicle;
        if (mongoose.Types.ObjectId.isValid(vehicleIdentifier)) {
            existingVehicle = await Vehicle.findById(vehicleIdentifier).session(session);
        } else {
            existingVehicle = await Vehicle.findOne({ plate_number: vehicleIdentifier }).session(session);
        }

        if (!existingVehicle) {
            throw new AppError("Vehicle not found", 404)
        }

        if (existingVehicle.isBlacklist) {
            throw new AppError("Vehicle was blacklisted", 403)
        }

        const recentLog = await Log.findOne(
            { 
                vehicle: existingVehicle._id,
                exitTime: null
             }).session(session);

        let log;
        if (!recentLog) {
            log = new Log({
                vehicle: existingVehicle._id,
                user: existingVehicle.user,
                entryTime: new Date(),
                status: "IN",
                scannedBy: userAuth._id
            })

            await log.save({ session })
        } else{
            const exitTime = new Date();
            console.log(`Entry Time ${recentLog.entryTime}`);
            // const entryTime = new Date(recentLog.entryTime);
            const duration = Math.floor(
                (exitTime - recentLog.entryTime) / (1000 * 60)
            );
            console.log(duration)
            recentLog.status = "OUT";
            recentLog.duration = duration
            recentLog.scannedBy = userAuth._id
            recentLog.exitTime = exitTime
            await recentLog.save({ session })
            log = recentLog;
        }

        await session.commitTransaction();
        return log;

    } catch (e) {
        if (session.inTransaction()) {
            await session.abortTransaction()
        }
        console.log(e)
        throw new AppError("Vehicle checking failed", 400)
    } finally {
        await session.endSession()
    }
}

const logHistory = async (vehicleId, userId, page, pageSize, search = "") => {
    const userAuth = await User.findById(userId);

    if (!userAuth || !userAuth.active) {
        throw new AppError("Account not active", 401)
    }

    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        throw new AppError("Invalid vehicle ID", 400)
    }

    // Role-based access control
    if (userAuth.role === "user" || userAuth.role === "staff") {
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle || vehicle.user.toString() !== userId) {
            throw new AppError("Unauthorized user", 403)
        }
    }

    let query = { vehicle: vehicleId };
    if (search) {
        query.status = { $regex: search, $options: 'i' };
    }

    const getLog = await Log.find(query)
    .populate("user", "-password")
    .populate("vehicle")
    .populate("scannedBy", "-password")
    .sort({ entryTime: - 1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean()

    const total = await Log.countDocuments(query);
    return { log: getLog, total };
}

const getAllLogs = async (page = 1, pageSize = 10, userId, search = "") => {
    const userAuth = await User.findById(userId);

    if (!userAuth || !userAuth.active) {
        throw new AppError("Account not active", 401);
    }

    if (userAuth.role === "user" || userAuth.role === "staff") {
        throw new AppError("Unauthorized user", 403);
    }

    let query = {};
    if (userAuth.role === "user" || userAuth.role === "staff") {
        query.user = userAuth._id;
    }

    if (search) {
        // To search across populated fields like user or vehicle in Mongoose without aggregates,
        // we first find the matching users or vehicles.
        const matchingUsers = await User.find({
            $or: [
                { first_name: { $regex: search, $options: 'i' } },
                { last_name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        }).select('_id');
        const userIds = matchingUsers.map(u => u._id);

        const matchingVehicles = await Vehicle.find({
            $or: [
                { plate_number: { $regex: search, $options: 'i' } }
            ]
        }).select('_id');
        const vehicleIds = matchingVehicles.map(v => v._id);

        query = {
            $or: [
                { user: { $in: userIds } },
                { vehicle: { $in: vehicleIds } },
                { status: { $regex: search, $options: 'i' } }
            ]
        };
    }

    const logs = await Log.find(query)
        .populate("user", "email phone_number first_name last_name")
        .populate("vehicle", "plate_number vehicle_type model qrCode image")
        .populate("scannedBy", "first_name last_name")
        .sort({ entryTime: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean();

    const total = await Log.countDocuments(query);

    return { logs, total, page: parseInt(page), pageSize: parseInt(pageSize) };
};

module.exports = {
    checkVehicle,
    logHistory,
    getAllLogs
}