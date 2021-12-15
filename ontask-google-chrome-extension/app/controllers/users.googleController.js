const { google } = require('googleapis');

const Skyway = require('../models/db.model');
const OAuth = require('../config/oauth.config');
const OnTaskAPI = require('../api/ontask.api');
const GoogleAPI = require('../api/google.api');
const { createToken } = require('../validation/jwtValidate');

// Google scope
const SCOPE = ['https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'];

exports.getAuthURL = (req, res) => {
    const authUrl = OAuth.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPE,
    });

    res.send(authUrl);
}

exports.callback = (req, res) => {
    if (req.query.code) {
        const code = req.query.code;

        OAuth.getToken(code, (err, token) => {
            if (err) {
                console.log('Error retrieving access token', err);
                return res.status(400).send('Error retrieving access token');
            } else {
                // Set credential to access assets
                OAuth.setCredentials(token);

                // Access Google asset
                const oauth2 = google.oauth2({ version: 'v2', auth: OAuth });
                oauth2.userinfo.get((err, response) => {
                    if (err) {
                        console.log('Error retrieving user info', err);
                        return res.status(400).send(err);
                    }
                    else {
                        OAuth.email = response.data.email;

                        // Generate user token
                        let user_token = createToken(response.data.email, token);
                        let new_user = false;

                        Skyway.getUserByEmail(response.data.email, (err, user) => {
                            if (err) return res.status(400).send(err);
                            else {
                                if (!(user && user.length)) {	// Add user to USER table if not already exist
                                    Skyway.addUser(response.data.email, response.data.given_name, response.data.family_name, token.refresh_token, token, (err, _) => {
                                        if (err) return res.status(400).send(err);
                                        else console.log("Successfully added a user.");
                                    });
    
                                    new_user = true;
                                }

                                res.redirect(`?token=${user_token}&new_user=${new_user}`);
                            }
                        });
                    }
                });
            }
        });
    } else {
        res.send("You're logged in. Please close this tab.");
    }
}

exports.uploadSignedDocument = (req, res) => {
    let unique_uid = req.params.uuid;

    let webhook_info, apiKey, user_token;
    // Get webhook info
    Skyway.getWebhookByUUID(unique_uid, (err, webhook) => {
        if (err) return res.status(400).send(err);
        else if (!(webhook && webhook.length)) {
            console.log("Webhook doesn't exist.");
            return res.status(400).send("Webhook doesn't exist.");
        } else {
            webhook_info = webhook[0];

            // Get API Key
            Skyway.getAPIKey_UserTokenByWfID(webhook_info.workflow_id, async (err, info) => {
                if (err) return res.status(400).send(err);
                else if (!(info && info.length)) {
                    console.log("API Key doesn't exist with given workflow ID.");
                    return res.status(400).send("API Key doesn't exist with given workflow ID.");
                } else {
                    apiKey = info[0].API_key;
                    user_token = JSON.parse(info[0].token);

                    // ======================================

                    let documentBuffer;
                    // Get signed document from OnTask
                    await OnTaskAPI.getDocument(req.body.wfVariables.myFile.documentId, apiKey, (err, document) => {
                        if (err) return res.status(400).send(err);
                        else documentBuffer = document;
                    });

                    // If the folder is not already existed
                    OAuth.setCredentials(user_token);
                    const drive = google.drive({ version: 'v3', auth: OAuth });

                    // Get folder ID (create if not already existed)
                    GoogleAPI.getDriveFolder(drive, 'Signed Document', (err, folderID) => {
                        if (err) return res.status(400).send(err);
                        else {
                            console.log("Successfully created a folder: ", folderID);
                            res.write("Successfully created a folder.");

                            // Add file to folder
                            GoogleAPI.addFileToFolder(drive, folderID, documentBuffer, 'APIDemoContract.pdf', (err, fileID) => {
                                if (err) return res.status(400).send(err);
                                else {
                                    console.log("Successfully added file to folder: ", fileID);
                                    res.write("Successfully added file to folder.");
                                }
                            });
                        }
                    });
                }
            });
        }
    });

    res.end();
}

exports.uploadOnTaskResultsToSheet = (req, res, next) => {
    let unique_uid = req.params.uuid;

    let webhook_info, user_token;
    // Get webhook info
    Skyway.getWebhookByUUID(unique_uid, (err, webhook) => {
        if (err) next(err);
        else if (!(webhook && webhook.length)) {
            console.log("Webhook doesn't exist.");
            next("Webhook doesn't exist.");
        } else {
            webhook_info = webhook[0];

            // Get API Key
            Skyway.getAPIKey_UserTokenByWfID(webhook_info.workflow_id, (err, info) => {
                if (err) next(err);
                else if (!(info && info.length)) {
                    console.log("API Key doesn't exist with given workflow ID.");
                    next("API Key doesn't exist with given workflow ID.");
                } else {
                    user_token = JSON.parse(info[0].token);

                    // ======================================
                    OAuth.setCredentials(user_token);
                    const sheets = google.sheets({ version: 'v4', auth: OAuth });

                    // Create a new sheet if not already existed
                    if (webhook_info.sheet_id == null) {
                        // Update webhook table
                        Skyway.updateWebhook_SheetID(webhook_info.id, unique_uid, (err, _) => {
                            if (err) next(err);
                            else {
                                console.log("Successfully updated webhook info.");
                                res.write("Successfully updated webhook info.");
                            }
                        });

                        // Create new sheet
                        const request = {
                            // The ID of the spreadsheet
                            "spreadsheetId": webhook_info.spreadsheet_id,
                            "resource": {
                                "requests": [{
                                    "addSheet": {
                                        // Add properties for the new sheet
                                        "properties": {
                                            "sheetId": webhook_info.id,
                                            "title": webhook_info.spreadsheet_name
                                        }
                                    }
                                }]
                            }
                        };

                        sheets.spreadsheets.batchUpdate(request, (err, _) => {
                            if (err) next(err);
                            else {
                                console.log("Successfully created a new sheet.");
                                res.write("Successfully created a new sheet.");

                                // Add data to sheet
                                const values = [
                                    Object.keys(req.body.wfVariables),
                                    Object.values(req.body.wfVariables)
                                ];

                                resource = {
                                    "majorDimension": "ROWS",
                                    "values": values
                                };

                                GoogleAPI.appendDataToSheet(sheets, webhook_info.spreadsheet_id, webhook_info.spreadsheet_name + '!A:A', resource, (err, response) => {
                                    if (err) next(err);
                                    else {
                                        console.log("Successfully updated " + response.data.updates.updatedCells + " cells.");
                                        res.write("Successfully updated " + response.data.updates.updatedCells + " cells.");
                                    }
                                });
                            }
                        });

                    } else {
                        // Add data to sheet
                        const values = [
                            Object.values(req.body.wfVariables)
                        ];

                        resource = {
                            "majorDimension": "ROWS",
                            "values": values
                        };

                        GoogleAPI.appendDataToSheet(sheets, webhook_info.spreadsheet_id, webhook_info.spreadsheet_name + '!A:A', resource, (err, response) => {
                            if (err) next(err);
                            else {
                                console.log("Successfully updated " + response.data.updates.updatedCells + " cells.");
                                        res.write("Successfully updated " + response.data.updates.updatedCells + " cells.");
                            }
                        });
                    }
                }
            });
        }
    });

    res.end();
}