const axios = require('axios');

const Skyway = require('../models/db.model');
const OnTaskAPI = require('../api/ontask.api');
const { validateUser } = require('../validation/users.validator');

exports.storeAPIKey = async (req, res, next) => {
    if (req.headers.authorization == null) {
        res.statusMessage = "Missing Authorization Header";
        res.status(400).end();
    } else if (req.body.groupName == null) {
        res.statusMessage = "Missing Group Name";
        res.status(400).end();
    } else {
        let end = false;

        const apiKey = req.params.apiKey;
        const groupName = req.body.groupName;

        let group_id, user_id;

        validateUser(req.headers.authorization, (err, user) => {
            if (err) {
                next(err);
                end = true;
            }
            else {
                user_id = user.id;

                // Get group_id
                Skyway.getGroupByUserId_APIKey(user_id, apiKey, async (err, groups) => {
                    if (err) {
                        next(err);
                        end = true;
                    }
                    else if (groups && groups.length) {
                        console.log("Group already existed.");
                        next("Group already existed.");
                        end = true;
                    } else { // Add new group to WORKFLOW_GROUP table if not already existed

                        const response = await axios.get(`${process.env.ONTASK_BASE_URL}/workflowTemplates`,
                            {
                                headers: {
                                    'Authorization': apiKey
                                }
                            }
                        )

                        // Check if API Key exist
                        if (response.status != 200) {
                            console.log("API Key doesn't exist.");
                            res.write("API Key doesn't exist.");
                        } else {
                            Skyway.addGroup(apiKey, groupName, user_id, async (err, result) => {
                                if (err) next(err);
                                else {
                                    group_id = result.insertId;
                                    console.log("Successfully added a group.");

                                    await OnTaskAPI.addWorkflowsToDb(user_id, group_id, apiKey, (err, content) => {
                                        if (err) {
                                            next(err);
                                            end = true;
                                        } else console.log(content);
                                    });
                            
                                    if (end) return;
                            
                                    res.send("Successfully populated workflows of the given group.");
                                }
                            });
                        }
                    }
                });
            }
        });
    }
}

exports.getAPIKeys = async (req, res, next) => {
    if (req.headers.authorization == null) return next('Token not found');
    else {
        validateUser(req.headers.authorization, (err, user) => {
            if (err) return next(err);
            else {
                Skyway.getGroupsByUserID(user.id, (err, groups) => {
                    if (err) return next(err);
                    else if (!(groups && groups.length)) {
                        console.log("There is no groups associated with this user.");
                        return next("There is no groups associated with this user.");
                    } else res.send(groups);
                });
            }
        });
    }
}

exports.getWorkflows = (req, res, next) => {
    if (req.headers.authorization == null) return next('Token not found');
    else {
        validateUser(req.headers.authorization, (err, user) => {
            if (err) return next(err);
            else {
                // Get workflows info (id, name)
                Skyway.getWorkflowsByAPIKey(req.params.apiKey, user.id, (err, workflows) => {
                    if (err) return next(err);
                    else if (!(workflows && workflows.length)) {
                        console.log("There is no workflows associated with this user.");
                        return next("There is no workflows associated with this user.");
                    } else res.send(workflows);
                });
            }
        });
    }
};

exports.getWorkflowParam = (req, res, next) => {
    if (req.headers.authorization == null) return next('Token not found');
    else {
        let user_id;

        validateUser(req.headers.authorization, (err, user) => {
            if (err) return next(err);
            else {
                user_id = user.id;

                Skyway.getWorkflowByUserId_WorkflowId(user_id, req.params.workflowID, (err, workflow) => {
                    if (err) return next(err);
                    else if (!(workflow && workflow.length)) {
                        console.log("There is no paramaters in this workflow.");
                        return next("There is no paramaters in this workflow.");
                    } else res.send(workflow[0].params);
                });
            }
        });
    }
};

exports.updateWorkflowParam = (req, res, next) => {
    if (req.headers.authorization == null) return next('Token not found');
    else {
        let user_id;

        validateUser(req.headers.authorization, (err, user) => {
            if (err) return next(err);
            else {
                user_id = user.id;

                Skyway.updateWorkflowParam(user_id, req.params.workflowID, req.body.params, (err, _) => {
                    if (err) {
                        console.log(err);
                        next(err);
                    } else {
                        console.log("Successfully updated workflow paramaters.");
                        res.send("Successfully updated workflow parameters.");
                    }
                });
            }
        });
    }
}

exports.syncGroups = (req, res, next) => {
    if (req.headers.authorization == null) return next('Token not found');
    else {
        validateUser(req.headers.authorization, (err, user) => {
            if (err) return next(err);
            else {
                Skyway.getGroupsByUserID(user.id, (err, groups) => {
                    if (err) return next(err);
                    else if (!(groups && groups.length)) {
                        console.log("There is no groups associated with this user.");
                        return next("There is no groups associated with this user.");
                    } else {
                        for (const group of groups) {
                            OnTaskAPI.addWorkflowsToDb(user.id, group.id, group.API_key, (err, content) => {
                                if (err) {
                                    next(err);
                                    end = true;
                                } else console.log(content);
                            });
                        }

                        res.send("Successfully populated workflows of the given group.");
                    }
                });
            }
        });
    }
}