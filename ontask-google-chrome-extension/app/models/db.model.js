'use strict';
const sql = require('../config/db.config');

// OnTask object constructor
let Skyway = (onTask) => {
    this.result = onTask.task;
    this.status = onTask.status;
    this.created_at = new Date();
}

// =============== ADD ===============
Skyway.addUser = (email, firstname, lastname, refresh_token, token, result) => {
    let query = `INSERT INTO user (email, first_name, last_name, refresh_token, token) VALUES (?, ?, ?, ?, ?)`;

    sql.query(query, [email, firstname, lastname, refresh_token, JSON.stringify(token)], (err, res) => {
        if (err) {
            console.log("Error: ", err);
            result(err, null);
        } else result(null, res);
    });
}

Skyway.addGroup = (apiKey, groupName, userID, result) => {
    let query = `INSERT INTO workflow_group (API_key, group_name, user_id) VALUES (?, ?, ?)`;

    sql.query(query, [apiKey, groupName, userID], (err, res) => {
        if (err) {
            console.log("Error: ", err);
            result(err, null);
        } else result(null, res);
    });
}

Skyway.addWorkflow = (name, groupID, workflowID, userID, params, result) => {
    let query = `INSERT INTO workflow_info (workflow_name, group_id, workflow_id, user_id, params) VALUES (?, ?, ?, ?, ?)`;

    sql.query(query, [name, groupID, workflowID, userID, JSON.stringify(params)], (err, res) => {
        if (err) {
            console.log("Error: ", err);
            result(err, null);
        } else result(null, res[0]);
    });
}

Skyway.addWebhook = (uuid, link, workflowID, spreadsheetID, spreadsheetName, result) => {
    let query = `INSERT INTO webhook (uuid, webhook_link, workflow_id, spreadsheet_id, spreadsheet_name) VALUES (?, ?, ?, ?, ?)`;

    sql.query(query, [uuid, link, workflowID, spreadsheetID, spreadsheetName], (err, res) => {
        if (err) {
            console.log("Error: ", err);
            result(err, null);
        } else result(null, res[0]);
    });
}

// =============== GET ===============
Skyway.getUserByEmail = (email, result) => {
    let query = 'SELECT * FROM user WHERE email = ?';

    sql.query(query, email, (err, res) => {
        if(err) {
            console.log("Error: ", err);
            result(err, null);
        } else result(null, res);
    });
}

Skyway.getGroupsByUserID = (userID, result) => {
    let query = 'SELECT * FROM workflow_group WHERE user_id = ?';

    sql.query(query, userID, (err, res) => {
        if(err) {
            console.log("Error: ", err);
            result(err, null);
        } else result(null, res);
    });
}

Skyway.getGroupByUserId_APIKey = (userID, apiKey, result) => {
    let query = 'SELECT * FROM workflow_group WHERE user_id = ? AND API_key = ?';

    sql.query(query, [userID, apiKey], (err, res) => {
        if (err) {
            console.log("Error: ", err);
            result(err, null);
        } else result(null, res);
    });
}

Skyway.getWorkflowsByAPIKey = (apiKey, userID, result) => {
    let query = 'SELECT workflow_id, workflow_name FROM workflow_info WHERE user_id = ? AND group_id = (SELECT id FROM workflow_group WHERE API_key = ? AND user_id = ?)';

    sql.query(query, [userID, apiKey, userID], (err, res) => {
        if(err) {
            console.log("Error: ", err);
            result(err, null);
        } else result(null, res);
    });
}

Skyway.getWorkflowByUserId_WorkflowId = (userID, workflowID, result) => {
    let query = 'SELECT * FROM workflow_info WHERE user_id = ? AND workflow_id = ?';

    sql.query(query, [userID, workflowID], (err, res) => {
        if(err) {
            console.log("Error: ", err);
            result(err, null);
        } else result(null, res);
    });
}

Skyway.getWebhookByUUID = (uuid, result) => {
    let query = 'SELECT * FROM webhook WHERE uuid = ?';

    sql.query(query, uuid, (err, res) => {
        if(err) {
            console.log("Error: ", err);
            result(err, null);
        } else result(null, res);
    });
}

Skyway.getAPIKey_UserTokenByWfID = (wf_id, result) => {
    let query = 'SELECT workflow_group.API_key, user.token FROM workflow_group, user WHERE workflow_group.user_id = user.id AND workflow_group.user_id = (SELECT user_id FROM workflow_info WHERE id = ?)';

    sql.query(query, wf_id, (err, res) => {
        if(err) {
            console.log("Error: ", err);
            result(err, null);
        } else result(null, res);
    });
}

// =============== UPDATE ===============
Skyway.updateRefreshToken = (email, refresh_token, result) => {
    let query = `UPDATE user SET refresh_token = ? WHERE email = ?`;

    sql.query(query, [refresh_token, email], (err, res) => {
        if (err) {
            console.log("Error: ", err);
            result(err, null);
        } else result(null, res);
    });
}

Skyway.updateToken = (email, token, result) => {
    let query = `UPDATE user SET token = ? WHERE email = ?`;

    sql.query(query, [JSON.stringify(token), email], (err, res) => {
        if (err) {
            console.log("Error: ", err);
            result(err, null);
        } else result(null, res);
    });
}

Skyway.updateWorkflowParam = (userID, workflowID, params, result) => {
    let query = `UPDATE workflow_info SET params = ? WHERE user_id = ? AND workflow_id = ?`;

    sql.query(query, [JSON.stringify(params), userID, workflowID], (err, res) => {
        if (err) {
            console.log("Error: ", err);
            result(err, null);
        } else result(null, res);
    });
}

Skyway.updateWebhook_SheetID = (sheetID, uuid, result) => {
    let query = `UPDATE webhook SET sheet_id = ? WHERE uuid = ?`;

    sql.query(query, [sheetID, uuid], (err, res) => {
        if (err) {
            console.log("Error: ", err);
            result(err, null);
        } else result(null, res);
    });
}

module.exports = Skyway;