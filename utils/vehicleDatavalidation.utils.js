const joi = require("joi");
const { validate } = require("../middleware/validate.middleware");

const vehicleSchema = joi.object({
    plate_number: joi.string().trim().required(),
    user: joi.string().trim().required(),
    vehicle_description: joi.string().trim().required(),
    vehicle_type: joi.string().trim().valid("car", "bike", "bus", "truck").required(),
    color: joi.string().trim().required(),
    model: joi.string().trim().required()
});

const updateVehicleSchema = joi.object({
    plate_number: joi.string().trim().required(),
    vehicle_description: joi.string().trim().required(),
    vehicle_type: joi.string().trim().valid("car", "bike", "bus", "truck").required(),
    color: joi.string().trim().required(),
    model: joi.string().trim().required()
});


module.exports = {
    validatedVehicleSchema: validate(vehicleSchema),
    validatedUpdateVehicleSchema: validate(updateVehicleSchema)
}