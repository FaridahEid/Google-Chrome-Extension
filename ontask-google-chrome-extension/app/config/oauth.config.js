'use strict';
const { google } = require('googleapis');

const credentials = require('./credentials.json');
const Skyway = require('../models/db.model');

// Goggle credentials
const client_id = credentials.web.client_id;
const client_secret = credentials.web.client_secret;
const redirect_uris = credentials.web.redirect_uris;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[5]);

var email = "";

// Automatically refresh topen when it's about to expire
oAuth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token && tokens.refresh_token != null) {
        // Store the refresh_token in my database!
        Skyway.updateRefreshToken(email, tokens.refresh_token, (err, _) => {
            if (err) return console.log(err);
            else {
                console.log("Successfully updated refresh token.");			}
        });
    }
    Skyway.updateToken(email, tokens, (err, _) => {
        if (err) console.log(err);
        else {
            console.log("Successfully updated token.");
        }
    });
});

exports.email = email;
module.exports = oAuth2Client;
