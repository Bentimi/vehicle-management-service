const express = require("express");
const router = express.Router();
const userController = require("../controller/user.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const validatedUser = require("../utils/userDatavalidation.utils");
const { 
    signUpLimiter, 
    signInLimiter, 
    authenticatedLimiter 
    } = require("../middleware/rateLimit.middleware");


router.post('/signup', signUpLimiter, validatedUser.validatedUserSchema, userController.user_signUp);
router.post('/login', signInLimiter, validatedUser.validatedLoginSchema, userController.user_login);
router.post('/logout', authenticatedLimiter, userController.user_logout);
router.post('/refresh', userController.refresh_token);

router.get('/me', requireAuth, authenticatedLimiter, userController.get_me);
router.get('/get-users', requireAuth, authenticatedLimiter, userController.get_users);

router.put('/change-password/:id', requireAuth, authenticatedLimiter, validatedUser.validatedChangePasswordSchema, userController.change_password);
router.put('/allocate-role/:id', requireAuth, authenticatedLimiter, validatedUser.validatedRoleAllocationSchema, userController.role_allocation);

router.route('/:id')
.get(requireAuth, authenticatedLimiter, userController.userActions)
.put(requireAuth, authenticatedLimiter, validatedUser.validatedUpdateUserSchema, userController.userActions)

module.exports = router;