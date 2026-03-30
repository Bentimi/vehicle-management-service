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
        const search = req.query.search || "";

        const log = await logService.logHistory(vehicleId, userId, page, pageSize, search);

        res.success(log, "Vehicle logs retrieved");
    } catch (e) {
        // console.log(e)
        next(e);
    }
}
const get_logs = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const page = req.query.page || 1;
        const pageSize = req.query.pageSize || 10;
        const search = req.query.search || "";
        
        const result = await logService.getAllLogs(page, pageSize, userId, search);
        res.success(result, "Logs successfully retrieved");
    } catch (e) {
        next(e);
    }
};

module.exports = {
    check_vehicle,
    log_history,
    get_logs
}