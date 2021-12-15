document.getElementById('groups').addEventListener('click', function () {
  //alert("redirecting..");

  document.location.href = 'groups.html';
});

document.getElementById('send').addEventListener('click', function () {
  //alert("redirecting..");

  document.location.href = 'send.html';
});

document.getElementById('misc').addEventListener('click', function () {
  //alert("redirecting..");

  document.location.href = 'misc.html';
});

document.getElementById('create').addEventListener('click', function () {
  //alert("redirecting..");

  document.location.href = 'create.html';
});

// Tutorial Navigation

if (document.getElementById('tutorial-button-1') != null) {
  document
    .getElementById('tutorial-button-1')
    .addEventListener('click', function () {
      //alert("redirecting..");

      document.location.href = '2_send.html';
    });
}

if (document.getElementById('tutorial-button-2') != null) {
  document
    .getElementById('tutorial-button-2')
    .addEventListener('click', function () {
      document.location.href = '3_create.html';
      console.log('Button 2');
    });
}

if (document.getElementById('tutorial-button-3') != null) {
  document
    .getElementById('tutorial-button-3')
    .addEventListener('click', function () {
      //alert("redirecting..");
      document.location.href = '../pages/groups.html';
    });
}

if (document.getElementById('what-is-anchor') != null) {
  document
    .getElementById('what-is-anchor')
    .addEventListener('click', function () {
      //alert("redirecting..");
      document.location.href = '../tutorial-pages/anchor_1_.html';
    });
}

if (document.getElementById('what-is-sheets') != null) {
  document
    .getElementById('what-is-sheets')
    .addEventListener('click', function () {
      //alert("redirecting..");
      document.location.href = '../tutorial-pages/sheets_1_.html';
    });
}

document
  .getElementById('help-find-token')
  .addEventListener('click', function () {
    //alert("redirecting..");
    document.location.href = '../tutorial-pages/token_1_.html';
  });
