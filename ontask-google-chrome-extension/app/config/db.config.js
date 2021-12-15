/*const { database } = require('../../config.json')[process.env.NODE_ENV];

module.exports = {
  HOST: database.host,
  USER: database.user,
  PASSWORD: database.password,
  DB: database.schema,
  dialect: database.dialect,
  PORT: database.port,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};*/
//NOTE: IF BELOW DOES NOT WORK USE THE ABOVE COMMENTED CODE
'use strict';
const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'kabinger.ddns.net',
  port: '23307',
  user: 'skyway',
  password: 'MySkyway123!',
  database: 'skyway'
});

// Check connection to database
connection.connect(function (err) {
  if (err) {
    return console.error('error: ' + err.message);
  }

  console.log('Connected to the MySQL server.');
});

module.exports = connection;
