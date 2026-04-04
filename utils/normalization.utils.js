const normalizePhoneNumber = (phone) => {
    if (!phone) return phone;
    
    let normalized = phone.trim();
    
    // Remove +234
    if (normalized.startsWith('+234')) {
        normalized = normalized.substring(4);
    }
    // Remove 234 (if entered without +)
    else if (normalized.startsWith('234') && normalized.length > 10) {
        normalized = normalized.substring(3);
    }
    // Remove leading 0
    else if (normalized.startsWith('0')) {
        normalized = normalized.substring(1);
    }
    
    return normalized;
};

module.exports = {
    normalizePhoneNumber
};
