const express = require("express");
const router = express.Router();
const userController = require("../controller/user.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const validatedUser = require("../utils/userDatavalidation.utils");


router.post('/signup', validatedUser.validatedUserSchema, userController.user_signUp);
router.post('/login', validatedUser.validatedLoginSchema, userController.user_login);
router.post('/logout', userController.user_logout);

router.get('/me', requireAuth, userController.get_me);
router.get('/get-users', requireAuth, userController.get_users);

router.put('/change-password/:id', requireAuth, validatedUser.validatedChangePasswordSchema, userController.change_password);
router.put('/allocate-role/:id', requireAuth, validatedUser.validatedRoleAllocationSchema, userController.role_allocation);

router.route('/:id')
.get(requireAuth, userController.userActions)
.put(requireAuth, validatedUser.validatedUpdateUserSchema, userController.userActions)

module.exports = router;