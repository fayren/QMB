
var saveFolder = 0; //counter to keep track of Saved Tabs folder status
var foldId = 0; //var to hold the Saved Tabs folder Id
var winId = 0 // var to hold recall window Id

//listener for loading the extension. I'm actually not really sure what the wrapping listener does, just that it works.
document.addEventListener('DOMContentLoaded', function () {
	createFolder();	
	console.log('started');
	
});

//---------------------------------------------------------------------
//initializ-ing

//on plugin load, get the Bookmarks Tree and check through each node
function createFolder() {
	chrome.bookmarks.getTree(function(checkNode){
		checkNode.forEach(function(item){
			processNode(item);
		});
	console.log("Folders Checked");
	console.log(saveFolder);
    createFold();
	});
};

//check to see if the Saved Tabs folder exists
function processNode(node){
	// checks each node if they have children, aka opens up all folders
	if(node.children) {
		node.children.forEach(function(child){
			processNode(child);
		});
        // if the node doesn't have a URL, its a folder, and if it's title is Saved Tabs then we have our monkey
		if(!node.url){
		   if (node.title == 'Saved Tabs'){	
			console.log("Saved Tabs folder exists!");
			//Saving ourselves some heartburn by keeping track of whether or not we have the folder and what that folder id is
			saveFolder = 1;
			foldId = node.id;
			}
		}
	}	
};

//create the Saved Tabs folder to store tabs
function createFold(){
    if (saveFolder == 0){
		chrome.bookmarks.create({ 
							title: 'Saved Tabs'}
							);
		console.log("added folder", Date.now());
		saveFolder = 1;
	}
	
};


//------------------------------------------------------------
//listeners

//listener for keyboard shortcuts 
chrome.commands.onCommand.addListener(function(command) {
  console.log('listening');
  //save current tab in bookmarks, 
  if (command == 'cns-tab'){
	cns();
  }
  //open all saved tabs in a new window
  else if(command == 'win-recall') {
    // if the saved tabs folder is empty, throw an alert, otherwise, open the new window with the saved tabs
	chrome.bookmarks.getChildren(foldId, function(check){
		console.log(check);
		if (check.length > 1){
			windowRecall();
		}
		else {
			alert('There are no saved tabs at this time!')
		}
	});
  }
  //close the magic window and save all tabs 
  else if (command == 'win-dump') {
	windowDump();
  }
});

//-------------------------------------------------------------
//functions for shortcuts

//Close and save the current tab.
function cns(){
	chrome.tabs.getSelected(null, function(tab){
		console.log(tab);
		chrome.bookmarks.create({
			parentId: foldId,
			title: tab.title, 
			url: tab.url
		});
		chrome.tabs.remove(tab.id, function(rtab){
			console.log('saved and closed');
		});
	
    });
};

// Recall all your saved tabs and open them in a new window
function windowRecall(){
	chrome.bookmarks.getChildren(foldId.toString(), function(sFolder){
	
		chrome.windows.create({}, function(window){
			console.log(window.id);
			winId = window.id;
			sFolder.forEach(function(urlify){
				chrome.tabs.create({windowId:window.id, url:urlify.url})
				chrome.bookmarks.remove(urlify.id);
			});
			chrome.tabs.query({windowId: window.id, index:0}, function(nullId){
				chrome.tabs.remove(nullId[0].id);
			});
		});		
	});	
};

//Close the magic window and save all the tabs in it. 
function windowDump(){
	chrome.windows.get(winId, {populate: true}, function(winTabs){
		winTabs.tabs.forEach(function(resave){
			console.log(resave.url);
			chrome.bookmarks.create({
				parentId: foldId,
				title: resave.title, 
				url: resave.url
			});
		});
	});
	
	chrome.windows.remove(winId);
};

