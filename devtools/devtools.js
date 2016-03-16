/*var url = window.location.href.toLowerCase();
alert(url.substring(0, url.indexOf('/', url.indexOf('.'))));
if (url.substring(0, url.indexOf('/', url.indexOf('.'))).indexOf("as") >= 0) {
	console.log("URL domain contains 'as'!");*/
chrome.devtools.panels.create(
	"AS.com-Ext",
	"icons/as_16.png",
	"devtools/devtoolscontent.html",
	function() {

	}
);
// }
