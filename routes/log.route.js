const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth.middleware");
const logController = require("../controller/log.controller");

router.post('/scan', requireAuth, logController.check_vehicle);
router.get('/:id', requireAuth, logController.log_history);

module.exports = router;