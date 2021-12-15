require('rootpath')();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const errorHandler = require('_helpers/error-handler');


const usersRoutes = require('./app/routes/users.routes');
const webhooksRoutes = require('./app/routes/webhooks.routes');

const app = express();
let corsOptions = {
    origin: ["http://localhost:1024", "http://localhost:8080", "http://localhost:7884",
        "http://52.207.209.90:7884", "https://ontask-bridge-api.phiquest.com",
        "https://stag-ontask-bridge-api.phiquest.com",]
};
app.use(cors(corsOptions));
// parse requests of content-type - application/json
app.use(bodyParser.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(bodyParser.urlencoded({ extended: false }));

// const db = require("_helpers/db-interface");

// db.sequelize.sync();

dotenv.config({
  path: './config.env'
});

app.get('/test', (req, res) => res.send("Success!"));
app.get('/hello', (req, res) => res.send("World!"));
app.use('/users', usersRoutes);
app.use('/webhooks', webhooksRoutes);


app.use(errorHandler);

const kill = require('kill-port');
const PORT = process.env.PORT || 80;
kill(PORT, 'tcp')
    .then((status)=>{
      // set port, listen for requests

      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}.`);
      });

    }).catch(console.log);