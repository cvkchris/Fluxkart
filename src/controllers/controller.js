const db = require("../models/db")

async function insertContact(email, phoneNumber) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 2. Check for existing contact with matching email or phoneNumber
    const [existingRows] = await connection.execute(
      `SELECT * FROM Fluxkart
       WHERE (email = ? OR phoneNumber = ?)
         AND deletedAt IS NULL`,
        [email, phoneNumber]
    );

    if (existingRows.length === 0) {
      // 3. No match found → Insert as primary
      await connection.execute(
        `INSERT INTO Fluxkart (email, phoneNumber, linkPrecedence, createdAt, updatedAt)
         VALUES (?, ?, 'primary', NOW(), NOW())`,
        [email, phoneNumber]
      );
      console.log("Inserted new primary contact.");
    } else {
      // 4. Match found → Find the oldest (by createdAt)
      existingRows.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const primaryContact = existingRows[0];

      // If the current primaryContact is marked as secondary, promote the real primary
      const primaryId = primaryContact.linkPrecedence === 'primary'
        ? primaryContact.id
        : primaryContact.linkedId;

      await connection.execute(
        `INSERT INTO Fluxkart (email, phoneNumber, linkPrecedence, linkedId, createdAt, updatedAt)
         VALUES (?, ?, 'secondary', ?, NOW(), NOW())`,
        [email, phoneNumber, primaryId]
      );
      console.log(`Inserted as secondary contact linked to ID ${primaryId}.`);
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error("Error inserting contact:", error);
  } finally {
    connection.release();
  }
}

async function retrieveContacts(email, phoneNumber) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        const [existingRows] = await connection.execute(
        `SELECT * FROM Fluxkart
        WHERE (email = ? OR phoneNumber = ?)
        AND deletedAt IS NULL`,
        [email, phoneNumber]
        );

        if (existingRows.length === 0) {
            return {contact: null};
        }   

        existingRows.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const primary = existingRows.find(row => row.linkPrecedence === 'primary') || existingRows[0];
        const primaryId = primary.id;

        const [linkedContacts] = await connection.execute(
        `SELECT * FROM Fluxkart
        WHERE linkedId = ? AND deletedAt IS NULL`,
        [primaryId]
        );

        await connection.commit();

        const emails = new Set([primary.email]);
        const phoneNumbers = new Set([primary.phoneNumber]);
        const secondaryIds = [];

       

        for (const contact of linkedContacts) {
            if (contact.email ) {
                emails.add(contact.email);
            }
            if (contact.phoneNumber) {
                phoneNumbers.add(contact.phoneNumber);
            }
            if (contact.linkPrecedence === 'secondary') {
                secondaryIds.push(contact.id);
            }
        }

        return {
            contact: {
                primaryContactId: primaryId,
                emails: Array.from(emails),
                phoneNumbers: Array.from(phoneNumbers),
                secondaryContactIds: secondaryIds
            }
        };
    }
    catch (error) {
        await connection.rollback();
        console.error("Error retrieving contact:", error);
        return {contact: null};
    } finally {
        connection.release();
    }

}


module.exports = {insertContact, retrieveContacts};