const { insertContact, retrieveContacts } = require('../controllers/controller');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9+\-\s()]{5,11}$/;

const identify = async function (req, res) {
    const { email, phoneNumber } = req.body;

    // Validate presence
    if (!email || !phoneNumber) {
        return res.status(400).json({ error: "Email and phone number are required" });
    }

    // Validate email format
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate phone number format
    if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({ error: "Invalid phone number format" });
    }

    try {
        await insertContact(email, phoneNumber);
        const results = await retrieveContacts(email, phoneNumber);
        res.status(200).json(results);
    } catch (error) {
        console.error("Error in identify:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = identify;
