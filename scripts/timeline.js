"use strict";
var $editEventTemplate;
var firebase;
var selectImageFile = null;
var tempEditEventKey = null;
function getTimelineEvents(data) {
	
	var dbRef = firebase.database().ref().child('timeline');

	/*Implement onchange listener for timeline node
	and return a Promise */
	return dbRef.once('value').then((snapshot) => {

		snapshot.forEach(function (childSnapshot) {
 
			var id = childSnapshot.key;
			var type = childSnapshot.child('eventType').val();
			var desc = childSnapshot.child('description').val();
			var eventName = childSnapshot.child('name').val();
			var img = childSnapshot.child('imageUrl').val();
			var rulebook = childSnapshot.child('ruleBookUrl').val();
			var eventCat = childSnapshot.child('category').val();
			var eventDays = childSnapshot.child('days').val();

			data[id] = {
				category : eventCat,
				days : eventDays,
				description : desc,
				eventId : id,
				eventType : type,
				imageUrl : img,
				name : eventName,
				ruleBookUrl : rulebook
			};			
			
		});
		
	},function error(errorarg) {
		toastr.error(errorarg.message);
	});
}

function clearModal() {

	$('#header-event-modal').text('Add New Event');
	$('#modal-event input').val("").focusout();
	$('#modal-event textarea').val("").focusout();
	$('#modal-event textarea').attr('rows','2');
	$('.modal-body .close').click();
	$('#img-event-select-image-preview').hide();
	$('#img-event-select-image-preview').removeAttr('src');
	selectImageFile = null;
	tempEditEventKey = null;	
}

function deleteEvent(key,imageUrl) {
	
	var dbRef = firebase.database().ref('/timeline/').child(key);
	var desertRef = firebase.storage().refFromURL(imageUrl);
	return desertRef.delete().then(function () {
		return dbRef.remove();
	});
}

function editEvents(event) {

	var key = event.data.eventkey;
	var value = event.data.eventvalue;

	clearModal();
	tempEditEventKey = key;
	$('#header-event-modal').text('Edit event : '+key);
	$('#input-add-event-name').val(value.name);
	$('#input-add-event-type').val(value.eventType);
	$('#input-add-event-desc').val(value.description);
	$('#input-add-event-rulebook').val(value.ruleBookUrl);
	value.category.forEach(function (element) {
		$('#input-add-event-category').val(element);
		$('#btn-add-category').click();
	});
	value.days.forEach(function (element,daynum) {
		$('#input-add-event-day-daynum').val(daynum);
		$('#input-add-event-day-session').val(element.session);
		$('#input-add-event-day-time').val(element.time);
		$('#input-add-event-day-venue').val(element.venue);
		$('#btn-add-day').click();
	});
	$('#img-event-select-image-preview').attr('src',value.imageUrl).show();
	$('#btn-add-new-event').click();
}

async function displayEvents() {
	
	var data = {};
	var errcounter1 = 0;
	//Retrieve data from firebase database
	await getTimelineEvents(data).catch((err) => {
		toastr.warning('Error fetching data...Retrying...');
		errcounter1++;
		if (errcounter1 < 6) {
			setTimeout(displayEvents,5000);
		} else {
			toastr.error(err.message);
			return;
		}
	});

	$('#container-edit-events').empty();

	$.each(data,function (key,value) {
	  	
	  	var newEventTemplate = $($editEventTemplate.clone().html());
	  	newEventTemplate.attr('id','card-edit-event'+key);
	  	newEventTemplate.find('.event-name').text(value.name);
	  	newEventTemplate.find('.event-type').text(value.eventType);
	  	newEventTemplate.find('.event-desc').text(value.description);
	  	newEventTemplate.find('.event-rulebook').attr('href',value.ruleBookUrl)
	  											.text(value.ruleBookUrl);	  											
	  	newEventTemplate.find('.card-img-top').attr('src',value.imageUrl);

	  	value.category.forEach(function (element) {
	  		var $newCatList = $('<li class="list-group-item">'+element+'</li>');
	  		newEventTemplate.find('.event-category').append($newCatList);
	  	});

	  	value.days.forEach(function (element,index) {
	  		var $newDayList = $('<li class="list-group-item">Day '
	  			+index+':&emsp;'+element.session+'&emsp;'
	  			+element.time+'&emsp;'+element.venue
	  			+'</li>'
	  		);
	  		newEventTemplate.find('.event-days').append($newDayList);
	  	});

	  	newEventTemplate.find('.delete-btn').off('click')
	  	.on('click',{eventKey:key,eventImg:value.imageUrl},
	  	async function (event) {
	  		$(this).addClass('disabled');
	  		await deleteEvent(event.data.eventKey,event.data.eventImg)
	  		.catch((err) => {
	  			toastr.error(err.message);
	  			//return;
	  		}); 
	  		$('#card-edit-event'+key).remove();
	  		delete data[key]; 		
	  	});

	  	newEventTemplate.find('.edit-btn').off('click')
	  	.on('click',{eventkey:key,eventvalue:value},function (event) {
	  		editEvents(event);
	  	});

	  	$('#container-edit-events').append(newEventTemplate);

	});	
}

function addEventModalValidation(data) {

	var addEventName = $('#input-add-event-name').val();
	var addEventType = $('#input-add-event-type').val();
	var addEventDesc = $('#input-add-event-desc').val();
	var addEventRulebook = $('#input-add-event-rulebook').val();
	var addEventCategory = {};
	$('#container-new-category .span-category').each(function (index,element) {
		addEventCategory[index] = $(element).text();
	});
	var addEventDays = {};
	$('#container-new-day .div-day').each(function (key,element) {
		let index = $(element).find('.span-daynum').text();
		addEventDays[index] = {};
		addEventDays[index]['session'] = $(element).find('.span-session').text();
		addEventDays[index]['time'] = $(element).find('.span-time').text();
		addEventDays[index]['venue'] = $(element).find('.span-venue').text();
	});
	var addEventImageFile = selectImageFile;
	var isValid = true;
	if (!addEventName||!addEventType||!addEventDesc||!addEventRulebook) {

		toastr.error('Null entry');
		isValid = false;
	}
	if ($.isEmptyObject(addEventCategory)) {
		toastr.warning('No "Categories" entered');
		isValid = false;
	}
	if($.isEmptyObject(addEventDays)) {
		toastr.warning('No "Days" entered');
		isValid = false;
	}
	if (!addEventImageFile&&!tempEditEventKey) {
		toastr.warning('No Event Image');
		isValid = false;
	}
	if (!isValid) {
		data = null;
	} else {
		data['name'] = addEventName;
		data['eventType'] = addEventType;
		data['description'] = addEventDesc;
		data['ruleBookUrl'] = addEventRulebook;
		data['category'] = addEventCategory;
		data['days'] = addEventDays;
		data['eventImageFile'] = addEventImageFile;
		data['imageUrl'] = null;
		data['eventId'] = null;
	}
	return isValid;
}

function uploadToDatabase(data) {
	
	var dbRef = firebase.database().ref().child('timeline');

	// (tempEditEventKey != null) => editEvent
	if (tempEditEventKey == null) {
		data.eventId = dbRef.push().key;
	} else {
		data.eventId = tempEditEventKey;
	}

	dbRef.child(data.eventId).set(data,function (result) {
		if (result) {
			toastr.error(result.message);
		} else {
			displayEvents();
			$('#spinner-add-event-upload').fadeOut();
			if (!tempEditEventKey) {
				toastr.success('Event added to timeline');
				clearModal();			

			} else {
				toastr.success('Event edit successful');
				clearModal();
				$('#btn-close-modal').click();
			}						
		}

	});
}

function insertEventToDatabase(data) {
	
	//For Edit Event
	if (tempEditEventKey!=null) {
		delete data.eventImageFile;
		data.imageUrl = $('#img-event-select-image-preview').attr('src');
		uploadToDatabase(data);
		return;
	}

	//Upload image to Storage
	var storageRef = firebase.storage().ref("events-image/"
											+data.eventImageFile.name +"-"
											+Date.now()); 

	var uploadTask = storageRef.put(data.eventImageFile);
	$('#spinner-add-event-upload').css('color','#4285f4');
	uploadTask.on("state_changed",

		function progress(snapshot) {
						
		},

		function error(error) {				
			toastr.error(error.message);
		},

		function complete(argument) {

			/**New image uploaded**/

			//Get download url
			$('#spinner-add-event-upload').css('color','#0f9d58');
			storageRef.getDownloadURL().then(function (url) {	
				
				data.imageUrl = url;
				delete data.eventImageFile;
				selectImageFile = null;
				uploadToDatabase(data);
			});		
		}	
	);

	
}

function addNewEventModalInit() {

	//Add close btn listener
	$('#btn-close-modal').click(function () {
		
		if (tempEditEventKey) {
			toastr.warning('Edit event job terminated');
			clearModal();
		}
	});

	//Add 'new category' listeners
	$('#btn-add-category').click(function () {
		if (!$('#input-add-event-category').val()) {
			toastr.warning("Null entry!!");
			return;
		}
		var $newCategory = $('<div class="chip-custom div-category">'
		+'<span class="span-category">'
		+$('#input-add-event-category').val()+'</span>&nbsp;'
		+'<i class="close fa fa-times red-text"></i>'
		+'</div>');
		
		$('#container-new-category').append($newCategory.on('click','.close',
			function () {
				$(this).parent().remove();
			}
		));
		$('#input-add-event-category').val("");
		

	});

	//Add 'new day' listeners
	var dayCheck = [];
	$('#btn-add-day').click(function () {

		let eventTime = $('#input-add-event-day-time').val();
		eventTime = eventTime.padStart(4,'0');

		let dayIndex = $('#input-add-event-day-daynum').val();
		if (dayIndex==""||!$('#input-add-event-day-session').val()
		||!eventTime||!$('#input-add-event-day-venue').val()) {
			toastr.warning("Null entry!!");
			return;
		}

		dayIndex = parseInt(dayIndex);
		if (isNaN(dayIndex)||dayIndex<0) {
			toastr.warning("Invalid day entry");
			return;
		}

		if (!$.isNumeric(eventTime)) {
			toastr.warning("Invalid time entry");
			return;
		} else if (eventTime<0||eventTime>2359||eventTime.substr(2,2)>59) {
			toastr.warning("Invalid time entry");
			return;
		} 

		if (dayCheck.indexOf(dayIndex) == -1) {
			dayCheck[dayIndex] = dayIndex;
		} else {
			toastr.warning("Duplicate day entry");
			return;
		}		

		

		var $newDay = $('<div class="chip-custom div-day">'
		+'Day '+'<span class="span-daynum">'
		+dayIndex+'</span>:&emsp;'
		+'<span class="span-session">'
		+$('#input-add-event-day-session').val()+'</span>&emsp;&emsp;'
		+'<span class="span-time">'
		+eventTime+'</span>&emsp;&emsp;'
		+'<span class="span-venue">'
		+$('#input-add-event-day-venue').val()+'</span>&nbsp;'
		+'<i class="close fa fa-times red-text"></i>'
		+'</div>');

		$('#container-new-day').append($newDay.on('click','.close',
			function () {
				$(this).parent().remove();
				dayCheck[dayIndex] = null;
			}

		));
		$('#input-add-event-day-daynum').val("");
		$('#input-add-event-day-session').val("");
		$('#input-add-event-day-time').val("");
		$('#input-add-event-day-venue').val("");
	});

	//Add 'Select Image' btn listener
	selectImageFile = null; 
	$('#btn-add-event-select-image').click(function selectImage() {
		
		var selectImageInput = $("<input type='file'>");
		selectImageInput.one('change',function (event) {
			selectImageFile = event.target.files[0];
			if (selectImageFile.type.search('image/') === 0) {
				$('#img-event-select-image-preview')
				.attr("src",URL.createObjectURL(selectImageFile))
				.show();				
			} else {

				toastr.error('Error: File not an image');
				selectImageFile = null;
			}
		});
		selectImageInput.click();		
	});

	//Add 'Save Event' btn listener
	$('#btn-add-event-save').click(function saveEvent() {		
		
		var addEventData = {};
		/*
		Validate modal form data &
		Initialize data required for database insertion
		*/
		var isValid = addEventModalValidation(addEventData);
		if (!isValid) {
			return;
		}
		/**Validated...**/
		
		//Start the spinner
		$('#spinner-add-event-upload').show();

		//Insert data to database
		/**Image upload handled within the function**/
		insertEventToDatabase(addEventData);
	});	
}	

//Executes when document is ready
$(function () {

	//Disabling preloader css
	//$('#preload-css').get(0).disabled = true;

	// Tooltips Initialization
	$('[data-toggle~="tooltip"]').tooltip();	
	
	//Edit event template
	$editEventTemplate = $('#template-edit-events');

	//Set up 'Add New Event'
	addNewEventModalInit();
	
	//Display Event Cards
	displayEvents();

	//BugFix
});	
