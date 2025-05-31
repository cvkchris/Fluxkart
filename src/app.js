const express = require('express');
const bodyParser = require('body-parser');
const identify = require('./routes/route');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.post('/identify', identify); 

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});