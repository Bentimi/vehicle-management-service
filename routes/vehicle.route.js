const express = require("express");
const router = express.Router();
const vehicleController = require("../controller/vehicle.controller")
const { requireAuth } = require("../middleware/auth.middleware");
const validatedVehicle = require("../utils/vehicleDatavalidation.utils");
const upload = require("../config/multer");
const { 
    authenticatedLimiter, 
    dataUploadLimiter 
    } = require("../middleware/rateLimit.middleware");

router.post('/register', requireAuth, authenticatedLimiter, validatedVehicle.validatedVehicleSchema, vehicleController.register_vehicle),
router.route('/:id')
.get(requireAuth, authenticatedLimiter, vehicleController.vehicleActions)
.put(requireAuth, authenticatedLimiter, validatedVehicle.validatedUpdateVehicleSchema, vehicleController.vehicleActions)
.patch(requireAuth, dataUploadLimiter, validatedVehicle.validatedVehicleImage, upload.single('image'), vehicleController.vehicleActions)
router.put('/status/:id', requireAuth, vehicleController.vehicle_blacklist);

router.get('/', requireAuth, authenticatedLimiter, vehicleController.get_vehicles);

module.exports = router;