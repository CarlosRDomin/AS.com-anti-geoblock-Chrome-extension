DEFAULT_URL_CACHE = "http://as02.epimg.net";

chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {	// This code will run when the "Run script" button in devtools is clicked
	switch(message.type) {
		case "unblock-video":
			unblockVideo();
		break;
	}
});

function getUrlVars() {
	/* This function retrieves all GET variables passed in the URL and returns them as a (key, value) dictionary */
	var vars = {};
	var parts = location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
		vars[key] = value;
	});

	return vars;
}

function getUrlBoolVar(name, def=true) {
	/* This function retrieves a boolean GET variable specified by name. If that variable wasn't passed in the URL, default value def is returned */
	var v = getUrlVars()[name];

	return (v === undefined)? def:(v > 0);
}

function extractVarFromScript(innerHTML, varName) {
	/* Look for a variable declaration such as "var identificadorBC_1465458751   = '1446587363_676815_1446588920';" and get the value of the variable. Return null if declaration not found */
	var var_declaration = new RegExp("var " + varName + "[^;]+").exec(innerHTML);

	if (var_declaration !== null) {
		var_declaration = var_declaration[0];		// Should only be one match, otherwise just ignore the others and only analyze the first one
		return var_declaration.substring(var_declaration.indexOf("=") + 1);	// Remove the contents of the string before the equal sign
	}

	return null;
}

function displayMsgInDiv(div, msg, isLoading=true) {
	div.children[0].innerHTML = '<div style="display: table; width: 100%; height: 100%;">\
		<span class="s-tcenter ntc-media-msg ntc-media-msg-txt" style="display: table-cell; vertical-align: middle; position: relative; top: 0px;">' +
		msg +
		((!isLoading)? '':'<br><img src="https://github.com/CarlosRDomin/UrmeeUCR/blob/master/UrmeeExperiment/static/images/loading_spinner.gif?raw=true" loop="infinite" style="width: 75px; margin: auto;"/>') +
		'</span></div>';
}

function replaceDivByVideo(div, src_video) {
	console.log("CONFIRMADA su ubicación real: " + src_video + "! =)");
	new_div = div.parentNode;	// In case we need it, don't lose a reference to the new element (the old div won't point to a valid div element after next line)
	new_div.innerHTML = "<video controls" + (getUrlBoolVar("autoplay", true)? " autoplay":"") + (getUrlBoolVar("loop", false)? " loop":"") + " style='width:100%; height: 100%' id='" + div.id + "'>" +
		"<source src='" + src_video + "' type='video/mp4' />" +
		"Tu navegador no soporta el tag 'video'! =(" +
		"</video>";
	return new_div;
}

function findUnblockedVideosURL(div) {
	var scripts = document.querySelectorAll("script");

	var url_cache = null, url = undefined;
	for (var i=0; i<scripts.length; i++) {
		// console.log("Script: [[" + scripts[i].innerHTML + "]]");
		if (url_cache === null) {	// If not found yet, look for declaration of url_cache
			url_cache = eval(extractVarFromScript(scripts[i].innerHTML, "url_cache"));
		}
		url = eval(extractVarFromScript(scripts[i].innerHTML, "urlVideo_"));
		if (url != null) {	// If script contains urlVideo_##########, print its url
			console.log("Encontrado un vídeo no bloqueado: " + url + "! =)");
			div = replaceDivByVideo(div, url);
			// id = eval(extractVarFromScript(scripts[i].innerHTML, "identificadorBC_")) + "as-1";
			// var script = document.createElement('script'); script.type = 'text/javascript'; script.innerHTML = 'setTimeout(MultimediaReinicio("' + id + '"), 3000);';
			// div.parentNode.appendChild(script);
		}
	}
}

function findBlockedVideoURL(div) {
	/* This function reads the <script>s in the document to figure out the URL of the blocked video */
	displayMsgInDiv(div, ("Cargando vídeo bloqueado..."));
	var scripts = document.querySelectorAll("script");

	var url_cache = null, identificador = null;
	for (var i=0; i<scripts.length; i++) {
		// console.log("Script: [[" + scripts[i].innerHTML + "]]");
		if (url_cache === null) {	// If not found yet, look for declaration of url_cache
			url_cache = eval(extractVarFromScript(scripts[i].innerHTML, "url_cache"));
		}
		if (identificador === null) {	// If not found yet, look for declaration of identificadorBC_##########...
			identificador = eval(extractVarFromScript(scripts[i].innerHTML, "identificadorBC_"));
			if (identificador != null) {	// If identificador was found in this script, we should also be able to get info for the first frame (which contains the video date)
				var primer_frame = extractVarFromScript(scripts[i].innerHTML, "urlFotogramaFijo_");	// No need to eval the result, not interested in removing quotes, etc.
				var date_video = /\/[0-9]{4}\/[0-9]{2}\/[0-9]{2}\//.exec(primer_frame)[0];	// Look for "/####/##/##/" (including slashes)
				var src_video = ((url_cache===null)? DEFAULT_URL_CACHE:url_cache) + "/videos/videos" + date_video + "portada/" + identificador + ".mp4";
				console.log("Creo que he encontrado su ubicación real: " + src_video + "! Déjame confirmarlo...");

				var numTries = 1;
				var xhr = new XMLHttpRequest();
				xhr.onreadystatechange = function() {
					// console.log("xhr state " + xhr.readyState + "; status: " + xhr.status + "; URL: " + xhr.responseURL);
					switch (xhr.readyState) {
						case 2:	// Headers & status are ready, haven't started downloading body content
							if (xhr.responseURL === src_video) {	// Just checking if video URL is correct, only care about xhr.status (either 200 or 404)
								if (xhr.status == 404) {
									console.log("Vaya, parece que " + src_video + " no es la ubicación correcta... Voy a probar otro método :)");
									displayMsgInDiv(div, ("El método del script no funcionó, probando a través del proxy... Intento #" + numTries));
									xhr.open("GET", "http://as.com/vdpep/1/?pepid=" + identificador + "as", true);	// This also aborts previous request :)
									xhr.send();
								} else if (xhr.status == 200) {
									replaceDivByVideo(div, src_video);
									xhr.onreadystatechange = null;	// When a request is aborted, xhr.readyState changes to 4 and status to 0. Avoid processing it.
									xhr.abort();	// Abort request so video doesn't start to download
								}
							}
							break;
						case 4:	// Full request downloaded (responseText contains body content)
							// if (xhr.responseURL === "" || xhr.responseURL === src_video) break;	// When xhr.abort() is called, execution comes here. Simply ignore it
							if (xhr.status == 200) {
								var func_call = /EPET_VideoPlayer_callback\([^;]*\)/.exec(xhr.responseText)[0];	// Look for the call to EPET_VideoPlayer_callback()
								var content = JSON.parse(/\{[^]*\}/.exec(func_call)[0]);	// Get outermost curly braces and parse contents
								src_video = ((url_cache===null)? DEFAULT_URL_CACHE:url_cache) + content.mp4;	// Compose src_video from the new information
								replaceDivByVideo(div, src_video);	// Finally, show the video with the correct URL
							} else {
								if (numTries < 5) {
									numTries++;
									console.log("Reintentando obtener información sobre el vídeo... Intento número " + numTries);
									displayMsgInDiv(div, ("Reintentando el método del proxy... Intento #" + numTries));
									xhr.open("GET", "http://as.com/vdpep/1/?pepid=" + identificador + "as", true);
									xhr.send();
								} else {
									console.log("Se ha excedido el máximo número de reintentos. Lo siento, no he sido capaz de encontrar el vídeo :'(");
									displayMsgInDiv(div, "Lo siento, se ha alcanzado el máximo número de reintentos ='(<br>Prueba otra vez manualmente o selecciona otro servidor proxy", false);
								}
							}
							break;
					}
				}
				xhr.open("GET", src_video, true);
				xhr.send();
				return;
			}
		}
	}
}

function unblockVideo() {
	if (location.pathname === "/" || location.pathname === "/index.html") {	// Don't look for videos if on the main page, it's annoying when they play in the background
		console.log("Estás en la portada, no voy a mirar si hay vídeos aquí... =P");
		return;
	}

	var vids_no_disponibles = document.getElementsByClassName("video_no_disponible");
	if (vids_no_disponibles.length == 0) {
		console.log("No he encontrado ningún vídeo geobloqueado en esta página.");
		var vids_disponibles = document.getElementsByClassName("video_MPEP");
		if (vids_disponibles.length > 0) {
			findUnblockedVideosURL(vids_disponibles[0]);
		}
		return;
	}
	findBlockedVideoURL(vids_no_disponibles[0]);	// For now, only process the first blocked video in the page (there shouldn't be more than 1, but ignore the rest if so)
}

unblockVideo();	// Execute on load
