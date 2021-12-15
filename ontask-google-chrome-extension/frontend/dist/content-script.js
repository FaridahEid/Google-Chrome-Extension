if (window.location.href.indexOf('/users/callback') > -1) {
  console.log('cs');
  const params = new URLSearchParams(window.location.search);

  chrome.storage.local.set({ token: params.get('token') });
  chrome.storage.local.set({ new_user: params.get('new_user') });
  window.close();
}

// chrome.runtime.onInstalled.addListener(function(){
// 	alert("first time user");
// 	document.location.href = "tutorial0.html";
// });

// alert("message from content script");
