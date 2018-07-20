//ESLINT rules 
/*global toastr firebase*/
var dbRef;
var storageRef;
var speakerEditData = new Object();
var valueEventOccured = true;
var firstTime = true; /*To run a code segment just once*/
$(document).ready(function () {

	dbRef = firebase.database().ref().child("speakers").orderByKey();

	/*Implement onchange listener for dbRef */
	dbRef.on("value",snap => {

		valueEventOccured = true;
		$("#speakers-data").empty();

		snap.forEach(function (childSnap) {

			var speakerId = childSnap.key;
			var speakerClickUrl = childSnap.child('onClickUrl').val();
			var speakerLogo = childSnap.child('imageUrl').val();
			var speakerName = childSnap.child('name').val();
      var speakerDesc = childSnap.child('desc').val();

			speakerEditData[""+speakerId] = {

				speakerClickUrl : speakerClickUrl,
				speakerLogo : speakerLogo,
				speakerName : speakerName,
        speakerDesc : speakerDesc,
				fileLoc : null

			};

			var template = '<div id="'+speakerId+'" class="col-lg well-lg bg-1 div-mod ">'
			+'<h3>Speaker Name:<span class="speaker-name">'+speakerName+'</span></h3>'
      +'<h3>Speaker Description:<span class="speaker-desc">'+speakerDesc+'</span></h3>'
			+'<h3>Speaker Link:<span class="speaker-link">'+speakerClickUrl+'<span></h3>'
			+'<img src="'+speakerLogo+'" class="img-responsive img-1 alt="'+speakerName+'" "><br>'
			+'<input type="button" class="btn btn-primary" value="Edit" onclick="editSpeaker(this.parentNode.id,$(this))">'
			+"</div>";

			$('#speakers-data').append($(template));
		});

		/*This code must execute only the first time the value event triggers */
		if(firstTime){
			$('#add-new-speaker').hide();
			var t=1;
			$('#add-speaker-btn').click(function () {

				if(t) {

					$(this).val("Cancel");

				} else {
					$(this).val("Add New Speaker");
				}
				t^=1;
				$('#add-new-speaker').fadeToggle();
			});
			$('#add-new-div').show();
			firstTime = false;
		}
	},
		function error(dberror) {
			console.error(dberror);
		}
	);


});

function editSpeaker(parentId,btnRef) {


	console.log("editSpeaker() called");
	$originalTemplate = $("#"+parentId).clone();
	$("#" +parentId+" .speaker-name").replaceWith($('<input class="speaker-name" type="text" value="'+
							$("#"+parentId+" .speaker-name").text()+'" >'));
  $("#" +parentId+" .speaker-desc").replaceWith($('<input class="speaker-desc" type="text" value="'+
            	$("#"+parentId+" .speaker-desc").text()+'" >'));
	$("#" +parentId+" .speaker-link").replaceWith($('<input class="speaker-link" type="text" value="'+
							$("#"+parentId+" .speaker-link").text()+'" >'));
	btnRef.val("Save");
	$("#"+parentId+" img").after($('<br><input type="button" class="btn btn-secondary" value="Change Image"><br>')
							.click(function () {
								console.log("Change image");
								changeImage($(this),parentId);
							}));

	$("#"+parentId).append($('<div class="delete-speaker"><br><br>'+
	'<input type="button" class="btn btn-danger" value="Delete Speaker"></div>')
					.click(function () {
						console.log("Deleted");
						var desertRef = firebase.storage().refFromURL(speakerEditData[parentId].speakerLogo);
						desertRef.delete().then(function () {
							deleteFromDatabase();
						})
						.catch(function (error) {
							console.error(error);
						});
						function deleteFromDatabase() {
							var dbRef = firebase.database().ref()
								.child("speakers")
								.child(parentId);
							dbRef.remove(function () {
								delete speakerEditData[parentId];
							});
						}
					}));

	$("#"+parentId).append($('<div class="cancel-btn"><br><input type="button" class="btn btn-danger" value="Cancel"></div>')
					.click(function () {
						console.log("Cancelled");
						speakerEditData[parentId].fileLoc = null;
						$("#"+parentId).replaceWith($originalTemplate);



					}));
	btnRef.attr('onclick','saveSpeaker(this.parentNode.id,$(this))');

}

function saveSpeaker(parentId,btnRef){

	console.log("saveSpeaker() called");
	var storageRef = firebase.storage().ref('speakers-image/');

	//Check pre conditions
	if($("#"+parentId+" .speaker-name").val() != ""){
		speakerEditData[parentId].speakerName = $("#"+parentId+" .speaker-name").val();
	}
	else {
		alert("Error : Enter a valid Speaker name");
		return;
	}

  if($("#"+parentId+" .speaker-desc").val() != ""){
		speakerEditData[parentId].speakerDesc = $("#"+parentId+" .speaker-desc").val();
	}
	else {
		alert("Error : Enter a valid Speaker description");
		return;
	}

	if($("#"+parentId+" .speaker-link").val() != ""){
		speakerEditData[parentId].speakerClickUrl = $("#"+parentId+" .speaker-link").val();

	}
	else {
		alert("Error : Enter a valid Speaker link");
		return;
	}

	if(speakerEditData[parentId].fileLoc == null)
	{
		updateDatabase(parentId);
	}
	else{
		//Delete pre-existing logo image file from Firebase Storage
		var desertRef = firebase.storage().refFromURL(speakerEditData[parentId].speakerLogo);
		desertRef.delete().then(function () {
			console.log("Older image discarded");
		}).catch(function (error) {
			console.error(error);
		});
		uploadNewImage(parentId);

	}
}

function uploadNewImage(parentId) {

	//Upload new logo to Firebase Storage
	storageRef = firebase.storage().ref('speakers-image/' +
									speakerEditData[parentId].fileLoc.name);
	var uploadTask = storageRef.put(speakerEditData[parentId].fileLoc);

	//Update progress bar
	uploadTask.on('state_changed',

		function progress(snapshot) {

			var percentage = (snapshot.bytesTransferred/snapshot.totalBytes)*100;
			$('#prog'+parentId).css('width',percentage+'%');
			$('#prog'+parentId).attr('aria-valuenow',percentage+'%');
			$('#prog'+parentId).text(percentage+'%');
		},

		function error(errorarg) {

			console.error(errorarg);
		},

		function complete(argument) {

			console.log("New image uploaded");
			storageRef.getDownloadURL().then(function (url) {
				console.log("New Image URL: "+url);
				speakerEditData[parentId].speakerLogo = url;
				updateDatabase(parentId);
			});
		}
	);
}

//Update firebase database
function updateDatabase(parentId) {

	var dbRef = firebase.database().ref().child("speakers");

	console.log(dbRef);
	valueEventOccured = false;
	dbRef.child(parentId).set({

		onClickUrl : speakerEditData[parentId].speakerClickUrl,
		imageUrl : speakerEditData[parentId].speakerLogo,
		name : speakerEditData[parentId].speakerName,
    desc : speakerEditData[parentId].speakerDesc

	},
	function error(errorArg) {

		if(errorArg){
			console.error(errorArg);
		} else {
			console.log("Data updated successfully");
			if(valueEventOccured == false) {
				$("#"+parentId+" .cancel-btn").click();
			}
		}

	});
}


function changeImage(changeImageBtnRef,parentId) {

	console.log("changeImage() called 1");
 	$("#"+parentId+" .prog-bar").remove();
 	var inputFile = $('<input class="inputFile" type="file" >').click(function () {
		changeImageBtnRef.after($('<div class="prog-bar"><br><br><div class="progress">'+
								'<div id="prog'+parentId+'" class="progress-bar progress-bar-success" '+
								'role="progressbar" aria-valuenow="0" aria-valuemin="0" '+
								'aria-valuemax="100" style="width:0%;">0%'+
								'</div></div></div>'));

		$(this).on('change',function (e) {

			// Get file
			var file = e.target.files[0];
			if(file.type.search("image/") === 0) {
				$("#"+parentId+" img").attr('src',''+URL.createObjectURL(file));
				speakerEditData[""+parentId].fileLoc = file;
				console.log(speakerEditData);
			}
			else {
				alert("Error : File not an image");
			}
		});
	});
	inputFile.click();
}
var addLogofile = null;
function getSpeakerLogo() {

	var addLogoInput = $('<input type="file">');
	addLogoInput.change(function (e) {

		addLogofile =  e.target.files[0];
		if (addLogofile.type.search("image/") === 0) {

			$("#add-speaker-preview").attr('src',URL.createObjectURL(addLogofile)).show();
		} else {
			alert("Error: File not an image");
			addLogofile = null;
		}
	});

	addLogoInput.click();
}

function addSpeakerToDatabase() {

	var addSpeakerName;
	var addSpeakerLink;
	var addSpeakerLogo;
  var addSpeakerDesc;

	if ($("#add-speaker-name").val()) {
	 addSpeakerName = $("#add-speaker-name").val();
	} else {
		alert("Error : Enter a valid Speaker name");
		return;
	}

  if ($("#add-speaker-desc").val()) {
   addSpeakerDesc = $("#add-speaker-desc").val();
  } else {
    alert("Error : Enter a valid Speaker description");
    return;
  }

	if ($("#add-speaker-link").val()) {
		addSpeakerLink = $("#add-speaker-link").val();
	} else {
		alert("Error : Enter a valid Speaker link");
		return;
	}

	if (addLogofile == null) {
		alert("Error : Upload a valid Speaker Logo");
		return;
	}


	var dbRef = firebase.database().ref().child("speakers");
	var newSpeakerId = dbRef.push().key;

	var storageRef = firebase.storage().ref('speakers-image/' +
										addLogofile.name);

	var task = storageRef.put(addLogofile);

	task.on('state_changed',

		function progress(snapshot) {
			$("#save-speaker-progress-bar").show();
			var percentage = (snapshot.bytesTransferred/snapshot.totalBytes)*100;
			$('#uploader').css('width',percentage+'%');
			$('#uploader').attr('aria-valuenow',percentage+'%');
			$('#uploader').text(percentage+'%');
		},

		function error(argument) {
			// body...
		},

		function complete(argument) {
			storageRef.getDownloadURL().then(function (url) {
				addSpeakerLogo = url;
				dbRef.child(newSpeakerId).set(
					{

						onClickUrl : addSpeakerLink,
						imageUrl : addSpeakerLogo,
						name : addSpeakerName,
            desc : addSpeakerDesc
					},
					function error(errorarg) {
						if(errorarg){
							console.error(errorarg);
						} else {

								//Resetting Add new Speaker
								$('#add-speaker-btn').click();
								$('#save-speaker-progress-bar').hide();
								$('#add-speaker-preview').hide();
								$('#add-speaker-name').val("");
                $('#add-speaker-desc').val("");
								$("#add-speaker-link").val("");
								addLogofile = null;


						}
					}
				);
			});
		}
	);
}
