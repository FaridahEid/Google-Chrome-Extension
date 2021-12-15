const axios = require('axios');
const apiBaseURL = "https://stag-ontask-bridge-api.phiquest.com";


async function login() {
  await axios.get(`${apiBaseURL}/users/getAuthURL`).then((res) => {
    //chrome.tabs.create({url: res.data});
    window.open(res.data);
  }).catch(error => {
    console.log("request failed", error);
    alert(error);
    throw error;
  });
}

window.addEventListener('load', main);
function main() {
  document.getElementById('login').addEventListener('click', login);
}

chrome.storage.local.get(['token', 'new_user'], (data) => {
  let loginButton = document.getElementById('login');

  if (data.token === undefined) {
    loginButton.value = 'Sign in with Google';
  } else if (data.new_user == 'true') {
    chrome.storage.local.set({ new_user: 'false' });
    loginButton.value = 'Signed in';
    document.location.href = '../tutorial-pages/1_groups.html';
  } else {
    loginButton.value = 'Signed in';
    document.location.href = 'groups.html';
  }
});

//Fired when the extension is first installed, when the extension is updated to a new version,
//and when Chrome is updated to a new version.

chrome.runtime.onInstalled.addListener(function () {
  document.location.href = 'tutorial0.html';
});
