// Initialize the FirebaseUI Widget using Firebase.
var ui = new firebaseui.auth.AuthUI(firebase.auth());

var uiConfig = {
callbacks: {
    signInSuccessWithAuthResult: function(authResult,redirectResult) {
    // User successfully signed in.
    console.log(authResult);
    var isAdmin = false;
    var dbRef = firebase.database().ref().child("webInterfaceUsers");
    dbRef.once("value").then((snapshot) => {
        snapshot.forEach(function (childSnap) {
            if (childSnap.val() == authResult.user.email) {
                isAdmin = true;
                return false;
            }
        });
        if (isAdmin) {
            location.replace("/home.html");
        } else {
            Snackbar.show({
                text: "Forbidden : Only Admins can Sign In.",
                textColor : "#dc3545",
                showAction : false  
            });
            firebase.auth().signOut().then(function () {
                setTimeout(() => {
                    location.replace("/index.html");
                }, 1500);
                
            });
        }

    });


    // Return type determines whether we continue the redirect automatically
    // or whether we leave that to developer to handle.
    return false;
    },
    uiShown: function() {
    // The widget is rendered.
    // Hide the loader.
    document.getElementById('loader').style.display = 'none';
    }
},
// Will use popup for IDP Providers sign-in flow instead of the default, redirect.
signInFlow: 'redirect',
//signInSuccessUrl: '/home.html',
signInOptions: [
    // Leave the lines as is for the providers you want to offer your users.
    {
        provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        customParameters: {
          // Forces account selection even when one account
          // is available.
          prompt: 'select_account'
        }
    }    
],
// Terms of service url.
//tosUrl: '<your-tos-url>'
};
  
// The start method will wait until the DOM is loaded.
// firebase.auth().onAuthStateChanged(function (user) {x   
//     if (user) {
//         // User is signed in.
//         //location.replace("/home.html")
//     } else {
//         //No user is signed in.
//         ui.start('#firebaseui-auth-container', uiConfig);
//     }
// });

ui.start('#firebaseui-auth-container', uiConfig);



