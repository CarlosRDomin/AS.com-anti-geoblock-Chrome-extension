/*// omnibox
chrome.omnibox.onInputChanged.addListener(function(text, suggest) {
	suggest([
	  {content: "color-divs", description: "Make everything red"}
	]);
});
chrome.omnibox.onInputEntered.addListener(function(text) {
	if(text == "color-divs") colorDivs();
});

// listening for an event / one-time requests
// coming from the popup
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    switch(request.type) {
        case "color-divs":
            colorDivs();
        break;
    }
    return true;
});*/

// listening for an event / long-lived connections
// coming from devtools
chrome.extension.onConnect.addListener(function (port) {
    port.onMessage.addListener(function (message) {
       	switch(port.name) {
			case "devtools-port":
				reRunContentCode(); // Ignore message content, just re-run the code
			break;
		}
    });
});

// send a message to the content script
var reRunContentCode = function() {
	chrome.tabs.getSelected(null, function(tab){
		chrome.tabs.sendMessage(tab.id, {type: "unblock-video", color: "#F00"});
		/*// setting a badge
		chrome.browserAction.setBadgeText({text: "red!"});*/
	});
}
