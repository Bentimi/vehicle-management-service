const User = require('../models/user.model');

const generateRegNumber = async () => {
    const year = new Date().getFullYear();
    
    const lastUser = await User.findOne({ 
        reg_number: new RegExp(`CAG-${year}-`) 
    }).sort({ createdAt: -1 });

    let nextNumber = 1;

    if (lastUser && lastUser.reg_number) {
        const parts = lastUser.reg_number.split('-');
        if (parts.length === 3) {
            nextNumber = parseInt(parts[2], 10) + 1;
        }
    }

    const paddedNumber = nextNumber.toString().padStart(4, '0');
    return `CAG-${year}-${paddedNumber}`;
};

module.exports = {
    generateRegNumber
};