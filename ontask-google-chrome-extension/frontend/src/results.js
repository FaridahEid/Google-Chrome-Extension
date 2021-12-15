const axios = require('axios');

console.log("the start of results.js");

const logout_logo= document.getElementById("logout-logo");
const get_webhook=document.getElementById("get-webhook-button");
const show_webhook_div=document.getElementById("show-webhook");
const copy_logo=document.getElementById("clipboard-icon");
const copied_logo=document.getElementById("check-clipboard-icon");
const copy_prompt=document.getElementById("copy-prompt");

window.addEventListener('load',async function(){
    chrome.storage.local.get(null, (data) => {
        console.log("storage on load");
        console.log(data);
    })
});


//listeners
if(logout_logo){
    logout_logo.addEventListener("click", logout);
}
if(get_webhook){
    get_webhook.addEventListener("click", getWebhookLinkCall);
    console.log("get webhook clicked!");

}
if(copy_logo){
    copy_logo.addEventListener("click", copyFunc);
    //copy_logo.style.visibility="hidden";
    //copied_logo.style.visibility="visible";
}

async function getWebhookLinkCall(){
    return new Promise(function(resolve, reject) {
        chrome.storage.local.get(null, async (data) => {
            //const workflowID = data.selectedWorkflowId;
            console.log(data);
            console.log("this is the workflow ID selected");
            //console.log(data.selectedWorkflowId);
            let workflowID = data.selectedWorkflowId;
            let user_token = data.token;
            await axios.get(`http://localhost:80/webhooks/getWebhookLink/${workflowID}`,
                {
                    headers: {
                        "Authorization": user_token
                    }
                }
            ).then(res => {
                    console.log(res.data);
                    document.getElementById("user_webhook").innerHTML = res.data;
                    copy_logo.style.visibility="visible";
                    copy_prompt.style.visibility="visible";
                    resolve(res.data);
                }
            )
        });
        console.log("done with getting webhook Link CALL");
    })

}

function logout(){
    console.log("log out clicked!");
    chrome.storage.local.clear();
    //resetting the login button
    document.location.href = 'login.html';
}

function copyFunc(){
    console.log("Copy logo clicked");
    var copyText = document.getElementById("user_webhook").innerHTML;

       //const selection = document.getSelection();

       console.log(copyText);
       //copy text to clipboard
       navigator.clipboard.writeText(copyText);


}
