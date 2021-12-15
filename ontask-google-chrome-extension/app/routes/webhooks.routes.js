let router = require("express").Router();

const google = require('../controllers/users.googleController');
const base = require('../controllers/users.baseController');


// Webhook
router.post("/getWebhookLink/:workflowID", base.getWebhookLink);
router.post("/uploadSignedDocumentToDrive/:uuid", google.uploadSignedDocument);
router.post("/uploadOnTaskResultsToSheet/:uuid", google.uploadOnTaskResultsToSheet);

module.exports = router;