const Vehicle = require("../models/vehicle.model");
const User = require("../models/user.model");
const AppError = require("../utils/AppError.utils");

const registerVehicle = async (data, userId) => {
    const userAuth = await User.findById(userId);

    if (!userAuth.active) {
        throw new AppError("Account not active", 401)
    }

    if (userAuth.role === "staff" || userAuth.role === "user") {
        throw new AppError("Unauthoeized user", 403)
    }

    


}

module.exports = {
    registerVehicle
}