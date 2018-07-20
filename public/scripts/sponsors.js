//ESLINT rules 
/*global toastr firebase*/
var dbRef;
var storageRef;
var sponsorEditData = new Object();
var $originalTemplate;
var valueEventOccured = true;
var firstTime = true; /*To run a code segment just once*/
$(document).ready(function () {
	
	dbRef = firebase.database().ref().child("sponsors").orderByKey();
	
	/*Implement onchange listener for dbRef */
	dbRef.on("value",(snap) => {

		valueEventOccured = true;
		$("#sponsors-data").empty();

		snap.forEach(function (childSnap) {
			
			var sponsorId = childSnap.key;
			var sponsorClickUrl = childSnap.child("clickUrl").val();
			var sponsorLogo = childSnap.child("logo").val();
			var sponsorName = childSnap.child("name").val();

			sponsorEditData[sponsorId] = {

				sponsorClickUrl : sponsorClickUrl,
				sponsorLogo : sponsorLogo,
				sponsorName : sponsorName,
				fileLoc : null

			};

			var template = "<div id='"+sponsorId+"' class='col-lg well-lg bg-1 div-mod '>"
			+"<h3>Sponsor Name:<span class='sponsor-name'>"+sponsorName+"</span></h3>"
			+"<h3>Sponsor Link:<span class='sponsor-link'>"+sponsorClickUrl+"<span></h3>"
			+"<img src='"+sponsorLogo+"' class='img-responsive img-1 alt='"+sponsorName+"' '><br>"
			+"<input type='button' class='btn btn-primary' value='Edit' onclick='editSponsor(this.parentNode.id,$(this))'>"
			+"</div>";

			$("#sponsors-data").append($(template));
		});
			
		/*This code must execute only the first time the value event triggers */
		if(firstTime){
			$("#add-new-sponsor").hide();
			var t=1;
			$("#add-sponsor-btn").click(function () {			

				if(t) {

					$(this).val("Cancel");
					
				} else {
					$(this).val("Add New Sponsor");
				}
				t^=1;
				$("#add-new-sponsor").fadeToggle();						
			});
			$("#add-new-div").show();
			firstTime = false;	
		}
	},
		function error(dberror) {
			console.error(dberror.message);
		}
	);
	

});

function editSponsor(parentId,btnRef) {

	
	$originalTemplate = $("#"+parentId).clone();
	$("#" +parentId+" .sponsor-name").replaceWith($("<input class='sponsor-name' type='text' value='"+
							$("#"+parentId+" .sponsor-name").text()+"' >"));
	$("#" +parentId+" .sponsor-link").replaceWith($("<input class='sponsor-link' type='text' value='"+
							$("#"+parentId+" .sponsor-link").text()+"' >"));
	btnRef.val("Save");
	$("#"+parentId+" img").after($("<br><input type='button' class='btn btn-secondary' value='Change Image'><br>")
							.click(function () {
								//Change image
								changeImage($(this),parentId);
							}));

	$("#"+parentId).append($("<div class='delete-sponsor'><br><br>"+
	"<input type='button' class='btn btn-danger' value='Delete Sponsor'></div>")
					.click(function () {
						
						var desertRef = firebase.storage().refFromURL(sponsorEditData[parentId].sponsorLogo);
						desertRef.delete().then(function () {
							deleteFromDatabase();							
						})
						.catch(function (error) {
							console.error(error);
						});
						function deleteFromDatabase() {
							var dbRef = firebase.database().ref()
								.child("sponsors")
								.child(parentId);
							dbRef.remove(function () {
								delete sponsorEditData[parentId];
							});							
						}
					}));

	$("#"+parentId).append($("<div class='cancel-btn'><br><input type='button' class='btn btn-danger' value='Cancel'></div>")
					.click(function () {
						
						sponsorEditData[parentId].fileLoc = null;
						$("#"+parentId).replaceWith($originalTemplate);
						
						
						
					}));
	btnRef.attr("onclick","saveSponsor(this.parentNode.id,$(this))");

}

function saveSponsor(parentId,btnRef){

	
	var storageRef = firebase.storage().ref("sponsors-logo/");

	//Check pre conditions
	if($("#"+parentId+" .sponsor-name").val() != ""){
		sponsorEditData[parentId].sponsorName = $("#"+parentId+" .sponsor-name").val();
		
	}
	else {
		alert("Error : Enter a valid Sponsor name");
		return;
	}

	if($("#"+parentId+" .sponsor-link").val() != ""){
		sponsorEditData[parentId].sponsorClickUrl = $("#"+parentId+" .sponsor-link").val();
		
	}
	else {
		alert("Error : Enter a valid Sponsor link");
		return;
	}

	if(sponsorEditData[parentId].fileLoc == null)
	{
		updateDatabase(parentId);
	}
	else{
		//Delete pre-existing logo image file from Firebase Storage
		var desertRef = firebase.storage().refFromURL(sponsorEditData[parentId].sponsorLogo);
		//Discarding older image 
		desertRef.delete().then(function () {
			
			uploadNewImage(parentId);

		}).catch(function (error) {
			console.error(error);
		});		
	}
}

function uploadNewImage(parentId) {

	//Upload new logo to Firebase Storage
	storageRef = firebase.storage().ref("sponsors-logo/" + 
									sponsorEditData[parentId].fileLoc.name);
	var uploadTask = storageRef.put(sponsorEditData[parentId].fileLoc);

	//Update progress bar
	uploadTask.on("state_changed",

		function progress(snapshot) {
				
			var percentage = (snapshot.bytesTransferred/snapshot.totalBytes)*100;
			$("#prog"+parentId).css("width",percentage+"%");
			$("#prog"+parentId).attr("aria-valuenow",percentage+"%");
			$("#prog"+parentId).text(percentage+"%");
		},

		function error(errorarg) {
				
			console.error(errorarg);
		},

		function complete(argument) {

			//New image uploaded
			storageRef.getDownloadURL().then(function (url) {	
				
				sponsorEditData[parentId].sponsorLogo = url;
				updateDatabase(parentId);
			});		
		}	
	);
}

//Update firebase database
function updateDatabase(parentId) {
		
	var dbRef = firebase.database().ref().child("sponsors");

	
	valueEventOccured = false;
	dbRef.child(parentId).set({

		clickUrl : sponsorEditData[parentId].sponsorClickUrl,
		logo : sponsorEditData[parentId].sponsorLogo,
		name : sponsorEditData[parentId].sponsorName

	},
	function error(errorArg) {			
			
		if(errorArg){
			console.error(errorArg);
		} else {
			//Data updated successfully
			if(valueEventOccured == false) {
				$("#"+parentId+" .cancel-btn").click();
			}			
		}

	});
}


function changeImage(changeImageBtnRef,parentId) {

	$("#"+parentId+" .prog-bar").remove();
 	var inputFile = $("<input class='inputFile' type='file' >").click(function () {
		changeImageBtnRef.after($("<div class='prog-bar'><br><br><div class='progress'>"+
								"<div id='prog"+parentId+"' class='progress-bar progress-bar-success' "+
								"role='progressbar' aria-valuenow='0' aria-valuemin='0' "+
								"aria-valuemax='100' style='width:0%;'>0%"+
								"</div></div></div>"));
		
		$(this).on("change",function (e) {
			
			// Get file
			var file = e.target.files[0];
			if(file.type.search("image/") === 0) {
				$("#"+parentId+" img").attr("src",""+URL.createObjectURL(file));
				sponsorEditData[parentId].fileLoc = file;
				
			}
			else {
				alert("Error : File not an image");
			}
		});
	});
	inputFile.click();	
}
var addLogofile = null;
function getSponsorLogo() {
	
	var addLogoInput = $("<input type='file'>");
	addLogoInput.change(function (e) {

		addLogofile =  e.target.files[0];
		if (addLogofile.type.search("image/") === 0) {
			
			$("#add-sponsor-preview").attr("src",URL.createObjectURL(addLogofile)).show();
		} else {
			alert("Error: File not an image");
			addLogofile = null;
		}	
	});

	addLogoInput.click();		
}

function addSponsorToDatabase() {
	
	var addSponsorName; 
	var addSponsorLink; 
	var addSponsorLogo;

	if ($("#add-sponsor-name").val()) {
	 addSponsorName = $("#add-sponsor-name").val();
	} else {
		alert("Error : Enter a valid Sponsor name");
		return;
	}

	if ($("#add-sponsor-link").val()) {
		addSponsorLink = $("#add-sponsor-link").val();
	} else {
		alert("Error : Enter a valid Sponsor link");
		return;
	}

	if (addLogofile == null) {
		alert("Error : Upload a valid Sponsor Logo");
		return;
	}


	var dbRef = firebase.database().ref().child("sponsors");
	var newSponsorId = dbRef.push().key;

	var storageRef = firebase.storage().ref("sponsors-logo/" + 
										addLogofile.name);

	var task = storageRef.put(addLogofile);

	task.on("state_changed",

		function progress(snapshot) {
			$("#save-sponsor-progress-bar").show();
			var percentage = (snapshot.bytesTransferred/snapshot.totalBytes)*100;
			$("#uploader").css("width",percentage+"%");
			$("#uploader").attr("aria-valuenow",percentage+"%");
			$("#uploader").text(percentage+"%");
		},

		function error(error) {
			// body...
		},

		function complete(event) {
			storageRef.getDownloadURL().then(function (url) {
				addSponsorLogo = url;
				dbRef.child(newSponsorId).set(
					{

						clickUrl : addSponsorLink,
						logo : addSponsorLogo,
						name : addSponsorName
					},
					function error(errorarg) {
						if(errorarg){
							console.error(errorarg);
						} else {

								//Resetting Add new Sponsor
								$("#add-sponsor-btn").click();
								$("#save-sponsor-progress-bar").hide();
								$("#add-sponsor-preview").hide();
								$("#add-sponsor-name").val("");
								$("add-sponsor-link").val("");
								addLogofile = null;


						}
					}
				);
			});
		}
	);
}