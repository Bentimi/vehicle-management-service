const express = require("express");
const router = express.Router();
const userController = require("../controller/user.controller");


router.post('/signup', userController.user_signUp);
router.get('/get-users', userController.get_users)

module.exports = router;