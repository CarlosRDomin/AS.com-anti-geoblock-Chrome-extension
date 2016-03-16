chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {	// This code will run when the "Run script" button in devtools is clicked
	switch(message.type) {
		case "unblock-video":
			unblockVideo();
		break;
	}
});

function getUrlVars() {
	var vars = {};
	var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
		vars[key] = value;
	});

	return vars;
}

function getUrlBoolVar(name, def=true) {
	var v = getUrlVars()[name];

	return (v == null)? def:(v > 0);
}

function unblockVideo() {
	var divs = document.querySelectorAll("div");

	for (var i=0; i<divs.length; i++) {
		if (divs[i].className.indexOf("video_no_disponible") >= 0) {
			console.log("Encontrado un video no disponible!");

			children = divs[i].children;
			src_img = ""
			for (var j=0; j<children.length; j++) {
				if (children[j].nodeName.toLowerCase() === "img") {
					src_img = children[j].src;
					break;
				}
			}

			if (src_img !== "") {
				uncles = divs[i].parentNode.parentNode.children;
				for (var j=0; j<uncles.length; j++) {
					if (uncles[j].nodeName.toLowerCase() === "script") {			// Find the line that looks like this: "var identificadorBC_1458082988   = '1458081617_641882_1458082428';" and get the value of identificador...
						get_identificador = uncles[j].innerHTML.substring(uncles[j].innerHTML.indexOf("var identificador"));	// Find the interesting line
						identificador_start_idx = get_identificador.indexOf("'")+1;	// Find start index of identificador (without the initial apostrophe "'")
						identificador = get_identificador.substring(identificador_start_idx, get_identificador.indexOf("'", identificador_start_idx))
						src_video = src_img.substring(0, src_img.lastIndexOf("/")+1).replace("imagenes", "videos") + identificador + ".mp4";
						console.log("Encontrada su ubicación real: " + src_video + "! =)");
						divs[i].innerHTML = "<video controls" + (getUrlBoolVar("autoplay")? " autoplay":"") + (getUrlBoolVar("loop")? " loop":"") + ">" +
							"<source src='" + src_video + "' type='video/mp4' />" +
							"Tu navegador no soporta el tag <video>! =(" +
							"</video>";
						return;
					}
				}
			}

			alert("Lo siento, no he sido capaz de encontrar la ubicación real del vídeo geobloqueado =(");
			break;
		}
	}

	console.log("No he encontrado ningún vídeo geobloqueado en esta página.");
}

unblockVideo();	// Execute on load
