const logService = require("../services/log.service");

const check_vehicle = async (req, res, next) => {
    try {
        const data = req.body;
        const userId = req.user.id
        const result = await logService.checkVehicle(data, userId);
        res.success(result, "Vehicle successfully checked")
    } catch (e) {
        // console.log(e)
        next(e)
    }
}

const log_history = async (req, res, next) => {
    try {
        const vehicleId = req.params.id;
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;

        const log = await logService.logHistory(vehicleId, userId, page, pageSize);

        res.success(log, "Vehicle logs retrieved");
    } catch (e) {
        // console.log(e)
        next(e);
    }
}

module.exports = {
    check_vehicle,
    log_history
}