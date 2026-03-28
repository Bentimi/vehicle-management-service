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
            put: async () => await vehicleService.updateVehicle(req.body, userId, vehicleId),
            patch: async () => await vehicleService.uploadVehicleImage(req.file, userId, vehicleId)
        }

         if (!actions[method]) {
            return res.status(405).json({
                status: false,
                message: "Method not allowed"
            });
        }

        const result = await actions[method]();

        if (method === 'put' || method === 'patch') {
            res.status(200).json({
                status: true,
                message: "Vehicle updated successfully",
                data: result
            });
        } else {
            res.success(result, "vehicle profile");
        }

    } catch (e) {
        console.log(e)
        next(e)
    }
}


module.exports = {
    register_vehicle,
    vehicleActions
}