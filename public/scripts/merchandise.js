//ESLINT rules 
/*global toastr firebase*/
var dbRef;
var storageRef;
var merchandiseEditData = new Object();
var $originalTemplate;
var valueEventOccured = true;
var firstTime = true; /*To run a code segment just once*/
$(document).ready(function () {
	
	dbRef = firebase.database().ref().child("merch").orderByKey();
	
	/*Implement onchange listener for dbRef */
	dbRef.on("value",(snap) => {

		valueEventOccured = true;
		$("#merchandise-data").empty();

		snap.forEach(function (childSnap) {
			
			var merchandiseId = childSnap.key;
			var merchandiseClickUrl = childSnap.child("onClickUrl").val();
			var merchandiseImage = childSnap.child("imageUrl").val();
			var merchandiseName = childSnap.child("name").val();
			var merchandisePrice = childSnap.child("price").val();
			var merchandiseDescription = childSnap.child("desc").val();

			merchandiseEditData[merchandiseId] = {
				merchandiseClickUrl : merchandiseClickUrl,
				merchandiseImage : merchandiseImage,
				merchandiseName : merchandiseName,
				merchandisePrice : merchandisePrice,
				merchandiseDescription : merchandiseDescription,
				fileLoc : null

			};

			var template = "<div id='"+merchandiseId+"' class='col-lg well-lg bg-1 div-mod '>"
			+"<img src='"+merchandiseImage+"' class='img-responsive img-1 alt='"+merchandiseName+"' '><br>"
			+"<input type='button' class='btn btn-primary' value='Edit' onclick='editMerchandise(this.parentNode.id,$(this))'>"
			+"<h3>Merchanise Name:<span class='merchandise-name'>"+merchandiseName+"</span></h3>"
			+"<h3>Merchanise Description:<span class='merchandise-description'>"+merchandiseDescription+"</span></h3>"
			+"<h3>Merchanise Price:<span class='merchandise-price'>"+merchandisePrice+"</span></h3>"
			+"<h3>Merchanise Link:<span class='merchandise-link'>"+merchandiseClickUrl+"</span></h3>"
			+"</div>";
			
			$("#merchandise-data").append($(template));

		});
			
		/*This code must execute only the first time the value event triggers */
		if(firstTime){
			$("#add-new-merchandise").hide();
			var t=1;
			$("#add-merchandise-btn").click(function () {			

				if(t) {

					$(this).val("Cancel");
					
				} else {
					$(this).val("Add New Merchanise");
				}
				t^=1;
				$("#add-new-merchandise").fadeToggle();						
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
				merchandiseEditData[parentId].fileLoc = file;
				
			}
			else {
				alert("Error : File not an image");
			}
		});
	});
	inputFile.click();	
}

function uploadNewImage(parentId) {

	//Upload new image to Firebase Storage
	storageRef = firebase.storage().ref("merchandise-image/" + 
									merchandiseEditData[parentId].fileLoc.name);
	var uploadTask = storageRef.put(merchandiseEditData[parentId].fileLoc);

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
				
				merchandiseEditData[parentId].merchandiseImage = url;
				updateDatabase(parentId);
			});		
		}	
	);
}

//Update firebase database
function updateDatabase(parentId) {
		
	var dbRef = firebase.database().ref().child("merch");

	
	valueEventOccured = false;
	dbRef.child(parentId).set({

		onClickUrl : merchandiseEditData[parentId].merchandiseClickUrl,
		imageUrl : merchandiseEditData[parentId].merchandiseImage,
		name : merchandiseEditData[parentId].merchandiseName,
		price: merchandiseEditData[parentId].merchandisePrice ,
		desc: merchandiseEditData[parentId].merchandiseDescription

	},
	function error(errorArg) {			
			
		if(errorArg){
			console.error(errorArg);
		} else {
			//Data updated successfully
			if(valueEventOccured === false) {
				$("#"+parentId+" .cancel-btn").click();
			}			
		}

	});
}

function editMerchandise(parentId,btnRef) {

	
	$originalTemplate = $("#"+parentId).clone();
	$("#" +parentId+" .merchandise-name").replaceWith($("<input class='merchandise-name' type='text' value='"+
							$("#"+parentId+" .merchandise-name").text()+"' >"));
	$("#" +parentId+" .merchandise-link").replaceWith($("<input class='merchandise-link' type='text' value='"+
							$("#"+parentId+" .merchandise-link").text()+"' >"));

	$("#" +parentId+" .merchandise-price").replaceWith($("<input class='merchandise-price' type='text' value='"+
							$("#"+parentId+" .merchandise-price").text()+"' >"));

	$("#" +parentId+" .merchandise-description").replaceWith($("<input class='merchandise-description' type='text' value='"+
							$("#"+parentId+" .merchandise-description").text()+"' >"));
	btnRef.val("Save");
	$("#"+parentId+" .img").after($("<br><input type='button' class='btn btn-secondary' value='Change Image'><br>")
							.click(function () {
								//Change image
								changeImage($(this),parentId);
							}));

	$("#"+parentId).append($("<div class='delete-merchandise'><br><br>"+
	"<input type='button' class='btn btn-danger' value='Delete Merchandise'></div>")
					.click(function () {
						
						var desertRef = firebase.storage().refFromURL(merchandiseEditData[parentId].merchandiseImage);
						function deleteFromDatabase() {
							var dbRef = firebase.database().ref()
								.child("merch")
								.child(parentId);
							dbRef.remove(function () {
								delete merchandiseEditData[parentId];
							});
						desertRef.delete().then(function () {
							deleteFromDatabase();							
						})
						.catch(function (error) {
							console.error(error);
						});
													
						}
					}));

	$("#"+parentId).append($("<div class='cancel-btn'><br><input type='button' class='btn btn-danger' value='Cancel'></div>")
					.click(function () {
						
						merchandiseEditData[parentId].fileLoc = null;
						$("#"+parentId).replaceWith($originalTemplate);
						
						
						
					}));
	btnRef.attr("onclick","saveMerchandise(this.parentNode.id,$(this))");

}

function saveMerchandise(parentId,btnRef){

	
	var storageRef = firebase.storage().ref("merchandise-image/");

	//Check pre conditions
	if($("#"+parentId+" .merchandise-name").val() !== ""){
		merchandiseEditData[parentId].merchandiseName = $("#"+parentId+" .merchandise-name").val();
		
	}
	else {
		alert("Error : Enter a valid Merchandise name");
		return;
	}

	if($("#"+parentId+" .merchandise-link").val() !== ""){
		merchandiseEditData[parentId].merchandiseClickUrl = $("#"+parentId+" .merchandise-link").val();
		
	}
	else {
		alert("Error : Enter a valid Merchandise link");
		return;
	}

	if($("#"+parentId+" .merchandise-price").val() > 0){
		merchandiseEditData[parentId].merchandisePrice = $("#"+parentId+" .merchandise-price").val();
		
	}
	else {
		alert("Error : Enter a valid Merchandise link");
		return;
	}

	if($("#"+parentId+" .merchandise-description").val() !== ""){
		merchandiseEditData[parentId].merchandiseDescription = $("#"+parentId+" .merchandise-description").val();
		
	}
	else {
		alert("Error : Enter a valid Merchandise Description");
		return;
	}

	if(merchandiseEditData[parentId].fileLoc == null)
	{
		updateDatabase(parentId);
	}
	else{
		//Delete pre-existing image image file from Firebase Storage
		var desertRef = firebase.storage().refFromURL(merchandiseEditData[parentId].merchandiseImage);
		//Discarding older image 
		desertRef.delete().then(function () {
			
			uploadNewImage(parentId);

		}).catch(function (error) {
			console.error(error);
		});		
	}
}




var addImagefile = null;

function getMerchandiseImage() {
	
	var addImageInput = $("<input type='file'>");
	addImageInput.change(function (e) {

		addImagefile =  e.target.files[0];
		if (addImagefile.type.search("image/") === 0) {
			
			$("#add-merchandise-preview").attr("src",URL.createObjectURL(addImagefile)).show();
		} else {
			alert("Error: File not an image");
			addImagefile = null;
		}	
	});

	addImageInput.click();		
}

function addMerchandiseToDatabase() {
	
	var addMerchandiseName; 
	var addMerchandiseLink; 
	var addMerchandiseImage;
	var addMerchandisePrice;
	var addMerchandiseDescription;

	if ($("#add-merchandise-name").val()) {
	 addMerchandiseName = $("#add-merchandise-name").val();
	} else {
		alert("Error : Enter a valid Merchandise name");
		return;
	}

	if ($("#add-merchandise-link").val()) {
		addMerchandiseLink = $("#add-merchandise-link").val();
	} else {
		alert("Error : Enter a valid Merchandise link");
		return;
	}

	if ($("#add-merchandise-price").val()>0) {
		addMerchandisePrice = $("#add-merchandise-price").val();
	} else {
		alert("Error : Enter a valid Merchandise Price");
		return;
	}

	if ($("#add-merchandise-description").val()) {
		addMerchandiseDescription = $("#add-merchandise-description").val();
	} else {
		alert("Error : Enter a valid Merchandise Description");
		return;
	}

	if (addImagefile == null) {
		alert("Error : Upload a valid Merchandise Image");
		return;
	}


	var dbRef = firebase.database().ref().child("merch");
	var newMerchandiseId = dbRef.push().key;

	var storageRef = firebase.storage().ref("merchandise-image/" + 
										addImagefile.name);

	var task = storageRef.put(addImagefile);

	task.on("state_changed",

		function progress(snapshot) {
			$("#save-merchandise-progress-bar").show();
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
				addMerchandiseImage = url;
				dbRef.child(newMerchandiseId).set(
					{

						onClickUrl : addMerchandiseLink,
						image : addMerchandiseImage,
						name : addMerchandiseName,
						price: addMerchandisePrice,
						desc: addMerchandiseDescription
					},
					function error(errorarg) {
						if(errorarg){
							console.error(errorarg);
						} else {

								//Resetting Add new Merchandise
								$("#add-merchandise-btn").click();
								$("#save-merchandise-progress-bar").hide();
								$("#add-merchandise-preview").hide();
								$("#add-merchandise-name").val("");
								$("#add-merchandise-link").val("");
								$("#add-merchandise-price").val("");
								$("#add-merchandise-description").val("");
								addImagefile = null;


						}
					}
				);
			});
		}
	);
}