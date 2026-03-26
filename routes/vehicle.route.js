const express = require("express");
const router = express.Router();
const vehicleController = require("../controller/vehicle.controller")
const { requireAuth } = require("../middleware/auth.middleware");




module.exports = router;