const joi = require("joi");
const { validate } = require("../middleware/validate.middleware");

const userSchema = joi.object({
    first_name: joi.string().trim().required(),
    last_name: joi.string().trim().required(),
    email: joi.string().email().trim().required(),
    // phone_number: joi.string().trim().min(8).max(15).required(),
    gender: joi.string().trim().valid("male", "female", "other").required(),
    password: joi.string().trim().min(8).pattern(new RegExp('^[a-zA-Z0-9]{8,20}$')).required()
    .messages({
        'string.pattern.base': 'Password must be 8-20 characters long and contain only letters and numbers.'
    })
})

const loginSchema = joi.object({
    email: joi.string().trim().email().required(),
    password: joi.string().trim().min(8).pattern(new RegExp('^[a-zA-Z0-9]{8,20}$')).required()
    .messages({
        'string.pattern.base': 'Password must be 8-20 characters long and contain only letters and numbers.'
    })
})

const updateUserSchema = joi.object({
    first_name: joi.string().trim().required(),
    last_name: joi.string().trim().required(),
    email: joi.string().email().trim().required(),
    phone_number: joi.string().trim().min(8).max(15).required(),
    gender: joi.string().trim().valid("male", "female", "other").required(),
    marital_status: joi.string().trim().valid("married", "single", "divorced", "complicated").required(),
})

module.exports = {
        validatedUserSchema : validate(userSchema),
        validatedLoginSchema: validate(loginSchema),
        validatedUpdateUserSchema: validate(updateUserSchema)
}