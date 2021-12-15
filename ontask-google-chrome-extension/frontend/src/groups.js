console.log('groups.js page');
const axios = require('axios');
const apiBaseURL = "https://stag-ontask-bridge-api.phiquest.com";

let apiKey;
let groupName;
let workflowInfo;

const add_group = document.getElementById('add-group');
const group_name = document.getElementById('group-name');
const group_token = document.getElementById('group-token');
const logout_logo = document.getElementById('logout-logo');

chrome.storage.local.get(['token', 'new_user'], (data) => {
  console.log('typeof data.new_user: ');
  console.log(typeof data.new_user);
});

if (add_group) {
  add_group.addEventListener('click', add_group_func);
}
if (logout_logo) {
  logout_logo.addEventListener('click', logout);
}

/*function check_token(){
    chrome.storage.local.get("token", (data) => {
        if (data.token == undefined) {
            document.location.href = "login.html";
        }

    });
}*/

function logout() {
  console.log('log out clicked!');
  chrome.storage.local.clear();
  //resetting the login button
  document.location.href = 'login.html';
}

function add_group_func() {
  console.log('clicked add group');
  console.log(group_name.value);
  console.log(group_token.value);
  //for api calls
  groupName = group_name.value;
  apiKey = group_token.value;
  apiKey = apiKey.replace(/\s/g,'');
  console.log(groupName);
  console.log(apiKey);

  storeAPIKeyCall();
  //resets fields in UI
  group_name.value = null;
  group_token.value = null;
  document.getElementById('success-message').innerText =
    'Successfully added group';
}

function storeAPIKeyCall() {
  chrome.storage.local.get('token', (data) => {
    const user_token = data.token;

    axios.post(`${apiBaseURL}/users/storeAPIKey/${apiKey}`,
        {
          groupName: groupName,
        },
        {
          headers: {
            Authorization: user_token,
          },
        }
      )
      .then((res) => {
        workflowInfo = res.data;
        console.log('THIS IS RES STATUS FROM STORE API');
        console.log(res.status);
        console.log(workflowInfo);
      }
      ).catch(error => {
      console.log("request failed", error);
      alert(error);
      throw error;
    })
  });
}
