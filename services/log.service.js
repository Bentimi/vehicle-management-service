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

        const existingVehicle = await Vehicle.findById(data.vehicleId).session(session);

        if (!existingVehicle) {
            throw new AppError("Vehicle not found", 404)
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

const logHistory= async (vehicleId, userId, page, pageSize) => {
    const userAuth = await User.findById(userId);

    if (!userAuth.active) {
        throw new AppError("Account not active", 401)
    }

    if (userAuth.role === "user" || userAuth.role === "staff") {
        throw new AppError("Unauthorized user", 403)
    }

    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        throw new AppError("Invalid vehicle ID", 400)
    }

    const getLog = await Log.find({
        vehicle: vehicleId
    })
    .populate("user", "-password")
    .populate("vehicle")
    .populate("scannedBy", "-password")
    .sort({ entryTime: - 1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean()

    if (!getLog || getLog.length === 0) {
        throw new AppError("No log found", 404)
    }

    return { log: getLog }
}

module.exports = {
    checkVehicle,
    logHistory
}