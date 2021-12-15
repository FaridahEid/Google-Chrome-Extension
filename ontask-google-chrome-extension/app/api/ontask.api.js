const axios = require('axios');
const stringSimilarity = require("string-similarity");

const apiBaseURL = "https://app.ontask.io/api/v2";
const noTypoAnchorString=["checkbox", "date", "initials", "signature", "text"];

const Skyway = require('../models/db.model');

exports.uploadFile = async (fileContents, apiKey, result) => {
    await axios.post(`${apiBaseURL}/documents`,
        fileContents,
        {
            headers: {
                'Authorization': apiKey,
                'Content-type': "application/pdf"
            }
        }
    )
        .then(res => {
            result(null, res.data.documentId);
        })
        .catch(err => {
            console.log("Failed to upload document: " + err);
            result(err, null);
        });
}

exports.mapAnchorString = async (documentID, apiKey, anchorStrings, result) => {
    let fieldsConfiguration = {
        fields: []
    }

    anchorStrings.forEach(anchorString => {
        let name = anchorString.slice(1, -1);

        let type = name.slice(0,-1).toLowerCase();
        type = stringSimilarity.findBestMatch(type, noTypoAnchorString).bestMatch.target;    // Fix typo of anchor string based on most similarity 

        name = name.replace(/(?=.{1}$)/,' ');

        if (type == "name") type = "text";

        fieldsConfiguration.fields.push({
            anchorString: anchorString,
            name: name,
            height: 20,
            width: 180,
            xOffset: 2,
            yOffset: 5,
            removeAnchorString: true,
            required: true,
            type: type
        });
    });

    // Map anchor string to placeholder in document
    await axios.put(`${apiBaseURL}/documents/${documentID}/fields`,
        fieldsConfiguration,
        {
            headers: {
                'Authorization': apiKey
            }
        }
    ).catch(err => {
        console.log("Failed to map anchor string to document: " + err);
        return result(err, null);
    });
}

exports.startOnTaskWorkflow = async (workflowID, workflowPostBody, apiKey, result) => {
    //OnTask Start Workflow API Call
    await axios.post(`${apiBaseURL}/workflowTemplates/${workflowID}`,
        workflowPostBody,
        { headers: { 'Authorization': apiKey } }
    )
    .then(res => {
        console.log(res.data);
        return result(null, res.data)
    })
    .catch(err => {
        console.log("Failed to start the workflow: " + err);
        return result(err, null);
    });
}

exports.getStartForm = async (workflowID, result) => {
    await axios.get(`${apiBaseURL}/workflowTemplates/${workflowID}/startForm`
    )
        .then(res => {
            result(null, res.data.pageDefinition.form);
        })
        .catch(err => {
            console.log("Failed to get start form: " + err);
            result(err, null);
        });
}

exports.getDocument = async (documentID, apiKey, result) => {
    await axios.get(`https://app.ontask.io/api/v2/documents/${documentID}`,
        {
            headers: {
                Authorization: apiKey
            },
            responseType: 'stream'
        }
    )
        .then(res => result(null, res.data))
        .catch(err => {
            console.log("Failed to get document: " + err);
            result(err, null);
        });
}

exports.addWorkflowsToDb = async (user_id, group_id, apiKey, result) => {
    let end= false;

    // Get all workflows from Group of provided API Key
    let workflowTemplates;
    await axios.get(`${process.env.ONTASK_BASE_URL}/workflowTemplates`,
        {
            headers: {
                'Authorization': apiKey
            }
        }
    )
    .then(res => {
        console.log("Successfully gotten all workflows from provided group.")
        workflowTemplates = res.data;
    })
    .catch(err => {
        console.log("Failed to get workflows from group");

        result(err, null);
        end = true;
    });

    if (end) return;

    // Store workflows info to database
    for (let i = 0; i < workflowTemplates.length; i++){
        const workflow = workflowTemplates[i];

        // Check if the workflow is published or not
        if (workflow.state == 'active') {
            // Get starForm of the workflow
            let startFormInfos;
            await this.getStartForm(workflow.templateId, (err, startFormInfo) => {
                if (err) {
                    result(err, null);
                    end = true;
                }
                else startFormInfos = startFormInfo;
            });

            if (end) return;

            // Get all params of the workflow
            let workflow_params = [];
            for (let j = 0; j < startFormInfos.length; j++) {
                const field = startFormInfos[j];

                workflow_params.push({
                    "label": field.label,
                    "name": field.name,
                    "type": field.type,
                    "value": ""
                });
            }

            Skyway.getWorkflowByUserId_WorkflowId(user_id, workflow.templateId, (err, workflows) => {
                if (err) {
                    console.log("Failed to get workflow from workflowID = ", workflow.templateId);

                    result(err, null);
                }
                else if (workflows && workflows.length) {
                    console.log("Workflow already existed.");
                } else {		// Add workflow to WORKFLOW_INFO table if not already existed
                    Skyway.addWorkflow(workflow.name, group_id, workflow.templateId, user_id, workflow_params, (err, _) => {
                        if (err) return res.status(400).send(err);
                        else console.log("Successfully added a workflow.");
                    });
                }
            });
        }
    }

    result(null, "Successfully populated workflows of the given group.");
}