# Fluxkart Contact Identification API

A Node.js + Express backend API for managing and identifying contacts, using MySQL as the database.

## Features

- Add new contacts or link to existing ones based on email/phone.
- Retrieve all linked contacts for a given email or phone number.
- Uses MySQL transactions for data consistency.
- Environment-based configuration for easy deployment.

## Project Structure

```
Fluxkart/
├── src/
│   ├── app.js
│   ├── controllers/
│   │   └── controller.js
│   ├── models/
│   │   └── db.js
│   ├── routes/
│   │   └── route.js
│   └── config/
│       └── database.js (optional, if you want config file)
├── .env
├── package.json
└── Readme.md
```

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- MySQL server

### Installation

1. **Clone the repository:**
   ```sh
   git clone <repo-url>
   cd Fluxkart
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Configure environment variables:**

   Create a `.env` file in the root directory:

   ```
   HOST=localhost
   USER=<your_mysql_user>
   PASSWORD=<your_mysql_password>
   DATABASE=fluxkart
   DB_PORT=3306
   PORT=3000
   ```

4. **Set up the MySQL database:**

   Create the database and table:

   ```sql
   CREATE DATABASE IF NOT EXISTS fluxkart;

   USE fluxkart;

   CREATE TABLE IF NOT EXISTS Fluxkart (
     id INT AUTO_INCREMENT PRIMARY KEY,
     email VARCHAR(255),
     phoneNumber VARCHAR(20),
     linkedId INT DEFAULT NULL,
     linkPrecedence ENUM('primary', 'secondary') DEFAULT 'primary',
     createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
     updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     deletedAt DATETIME DEFAULT NULL
   );
   ```

5. **Start the server:**
   ```sh
   npm start
   ```
   The server will run on the port specified in your `.env` (default: 3000).

## API Endpoints

### `POST /identify`

**Request Body:**
```json
{
  "email": "user@example.com",
  "phoneNumber": "1234567890"
}
```

**Response:**
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["user@example.com"],
    "phoneNumbers": ["1234567890"],
    "secondaryContactIds": [2, 3]
  }
}
```

## Troubleshooting

- **ETIMEDOUT or Connection Errors:**  
  Ensure your MySQL server is running, accessible, and the credentials in `.env` are correct.  
  If using Docker or a remote DB, check network/firewall settings.

- **Access Denied Errors:**  
  Double-check your MySQL username and password in the `.env` file.

- **Environment Variables Not Loading:**  
  Make sure `require('dotenv').config();` is at the top of your `app.js` and `db.js`.

## Notes

- Make sure your MySQL credentials in `.env` are correct.
- The API uses transactions for insert and retrieval to ensure data consistency.

