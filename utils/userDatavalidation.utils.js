const joi = require("joi");
const { validate } = require("../middleware/validate.middleware");

const userSchema = joi.object({
    first_name: joi.string().trim().required(),
    last_name: joi.string().trim().required(),
    email: joi.string().email().trim().required(),
    // phone_number: joi.string().trim().min(8).max(15).required(),
    gender: joi.string().trim().valid("male", "female", "other").required(),
    password: joi.string().trim()
    .min(8)
    .max(30)
    .required()
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])'))
    .messages({
      'string.pattern.base': 'Password must include uppercase, lowercase, number, and a special character (!@#$%^&*)',
    })
})

const loginSchema = joi.object({
    email: joi.string().trim().email().required(),
    password: joi.string().trim().required()
})

const updateUserSchema = joi.object({
    first_name: joi.string().trim().required(),
    last_name: joi.string().trim().required(),
    email: joi.string().email().trim().required(),
    phone_number: joi.string().trim().allow('', null).optional(),
    gender: joi.string().trim().valid("male", "female", "other").allow('', null).optional(),
    marital_status: joi.string().trim().valid("married", "single", "divorced", "complicated").allow('', null).optional(),
})

const changePasswordSchema = joi.object({
    oldPassword: joi.string().trim().required(),
    newPassword: joi.string().trim()
    .min(8)
    .max(30)
    .required()
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])'))
    .messages({
      'string.pattern.base': 'Password must include uppercase, lowercase, number, and a special character (!@#$%^&*)',
    })
})

const roleAllocationSchema = joi.object({
    role: joi.string().trim().valid("admin", "cso", "staff", "user").required()
})

module.exports = {
        validatedUserSchema : validate(userSchema),
        validatedLoginSchema: validate(loginSchema),
        validatedUpdateUserSchema: validate(updateUserSchema),
        validatedChangePasswordSchema: validate(changePasswordSchema),
        validatedRoleAllocationSchema: validate(roleAllocationSchema)
}