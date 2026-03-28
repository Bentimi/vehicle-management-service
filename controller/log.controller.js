const logService = require("../services/log.service");

const check_vehicle = async (req, res, next) => {
    try {
        data = req.body;
        userId = req.user.id
        const result = await logService.checkVehicle(data, userId);
        res.success(result, "Vehicle successfully checked")
    } catch (e) {
        console.log(e)
        next(e)
    }
}

module.exports = {
    check_vehicle
}