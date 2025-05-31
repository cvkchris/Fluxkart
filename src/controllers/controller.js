const db = require("../models/db");

async function insertContact(email, phoneNumber) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Check for existing contact with matching email or phoneNumber
    const [existingRows] = await connection.execute(
        `SELECT * FROM Fluxkart
        WHERE (email = ? OR phoneNumber = ?)
        AND deletedAt IS NULL`,
        [email, phoneNumber]
    );

    if (existingRows.length === 0) {
      // 2. No match found → Insert as primary
      await connection.execute(
        `INSERT INTO Fluxkart (email, phoneNumber, linkPrecedence, createdAt, updatedAt)
         VALUES (?, ?, 'primary', NOW(), NOW())`,
        [email, phoneNumber]
      );
      console.log("Inserted new primary contact.");
    } else {

      // 3. Match found → Find the oldest (by createdAt)
      existingRows.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      const primaryContact = existingRows[0];

      if (primaryContact.email === email && primaryContact.phoneNumber === phoneNumber) {
        // 4. Exact match found → No action needed
        await connection.execute(
          `UPDATE Fluxkart
           SET updatedAt = NOW()
           WHERE id = ?`,
          [primaryContact.id]
        );
        console.log("Exact match found, no action needed.");
      }else {
        // 5. If the current primaryContact is marked as secondary, promote the real primary
        const primaryId =
            primaryContact.linkPrecedence === "primary"
            ? primaryContact.id
            : primaryContact.linkedId;

        await connection.execute(
            `INSERT INTO Fluxkart (email, phoneNumber, linkPrecedence, linkedId, createdAt, updatedAt)
            VALUES (?, ?, 'secondary', ?, NOW(), NOW())`,
            [email, phoneNumber, primaryId]
        );
      console.log(`Inserted as secondary contact linked to ID ${primaryId}.`);
    }
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
    // 1. Check for existing contact with matching email or phoneNumber
    const [existingRows] = await connection.execute(
      `SELECT * FROM Fluxkart
        WHERE (email = ? OR phoneNumber = ?)
        AND deletedAt IS NULL`,
      [email, phoneNumber]
    );

    // 2. If no match found, return null
    if (existingRows.length === 0) {
      return { contact: null };
    }

    // 3. If match found, sort by createdAt and find primary contact
    existingRows.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const primary =
      existingRows.find((row) => row.linkPrecedence === "primary") ||
      existingRows[0];
    const primaryId = primary.id;

    // 4. Retrieve all linked contacts for the primary contact
    const [linkedContacts] = await connection.execute(
      `SELECT * FROM Fluxkart
        WHERE linkedId = ? AND deletedAt IS NULL`,
      [primaryId]
    );

    await connection.commit();

    // 5. Collect emails, phone numbers, and secondary contact IDs
    const emails = new Set([primary.email]);
    const phoneNumbers = new Set([primary.phoneNumber]);
    const secondaryIds = [];

    for (const contact of linkedContacts) {
      if (contact.email) {
        emails.add(contact.email);
      }
      if (contact.phoneNumber) {
        phoneNumbers.add(contact.phoneNumber);
      }
      if (contact.linkPrecedence === "secondary") {
        secondaryIds.push(contact.id);
      }
    }

    // 6. Return the contact object in json format
    return {
      contact: {
        primaryContactId: primaryId,
        emails: Array.from(emails),
        phoneNumbers: Array.from(phoneNumbers),
        secondaryContactIds: secondaryIds,
      },
    };
  } catch (error) {
    await connection.rollback();
    console.error("Error retrieving contact:", error);
    return { contact: null };
  } finally {
    connection.release();
  }
}

module.exports = { insertContact, retrieveContacts };
