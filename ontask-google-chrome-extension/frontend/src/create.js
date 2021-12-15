console.log("creates.js page");
const axios = require('axios');
const apiBaseURL = "https://stag-ontask-bridge-api.phiquest.com";

let sheetID="";
let user_groups=[];
let user_token;
let myGroupsList;
let myGroupsListNames=[];
let user_workflows=[];
let workflowInfo;
let workflowInfoNames =[];
let selectedWorkflowNameSheets;
let selectedWorkflowIdSheets;
let groupNameSheets;
let groupAPISheets;
let storedSheetID;

const logout_logo= document.getElementById("logout-logo");
const copy_logo=document.getElementById("clipboard-icon");
const get_webhook=document.getElementById("get-webhook-button");
const get_from_sheet_button=document.getElementById("get-from-sheet");
const copy_prompt=document.getElementById("copy-prompt");
const run_sheet_button=document.getElementById("run-sheet");
const groups_dropdown=document.getElementById("selectGroup");
const workflows_dropdown=document.getElementById("selectWorkflow");
const run_sheets_div=document.getElementsByClassName("run-from-sheet-div");
const get_results_div=document.getElementsByClassName("set-up-results-div");
const new_sheet_name= document.getElementById("new-sheet-name");
const run_sheet_checkbox=document.getElementById("show-retrieve-webhook-checkbox");
const get_sheet_results_checkbox=document.getElementById("set-up-get-results-checkbox");
const my_test_button=document.getElementById("test-button");

groups_dropdown.addEventListener("change", async function () {
    console.log("groups dropdown changed");
    console.log("values chosen is:" + groups_dropdown.value);
    var groupNameSheets=groups_dropdown.value;
    console.log("group name for sheets saved as:");
    console.log(groupNameSheets);
    await chrome.storage.local.set({groupNameSheets:groupNameSheets});
    //groupName=groups_dropdown.value;
    //getting the apikey of the group
    for(var i=0; i<myGroupsList.length; i++){
        if(myGroupsList[i].group_name===groupNameSheets) {
            groupAPISheets=myGroupsList[i].API_key;
            console.log("THIS IS THE API FOR SHEETS");
            console.log(groupAPISheets);
        }
    }
    //setting the APIKeySheets
    await chrome.storage.local.set({apiKeySheets:groupAPISheets});
    console.log("set group API for sheets");

    await show_workflows_func();
});

workflows_dropdown.addEventListener("change", async function () {
    console.log("workflows dropdown changed");
    await syncToOnTask();
    console.log("workflows synced");
    console.log("values chosen is:" + workflows_dropdown.value);
    selectedWorkflowNameSheets = workflows_dropdown.value;
    await chrome.storage.local.set({selectedWorkflowNameSheets: selectedWorkflowNameSheets});

    for (var i = 0; i < workflowInfo.length; i++) {
        if (workflowInfo[i].workflow_name === selectedWorkflowNameSheets) {
            selectedWorkflowIdSheets = workflowInfo[i].workflow_id;
            console.log(selectedWorkflowIdSheets);
            await chrome.storage.local.set({selectedWorkflowIdSheets: selectedWorkflowIdSheets});
            console.log("selectedWorkflowIdSheets set to storage");
        }
    }
});

run_sheet_checkbox.addEventListener("click",function(){
    console.log("run sheet checked");
    if(run_sheets_div[0].style.display!==undefined) {
        if (run_sheets_div[0].style.display === "none") {
            console.log("run sheet div set to show");
            for(var i=0;i<run_sheets_div.length;i++){
                run_sheets_div[i].style.display = "block";
            }
        } else {
            console.log("run sheet div no show");
            for(var j=0;j<run_sheets_div.length;j++){
                run_sheets_div[j].style.display = "none";
            }
        }
    }
    else console.log("style display for run sheets div is null");
});

get_sheet_results_checkbox.addEventListener("click",async function () {
    console.log("get results checked");
    if (get_results_div[0].style.display !== undefined) {
        if (get_results_div[0].style.display === "none") {
            console.log("run sheet div set to show");
            for (var i = 0; i < get_results_div.length; i++) {
                get_results_div[i].style.display = "block";
            }
            //check if sheet name has been set in this session
            await chrome.storage.local.get("resultSheetName", async (data) => {
                if(data.resultSheetName!==undefined){
                    console.log("there is a sheet name in memory");
                    new_sheet_name.value=data.resultSheetName;
                }
            })

        } else {
            console.log("run sheet div no show");
            for (var j = 0; j < get_results_div.length; j++) {
                get_results_div[j].style.display = "none";
            }
        }
    } else console.log("style display for run sheets div is null");
});

if(my_test_button) {
    my_test_button.addEventListener("click", function () {
        console.log("my button clicked");
    })
}

if(logout_logo){
    logout_logo.addEventListener("click", logout);
}
function logout(){
    console.log("log out clicked!");
    chrome.storage.local.clear();
//resetting the login button
    document.location.href = 'login.html';
}

if(run_sheet_button){
    run_sheet_button.addEventListener("click",async function() {
        console.log("clicked run sheet");
        await readSheetAPICall();
    })
}

if (get_from_sheet_button){
    get_from_sheet_button.addEventListener("click",async function() {
        console.log("clicked get from OnTask to sheet");
        chrome.storage.local.get(null, async (data) => {
            let user_token = data.token;
            await axios.post(`${apiBaseURL}/webhooks/uploadOnTaskResultsToSheet`,
                {
                    headers: {
                        "Authorization": user_token
                    }
                }
            ).then(res => {
                    console.log(res.data);
                }
            )
        })

    })
}
window.addEventListener('load',async function() {

    await getSheetID();
    await getInfo();
    //await readSheetAPICall();
    await show_groups_func();
    await chrome.storage.local.get(null, async (data) => {
        console.log(data);
    })


        console.log("all calls done");
})

async function getAPIKeysCall(){
    return new Promise(function(resolve, reject) {
        chrome.storage.local.get("token", (data) => {
            const user_token = data.token;
            axios.get(`${apiBaseURL}/users/getAPIKeys`,
                {
                    headers: {
                        "Authorization": user_token
                    }
                }
            ).then(res => {
                    myGroupsList = res.data;
                    myGroupsList.map(el => myGroupsListNames.push(el.group_name));

                    resolve(myGroupsListNames);
                    //console.log(myGroupsListNames);
                }
            ).catch(error => {
                console.log("request failed", error);
                alert(error);
                throw error;
            });
        });
    })
}
async function show_groups_func(){
    console.log("in show groups func");
    //calling the getAPIKeys api
    user_groups = await getAPIKeysCall();
    console.log("this is a list of user groups")
    console.log(user_groups);

    //initializing selectGroup dropdown list
    var select = document.getElementById("selectGroup");
    var options = user_groups;
    // Optional: Clear all existing options first:
        select.innerHTML = "";
        //console.log("length of options is"+options.length);
        // Populate list with options:
        select.innerHTML += "<option value=\"" + "Select a group" + "\">" + "Select a group" + "</option>";
        for (var i = 0; i < options.length; i++) {
            var opt = options[i];
            select.innerHTML += "<option value=\"" + opt + "\">" + opt + "</option>";
        }

    //Loading user predefined group if exists
    await chrome.storage.local.get("groupNameSheets", async (data) => {
        console.log("storage on load");
        if (data.groupNameSheets !== undefined) {
            for (var i = 0; i < myGroupsList.length; i++) {
                if (myGroupsList[i].group_name === data.groupNameSheets) {
                    groups_dropdown.options[i + 1].selected = true;
                    console.log("the right group is retrieved from memory");
                }
            }
            //call workflow
            await show_workflows_func();

        } else console.log("user information not set");

    })

}

async function show_workflows_func() {
    console.log("in show workflow func");
    console.log(groups_dropdown.value);
    groupNameSheets = groups_dropdown.value;
    console.log(groupNameSheets);

    user_workflows = await getWorkflowInfoCall();
    console.log("workflows from show workflows");
    console.log(user_workflows);

    //initializing selectworkflows dropdown list
    var select = document.getElementById("selectWorkflow");
    var options = user_workflows;
    // Optional: Clear all existing options first:
    select.innerHTML = "";
    //console.log("length of options is"+options.length);
    // Populate list with options:

    select.innerHTML += "<option value=\"" + "Select a workflow" + "\">" + "Select a workflow" + "</option>";
    for (var i = 0; i < options.length; i++) {
        var opt = options[i];
        select.innerHTML += "<option value=\"" + opt + "\">" + opt + "</option>";
    }

    //Loading user predefined option for workflow if exists
    await chrome.storage.local.get("selectedWorkflowNameSheets", async (data) => {
        if (data.selectedWorkflowNameSheets !== undefined) {
            for (var i = 0; i < user_workflows.length; i++) {
                if (user_workflows[i] === data.selectedWorkflowNameSheets) {
                    workflows_dropdown.options[i + 1].selected = true;
                    console.log("the right workflow is retrieved from memory");
                }
            }
        }


    })
}
async function getWorkflowInfoCall(){
    //user the groupName to get apikey
    console.log("from getWorkflowInfocall");
    return new Promise(async function (resolve, reject) {

        await chrome.storage.local.get(null, (data) => {
            const user_token = data.token;
            const apiKeySheets =data.apiKeySheets;
            axios.get(`${apiBaseURL}/users/getWorkflows/${apiKeySheets}`,
                {
                    headers: {
                        "Authorization": user_token
                    }
                }
            )
                .then(res => {
                    workflowInfo = res.data;

                    workflowInfo.map(el => workflowInfoNames.push(el.workflow_name));
                    resolve(workflowInfoNames);
                }).catch(error => {
                console.log("request failed", error);
                alert(error);
                throw error;
            });
        });

    })
}


async function getSheetID(){
    console.log("in getSheetsID");
    return new Promise(function(resolve, reject) {
        let url_;
        let substrings;
//check if a document is open
//gets document ID and saves it to storage
        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
            console.log("getting url");
            url_ = tabs[0].url;
            let sheetFixedURL = url_.slice(0, 39);
            console.log(sheetFixedURL);
            if (sheetFixedURL !== "https://docs.google.com/spreadsheets/d/") {
                console.log("spreadsheet detected");
                document.getElementById("sheetID").style.display="block";
                document.getElementById("sheetID").innerHTML = "Please open a google sheet";
            } else {
                console.log("on a google sheet!!!");
                substrings = url_.split('/', 7);

                sheetID = substrings[5];
                chrome.storage.local.set({spreadsheetID: sheetID});
                //console.log(sheetID);
                console.log("google sheet ID set!!!");
                resolve(1);
            }
        });
    })
}
async function readSheetAPICall(){
    return new Promise(async function (resolve, reject) {
        //get ID of workflow selected
        console.log("in runsheetAPI");
        for (var i = 0; i < workflowInfo.length; i++) {
            if (workflowInfo[i].workflow_name === selectedWorkflowNameSheets) {
                selectedWorkflowIdSheets = workflowInfo[i].workflow_id;
                console.log(selectedWorkflowIdSheets);
                await chrome.storage.local.set({selectedWorkflowIdSheets: selectedWorkflowIdSheets});
                console.log("selectedWorkflowIDsheets set!!!");
            }
        }
        chrome.storage.local.get(null, (data) => {
            const user_token = data.token;
            const storedSheetID = data.spreadsheetID;
            const workflowIDSheetsStored = data.selectedWorkflowIdSheets;
            const apiKeySheetsStorage = data.apiKeySheets;
            console.log(user_token);
            console.log(storedSheetID);
            console.log(workflowIDSheetsStored);
            console.log("this is the api key in storage");
            console.log(apiKeySheetsStorage);

            //console.log(storedSheetID);
            axios.post(`${apiBaseURL}/users/startWorkflowOnSpreadsheet/${storedSheetID}`,
                {
                    workflowID: workflowIDSheetsStored,
                    apiKey: apiKeySheetsStorage
                    //wfid and apikey
                },
                {
                    headers: {
                        "Authorization": user_token
                    }

                }
            ).then(res => {
                    console.log(res.data);
                    if (res.status === 200) {
                        alert("Workflow started successfully");
                    } else
                        alert("There seems to be a problem running the workflow!");

                }
            ).catch(error => {
                console.log("request failed", error);
                alert(error);
                throw error;
            })
        });
    })
}
async function getInfo(){
    return new Promise(await function(resolve, reject) {
        chrome.storage.local.get("token", (data) => {
            user_token = data.token;
        })
        chrome.storage.local.get("spreadsheetID", (data) => {
            storedSheetID = data.spreadsheetID;
            console.log(storedSheetID);
        })
        resolve(1);
    });
}
async function syncToOnTask(){
    chrome.storage.local.get("token", (data) => {
        const user_token = data.token;
        axios.get(`${apiBaseURL}/users/syncGroups`,
            {
                headers: {
                    "Authorization": user_token
                }
            }
        ).then(res => {
                console.log(res.data);
            }
        )
    })
}

//getting results
if(get_webhook){
    get_webhook.addEventListener("click", getWebhookLinkCall);

}
async function getWebhookLinkCall(){
    console.log("get webhook clicked!");
    console.log(new_sheet_name.value);
    await chrome.storage.local.set({resultSheetName: new_sheet_name.value});

    await chrome.storage.local.get(null, async (data) => {
        //const workflowID = data.selectedWorkflowId;
        console.log(data);
        console.log("this is the workflow ID selected");
        console.log(data.selectedWorkflowId);
        let workflowIDSheetsStorage = data.selectedWorkflowIdSheets;
        let user_token = data.token;
        //let apiKeySheetsStorage = data.apiKeySheets;
        let new_sheet_name_storage = data.resultSheetName;
        let spreadsheetID_storage = data.spreadsheetID;

        await axios.post(`${apiBaseURL}/webhooks/getWebhookLink/${workflowIDSheetsStorage}`,
            {
                spreadsheetName: new_sheet_name_storage,
                spreadsheetID: spreadsheetID_storage

            }, {
                headers: {
                    "Authorization": user_token
                }
            }
        ).then(res => {
                console.log(res.data);
                document.getElementById("user_webhook").innerHTML = res.data;
                copy_logo.style.visibility = "visible";
                copy_prompt.style.visibility = "visible";
            }
        ).catch(error => {
            console.log("request failed", error);
            alert(error);
            throw error;
        })
    })
}

//copying webhook functions
if(copy_logo){
    copy_logo.addEventListener("click", copyFunc);
}
function copyFunc(){
    console.log("Copy logo clicked");
    var copyText = document.getElementById("user_webhook").innerHTML;

    console.log(copyText);
    //copy text to clipboard
    navigator.clipboard.writeText(copyText);


}
