var  loggedIn = false;
firebase.auth().onAuthStateChanged(function (user) {
    if (!user) {
        if (!loggedIn) {
            document.title = "403 Forbidden";
            document.write("Forbidden : Login First");
            loggedIn = true;
        }        
        location.replace("/index.html");
    } else {
        //user = firebase.auth().currentUser;
        //Snackbar.show({text: 'Signed in as ' + user.displayName});
        
    }
});
  