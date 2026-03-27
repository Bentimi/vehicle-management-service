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

const vehicleActions = async (req, res, next) => {
    try {

        const method = req.method.toLowerCase();
        const vehicleId = req.params.id;
        const userId = req.user.id;

        const actions = {
            get: async () =>  await vehicleService.vehicleProfile(userId, vehicleId),
            put: async () => await vehicleService.updateVehicle(req.body, userId, vehicleId)
        }

        if (!actions[method]) return res.status(405).end();
        const result = await actions[method]();

        res.success(result, "vehicle profile")

    } catch (e) {
        next(e)
    }
}


module.exports = {
    register_vehicle,
    vehicleActions
}