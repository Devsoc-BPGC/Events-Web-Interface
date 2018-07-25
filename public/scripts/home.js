"use strict";
//ESLINT rules 
/*global toastr firebase*/
$(function () {
    //Set Log out button
    $("#btn-user-log-out").click(function () {
        firebase.auth().signOut().then(function () {
            location.replace("/index.html");
        })
        .catch(function (error) {
            
        });
    });
});