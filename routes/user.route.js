const express = require("express");
const router = express.Router();
const userController = require("../controller/user.controller");
const { requireAuth } = require("../middleware/auth.middleware");


router.post('/signup', userController.user_signUp);
router.post('/login', userController.user_login);
router.post('/logout', userController.user_logout);
router.post('/refresh', userController.refresh_token);
router.get('/get-users', requireAuth, userController.get_users);
router.route('/:id')
.get(requireAuth, userController.userActions)
.put(requireAuth, userController.userActions)

module.exports = router;