const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth.middleware");
const logController = require("../controller/log.controller")



module.exports = router;