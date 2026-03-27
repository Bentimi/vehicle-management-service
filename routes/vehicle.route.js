const express = require("express");
const router = express.Router();
const vehicleController = require("../controller/vehicle.controller")
const { requireAuth } = require("../middleware/auth.middleware");
const validatedVehicle = require("../utils/vehicleDatavalidation.utils");

router.post('/register', requireAuth, validatedVehicle.validatedVehicleSchema, vehicleController.register_vehicle),
router.route('/:id')
.get(requireAuth, vehicleController.vehicleActions)
.put(requireAuth, validatedVehicle.validatedUpdateVehicleSchema, vehicleController.register_vehicle)


module.exports = router;