const { v4: uuidv4 } = require('uuid');
const { google } = require('googleapis');

const Skyway = require('../models/db.model');
const OAuth = require('../config/oauth.config');
const OnTaskAPI = require('../api/ontask.api');
const { validateToken } = require('../validation/jwtValidate');
const { validateUser } = require('../validation/users.validator');

exports.getWebhookLink = (req, res, next) => {
    if (req.headers.authorization == null) return next('Token not found');
    else {
        const unique_uid = uuidv4();

        let user_id;

        validateUser(req.headers.authorization, (err, user) => {
            if (err) return next(err);
            else {
                user_id = user.id;

                // Get webhook info
                Skyway.getWebhookByUUID(unique_uid, (err, webhook) => {
                    if (err) return next(err);
                    else if (webhook && webhook.length) {
                        console.log("Webhook already existed.");
                        return res.send("Webhook already existed.");
                    } else { // Add new webhook to WEBHOOK table if not already existed
                        const webhook_link = "http://" + process.env.HOST + ":" + process.env.PORT + "/webhooks/uploadOnTaskResultsToSheet/" + unique_uid;

                        // Get workflow primary ID
                        Skyway.getWorkflowByUserId_WorkflowId(user_id, req.params.workflowID, (err, workflows) => {
                            if (err) return next(err);
                            else if (!(workflows && workflows.length) || workflows.find(workflow => workflow.user_id == user_id) == undefined) {
                                console.log("Workflow doesn't exist.");
                                return next(err);
                            } else {		// Add workflow to WORKFLOW_INFO table if not already existed
                                let workflow = workflows.find(workflow => workflow.user_id == user_id);

                                Skyway.addWebhook(unique_uid, webhook_link, workflow.id, req.body.spreadsheetID, req.body.spreadsheetName, (err, _) => {
                                    if (err) return next(err);
                                    else console.log("Successfully added a webhook.");
                                });

                                return res.send(webhook_link);
                            }
                        });
                    }
                });
            }
        });
    }
}

exports.sendDocToOnTask = async (req, res, next) => {
    if (req.headers.authorization == null) {
        next('Token not found');
    } else {
        let end = false;

        let user_token, user_id;
        validateToken(req.headers.authorization, (err, result) => {
            if (err) {
                next(err);
                end = true;
            }
            else user_token = result.token;
        });

        if (end) return;

        validateUser(req.headers.authorization, (err, user) => {
            if (err) {
                next(err);
                end = true;
            }
            else user_id = user.id;
        });

        if (end) return;

        // Update workflow paramaters
        OAuth.setCredentials(user_token);
        const drive = google.drive({ version: 'v3', auth: OAuth });

        const fileId = req.params.documentID;

        const text = await drive.files.export(
            {
                fileId: fileId,
                mimeType: 'text/plain'
            }
        );

        let pattern = /%[^%]*%/g;
        let anchorStrings = text.data.match(pattern);

        drive.files.export(
            {
                fileId: fileId,
                mimeType: 'application/pdf'
            },
            { responseType: 'stream' }
        ).then(response => {
            let documentId;
            (async () => {
                await OnTaskAPI.uploadFile(response.data, req.body.apiKey, (err, result) => {
                    if (err) {
                        next(err);
                        end = true;
                    }
                    else {
                        documentId = result;
                        console.log("Successfully uploaded document to OnTask", documentId);
                        res.write("Successfully uploaded document to OnTask");
                    }
                });

                if (end) return;

                await OnTaskAPI.mapAnchorString(documentId, req.body.apiKey, anchorStrings, (err, _) => {
                    if (err) {
                        next(err);
                        end = true;
                    }
                    else {
                        console.log("Successfully mapped anchor string to provided document.");
                        res.write("Successfully mapped anchor string to provided document.");
                    }
                });

                if (end) return;

                // Get workflowParam from database
                Skyway.getWorkflowByUserId_WorkflowId(user_id, req.body.workflowID, (err, workflow) => {
                    if (err) return next(err);
                    else if (!(workflow && workflow.length)) {
                        console.log("There is no paramaters in this workflow.");
                        return next("There is no paramaters in this workflow.");
                    } else {
                        const workflowParam = JSON.parse(workflow[0].params);

                        let workflowPostBody = {};

                        workflowParam.forEach(field => {
                            if (field.type != 'file') {
                                workflowPostBody[field.name] = field.value;
                            } else {
                                workflowPostBody[field.name] = documentId;
                            }
                        });

                        // Start the workflow
                        OnTaskAPI.startOnTaskWorkflow(req.body.workflowID, workflowPostBody, req.body.apiKey, (err, _) => {
                            if (err) return next(err);
                            else {
                                console.log("Successfully started the workflow");
                            }
                        });
                    }
                });
            })();
        });

        res.end();
    }
}

exports.startWorkflowOnSpreadsheet = async (req, res, next) => {
    if (req.headers.authorization == null) {
        next('Token not found');
    } else {
        let user_token;
        validateToken(req.headers.authorization, (err, result) => {
            if (err) return res.status(400).send(err);
            else user_token = result.token;
        });

        OAuth.setCredentials(user_token);
        const drive = google.drive({ version: 'v3', auth: OAuth });

        let data;

        await drive.files.export(
            {
                fileId: req.params.sheetID,
                mimeType: 'text/csv' 
            }
        ).then(response => data = response.data);

        // Preprocess data
        data = data.replaceAll("\r", "").split("\n");
        
        // Create an array storing all given fields
        let workflowPostBody = {};
        fields = data[0].split(",");
        data = data.slice(1);

        // Start Workflow on each row
        for (let i = 0; i < data.length; i++) {
            let params = data[i].split(",");

            for (let j = 0; j < fields.length; j++) {
                workflowPostBody[fields[j]] = params[j]; 
            }

            // Start the workflow
            OnTaskAPI.startOnTaskWorkflow(req.body.workflowID, workflowPostBody, req.body.apiKey, (err, _) => {
                if (err) next(err);
                else {
                    console.log("Successfully started the workflow");
                }
            });
        }

        res.send("Success");
    }
}