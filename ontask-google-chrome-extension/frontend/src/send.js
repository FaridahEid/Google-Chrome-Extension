const axios = require('axios');
const apiBaseURL = "https://stag-ontask-bridge-api.phiquest.com";

//In this page the following should get added to local storage
//current: groupName,groupAPI,selectedWorkflowName,selectedWorkflowID,paramsValues,docID
let workflowInfo;
let workflowInfoNames =[];
let user_workflows=[];
let myGroupsList;
let myGroupsListNames=[];
let user_groups=[];
let groupName;
let groupAPI;
let selectedWorkflowName;
let selectedWorkflowId;
var paramsInfo;//stores the res of getWorkflowParams api (without values)
let paramsInfoNames=[]; //stores the names of the fields in the pramsInfo object
let paramsInfoWithValues=[];//stores the object paramsInfo with the user input filled in the values
let userParamValues=[]; //stores the inputs from the user to the params required
let docID;
var f;


const groups_dropdown=document.getElementById("selectGroup");
const workflows_dropdown=document.getElementById("selectWorkflow");
const paramsForm=document.getElementsByTagName("form");
const logout_logo= document.getElementById("logout-logo");
const done_button=document.getElementById("done-button");
const send_document_button=document.getElementById("send-document-button");
const alphabets_dropdown=document.getElementById("alphabets");
const anchors_dropdown=document.getElementById("anchors");
const copy_logo=document.getElementById("clipboard-icon");
const my_button=document.getElementById("special-button");


if(groups_dropdown) {
    groups_dropdown.addEventListener("change", async function () {

        await syncToOnTask();
        console.log("groups dropdown synced");
        var index = groups_dropdown.selectedIndex;
        console.log("values chosen is:" + groups_dropdown.value);

    });
}
if(workflows_dropdown){
    workflows_dropdown.addEventListener("change", async function () {
        console.log("workflows dropdown changed!!!!");
        await syncToOnTask();
        console.log("workflows dropdown synced");
        console.log(paramsForm);
        while (paramsForm.firstChild) {
            paramsForm.removeChild(paramsForm.firstChild);
        }
        paramsForm[0].removeChild(f);
        f = null;
        await show_workflowParams_func();
    });
}
if(logout_logo){
    logout_logo.addEventListener("click", logout);
}
if(done_button){
    done_button.addEventListener("click",async function () {
        console.log("done clicked");
        console.log(validateForm());
        if (validateForm()) {
            document.getElementById("error").innerHTML = null;
            console.log("saving local storage");
            await chrome.storage.local.set({apiKey: groupAPI});
            await chrome.storage.local.set({groupName: groupName});
            //storing selectedWorkflowName and selectedWorkflowId
            await chrome.storage.local.set({selectedWorkflowName: selectedWorkflowName});
            await chrome.storage.local.set({selectedWorkflowId: selectedWorkflowId});
            saveParams();
            await saveParamsToBackend();
            send_document_button.style.visibility = "visible";
        }
    })
}

//Prompts the user to fill in all fields before submitting
function validateForm(){
    let flag = true;
    var myForm2= document.getElementById("submitParams").getElementsByTagName("input");
    /*console.log("element ids");
    console.log(myForm2.length);
    console.log(myForm2);*/

    for (var i= 0; i<myForm2.length; i++){

        console.log(myForm2[i].id);
        let x = myForm2[i].value;
        if(x === ""){
            //alert(myForm2[i].id + "must be filled out");
            document.getElementById("error").innerHTML = "Please fill in all fields";
            flag = false;
            return flag;
        }

    }
    return flag;

}
if(send_document_button){
    send_document_button.addEventListener("click",function(){
        console.log("send_document clicked");
        //check if google doc is open so server doesn't crash
        /*if(!(await isOnGoogleDoc())) {
            console.log(isOnGoogleDoc());
            console.log("ON GOOGLE DOC AND CALLING SEND TO ONTASK");*/
        sendToOnTaskCall();
        //}
    })
}

window.addEventListener('load',async function(){

    chrome.storage.local.get(null, (data) => {
        console.log("storage on load");
        console.log(data);
        console.log("data of workflow name");
        console.log(data.selectedWorkflowName);
        if(data.selectedWorkflowName!==undefined)
            workflows_dropdown.value=data.selectedWorkflowName;
        if(data.groupName!==undefined)
            groups_dropdown.value=data.groupName;
    })
    await getDocumentID();
    await show_groups_func();
    await show_workflows_func();
    await show_workflowParams_func();
    await anchors_help_dropdown_func()

});
function logout(){
    console.log("log out clicked!");
    chrome.storage.local.clear();
    //resetting the login button
    document.location.href = 'login.html';
}

async function saveParamsToBackend(){
    chrome.storage.local.get(null, (data) => {
        const user_token = data.token;
        console.log(user_token);
        const selectedWorkflowIdStorage = data.selectedWorkflowId;
        console.log(selectedWorkflowIdStorage);
        const paramsValuesStorage = data.paramsValues;

        axios.post(`${apiBaseURL}/users/updateWorkflowParam/${selectedWorkflowIdStorage}`,
            {
                params: paramsValuesStorage

            }, {
                headers: {
                    "Authorization": user_token
                }
            }
        ).then(res => {
                console.log("saved params to backend");
                console.log(res.data);

            }
        )
    })

}
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
                    console.log(res.status);
                    myGroupsList = res.data;
                    myGroupsList.map(el => myGroupsListNames.push(el.group_name));

                    resolve(myGroupsListNames);

                }
            ).catch(error => {
                console.log("request failed", error);
                alert("Looks like you don't have any groups yet");
                throw error;
            })
        });
    })

}

async function show_groups_func(){
    console.log("in show groups func");
    //calling the getAPIkeys api
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
    for (var i = 0; i < options.length; i++) {
        var opt = options[i];
        select.innerHTML += "<option value=\"" + opt + "\">" + opt + "</option>";
    }


}

async function show_workflows_func(){
    await syncToOnTask();
    console.log("in show workflow func");
    console.log(groups_dropdown.value);
    groupName=groups_dropdown.value;
    console.log(groupName);
    //getting the api of the group
    for(var i=0; i<myGroupsList.length; i++){
        if(myGroupsList[i].group_name===groupName) {
            groupAPI=myGroupsList[i].API_key;
            console.log(groupAPI);
        }
    }
    user_workflows =await getWorkflowInfoCall();
    console.log("workflows from show workflows");
    console.log(user_workflows);

    //initializing selectworkflows dropdown list
    var select = document.getElementById("selectWorkflow");
    var options = user_workflows;
    // Optional: Clear all existing options first:
    select.innerHTML = "";
    //console.log("length of options is"+options.length);
    // Populate list with options:
    for (var i = 0; i < options.length; i++) {
        var opt = options[i];
        select.innerHTML += "<option value=\"" + opt + "\">" + opt + "</option>";
    }

}

async function getWorkflowInfoCall(){
    //user the groupName to get apikey
    console.log("from getWorkflowInfocall");
    return new Promise(function(resolve, reject) {

        chrome.storage.local.get("token", (data) => {
            const user_token = data.token;
            axios.get(`${apiBaseURL}/users/getWorkflows/${groupAPI}`,
                {
                    headers: {
                        "Authorization": user_token
                    }
                }
            )
                .then(res => {
                    workflowInfo = res.data;
                    console.log("data from call");
                    console.log(workflowInfo);

                    workflowInfo.map(el => workflowInfoNames.push(el.workflow_name));
                    console.log("workflow names from api call");
                    console.log(workflowInfoNames);
                    resolve(workflowInfoNames);
                }).catch(error => {
                console.log("request failed", error);
                alert(error);
                throw error;
            });
        });
        //store the apikey in chrome storage

    })
}

async function getWorkflowParams(){
    selectedWorkflowName="";
    selectedWorkflowId="";
    return new Promise(function(resolve, reject) {
        console.log("in get workflow params");
        //get the workflowID
        //console.log(workflows_dropdown.value);
        selectedWorkflowName = workflows_dropdown.value;
        console.log(selectedWorkflowName);
        //getting the id of the workflow
        for (var i = 0; i < workflowInfo.length; i++) {
            if (workflowInfo[i].workflow_name === selectedWorkflowName) {
                selectedWorkflowId = workflowInfo[i].workflow_id;
                console.log(selectedWorkflowId);
            }
        }
        //api call
        chrome.storage.local.get("token", (data) => {
                const user_token = data.token;
                axios.get(`${apiBaseURL}/users/getWorkflowParam/${selectedWorkflowId}`,
                    {
                        headers: {
                            "Authorization": user_token

                        }
                    }
                ).then(res => {
                        var paramsObj = res.data;
                        //console.log("from getparamsInfo func:"+paramsObj);
                        console.log(paramsObj);
                        resolve(paramsObj);
                    }
                ).catch(error => {
                    console.log("request failed", error);
                    alert(error);
                    throw error;
                });
            }
        );

    })
}

async function show_workflowParams_func(){
    //paramsInfo;//stores the res of getWorkflowParams api (without values)
    paramsInfoNames=[]; //stores the names of the fields in the pramsInfo object
    paramsInfoWithValues=[];//stores the object paramsInfo with the user input filled in the values
    console.log("in show_workflowparams");
    paramsInfo=await getWorkflowParams();
    var listOfParams=paramsInfo;
    //if the object does not have name key get info using the label key
    if(("name" in listOfParams[0])) {
        //gets the paramsInfoNames only
        listOfParams.map(el => paramsInfoNames.push(el.name));
    }
    else if ("label" in listOfParams[0]){
        //gets the paramsInfoNames only
        listOfParams.map(el => paramsInfoNames.push(el.label));
    }
    //makes a copy of the data to edit (fill user values) and send in api call
    listOfParams.map(el=>paramsInfoWithValues.push(el));
    console.log("ParamsInfo Names:"+paramsInfoNames);

    //creating text fields to take inputs for each paramInfoName
    f = document.createElement("form");
    f.setAttribute('method',"post");

    //Dynamically creating fields for the parameters
    for (var i = 0; i < paramsInfoNames.length; i++) {
        if(paramsInfoNames[i]!=="myFile") {
            //create fields out of the name element
            var el = document.createElement("p");
            var el2 = document.createElement("input");
            el.id = paramsInfoNames[i];
            el.textContent = paramsInfoNames[i];

            //input boxes ids recipient_email_address_value & myFile_value etc
            el2.type = "text";
            el2.name = paramsInfoNames[i] + "_name";
            el2.id = paramsInfoNames[i] + "_value";

            f.appendChild(el);
            f.appendChild(el2);
            document.getElementsByTagName('form')[0].appendChild(f);
        }

    }
}
function saveParams(){
    userParamValues=[];
    //catching the user's param values into userParamValues array
    for (var i = 0; i < paramsInfoNames.length; i++) {
        if(paramsInfoNames[i]!=="myFile") {
            let str = paramsInfoNames[i] + "_value";

            let user_param = document.getElementById(str).value;
            //trim all white spaces if email
            if(paramsInfoNames[i].includes("email")){
                user_param=user_param.replace(/\s/g,'');
            }
            else //trim white spaces at ends
            {
                user_param=user_param.trim();
            }
            console.log(user_param);
            userParamValues[i] = user_param;
        }

    }
    //console.log("paramsInfo before:"+JSON.stringify(paramsInfoWithValues));
    //filling the object paramsInfo with the values of the params in userParamValues
    for (var i = 0; i < paramsInfoWithValues.length; i++) {
        paramsInfoWithValues[i]['value']=userParamValues[i];
    }
    console.log("Filled in params:"+JSON.stringify(paramsInfoWithValues));

    //saving paramsInfoWithValues to chrome local storage
    chrome.storage.local.set({ paramsValues: paramsInfoWithValues });
}

async function getDocumentID(){
    let url_;
    let substrings;
    //check if a document is open
    //gets document ID and saves it to storage
    await chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        url_ = tabs[0].url;
        let docFixedURL = url_.slice(0, 35);
        if (docFixedURL !== "https://docs.google.com/document/d/") {
            document.getElementById("ID").style.display="block";
            document.getElementById("ID").innerHTML = "Please open a google doc to get doc ID";
        } else {
            console.log("on a google doc!!!");
            substrings = url_.split('/', 7);

            docID = substrings[5];
            chrome.storage.local.set({documentID: docID});
            console.log("google doc ID set!!!");
        }
    });
}

async function isOnGoogleDoc(){
    let urlToCheck;
    //check if a document is open
    //gets document ID and saves it to storage
    await chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        urlToCheck = tabs[0].url;
        let currentURL = urlToCheck.slice(0, 35);
        console.log(currentURL === "https://docs.google.com/document/d/");
        return (currentURL === "https://docs.google.com/document/d/");
    });
}
function getAllInfoInStorage(){

    //get info for API from storage
    return new Promise(function(resolve, reject) {
        chrome.storage.local.get(null, (data) => {
            console.log("DATA USED FOR SENDTOONTASK API CALL");
            console.log(data);
            resolve(data);
        })

    })
}

async function sendToOnTaskCall(){
    console.log("in send to on task call");
    let dataForRequest = await getAllInfoInStorage();
    let paramsValuesStorage;
    let workflowIDStorage;
    let apiKeyStorage;
    let docIdStorage;
    let user_token;

    paramsValuesStorage = dataForRequest.paramsValues;
    workflowIDStorage = dataForRequest.selectedWorkflowId;
    apiKeyStorage = dataForRequest.apiKey;
    docIdStorage = dataForRequest.documentID;
    user_token = dataForRequest.token;

    console.log("params in variables");
    console.log(paramsValuesStorage);
    console.log(workflowIDStorage);
    console.log(apiKeyStorage);
    console.log(docIdStorage);

    //api call to send document
    axios.post(`${apiBaseURL}/users/sendDocToOnTask/${docIdStorage}`,
        {
            params: paramsValuesStorage,
            workflowID: workflowIDStorage,
            apiKey: apiKeyStorage

        }, {
            headers: {
                "Authorization": user_token
            }
        }
    )
        .then(res => {
            if(res.status===200) {
                alert("Workflow started successfully");
            }
        }).catch(error => {
        console.log("request failed", error);
        alert(error);
        throw error;
    });

    console.log("document sent!");
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
        ).catch(error => {
            console.log("request failed", error);
            alert(error);
            throw error;
        });
    })
}

async function anchors_help_dropdown_func(){
    //Field Names
    const list_anchor_strings=["Name","Signature","Date","Checkbox","Initials","Text Box"];
    var select1 = anchors_dropdown;
    var options1 = list_anchor_strings;
    select1.innerHTML = "";
    select1.innerHTML += "<option value=\"" + "Field Name" + "\">" + "Field Name" + "</option>";
    for (var i = 0; i < options1.length; i++) {
        var opt1 = options1[i];
        select1.innerHTML += "<option value=\"" + opt1 + "\">" + opt1 + "</option>";
    }

    //Letters
    const list_alphabets=["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];
    var select2 = alphabets_dropdown;
    var options2 = list_alphabets;
    select2.innerHTML = "";
    select2.innerHTML += "<option value=\"" + "Letter" + "\">" + "Letter" + "</option>";
    for (var j = 0; j < options2.length; j++) {
        var opt2 = options2[j];
        select2.innerHTML += "<option value=\"" + opt2 + "\">" + opt2 + "</option>";
    }
}
//generate and copy anchor string
if(copy_logo) {
    copy_logo.addEventListener("click", generate_anchor);
}
async function generate_anchor(){
    var final_anchor= "%"+anchors_dropdown.value+alphabets_dropdown.value+"%";
    console.log(final_anchor);
    document.getElementById("concat-anchor").innerHTML=final_anchor;
    console.log("Copy logo clicked");
    var copyText = document.getElementById("concat-anchor").innerHTML;

    console.log(copyText);
    //copy text to clipboard
    await navigator.clipboard.writeText(copyText);
}



