const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth.middleware");
const logController = require("../controller/log.controller");
const validatedVehicleData = require("../utils/vehicleDatavalidation.utils")

router.post('/scan', requireAuth, validatedVehicleData.validatedScanningData, logController.check_vehicle);
router.get('/:id', requireAuth, logController.log_history);
router.get('/', requireAuth, logController.get_logs);

module.exports = router;