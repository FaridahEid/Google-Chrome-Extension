// //const users = require("../controllers/users.controller");
// let router = require("express").Router();
// //const authorize = require('../../_helpers/authorize');
// //const Role = require('../../_helpers/role');
//
// // routes
// router.get("/", (req, res) => res.send("Hello says Bridge!"));    // all authenticated users
// module.exports = router; //test
//
// // OLD CODE

let router = require("express").Router();

const google = require('../controllers/users.googleController');
const onTask = require('../controllers/users.onTaskController');
const base = require('../controllers/users.baseController');

// Routes
router.get("/", (req, res) => res.send("Hello says Bridge?!?")) //test

// Authentication
router.get("/getAuthURL", google.getAuthURL);
router.get("/callback", google.callback);

// OnTask
router.post("/storeAPIKey/:apiKey", onTask.storeAPIKey);
router.post("/updateWorkflowParam/:workflowID", onTask.updateWorkflowParam);
// =====
router.get("/getAPIKeys", onTask.getAPIKeys);
router.get("/getWorkflows/:apiKey", onTask.getWorkflows);
router.get("/getWorkflowParam/:workflowID", onTask.getWorkflowParam);
router.get("/syncGroups", onTask.syncGroups);

// Base
router.post("/sendDocToOnTask/:documentID", base.sendDocToOnTask);
router.post("/startWorkflowOnSpreadsheet/:sheetID", base.startWorkflowOnSpreadsheet);

module.exports = router;