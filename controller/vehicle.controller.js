const vehicleService = require("../services/vehicle.service");


const register_vehicle = async (req, res, next) => {
    try {
        const data = req.body;
        const userId = req.user.id;
        const vehicle = await vehicleService.registerVehicle(data, userId);
        res.status(201).json({
            status: "Success",
            message: "Vehicle added successfully",
            vehicle
        })
    } catch (e) {
        next(e);
    }
}


module.exports = {
    register_vehicle
}