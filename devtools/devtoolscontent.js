window.onload = function() {
	var port = chrome.extension.connect({ name: "devtools-port" });
	document.getElementById("button").onclick = function() {
    	port.postMessage({ type: "unblock-video"});
	}
}
