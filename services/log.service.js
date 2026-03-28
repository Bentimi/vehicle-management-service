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

module.exports = {
    checkVehicle
}