const express = require("express");
const router = express.Router();
const userController = require("../controller/user.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const validatedUser = require("../utils/userDatavalidation.utils");


router.post('/signup', validatedUser.validatedUserSchema, userController.user_signUp);
router.post('/login', validatedUser.validatedLoginSchema, userController.user_login);
router.post('/logout', userController.user_logout);
router.post('/refresh', userController.refresh_token);
router.get('/get-users', requireAuth, userController.get_users);
router.route('/:id')
.get(requireAuth, userController.userActions)
.put(requireAuth, validatedUser.validatedUpdateUserSchema, userController.userActions)

module.exports = router;