// server.js
require('dotenv').config();
const express = require('express');
const routes = require('./routes');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/', routes);

app.listen(port, () => {
  console.log(`API lancée sur le port ${port}`);
});
