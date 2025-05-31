const { insertContact, retrieveContacts } = require('../controllers/controller');

const identify = async function (req, res) {
    const {email, phoneNumber} = req.body;
    if (!email || !phoneNumber) {
        return res.status(400).json({ error: "Email and phone number is required" });
    }

    try{
        await insertContact(email, phoneNumber);
        const results = await retrieveContacts(email, phoneNumber);
        res.status(200).json(results);
    }
    catch (error) {
        console.error("Error in identify:", error);
        res.status(500).json({ error: "Internal server error" });
    }

}

module.exports = identify;
