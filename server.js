const express = require('express');
const app = express();
const Routes = require('./routes');

app.use(express.json());
app.use('/', Routes);

module.exports = app;