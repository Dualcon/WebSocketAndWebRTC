var video = document.getElementById("video");
video.videoWidth = 480;
video.videoHeight = 360;
var canvas1 = document.getElementById("image");
var canvas2 = document.getElementById("newImage");

/* WebRTC */

//Configure waht kind of media will be shared.
var constraints = {
		audio: true,
		video: true
};

//Start Webcam.
function successCallback(stream) {
	// Add stream to video.
	video.srcObject = stream;

	connect();
	takeSnapshot();
}

function errorCallback(error) {
	console.log('navigator.getUserMedia error: ', error);
}

function takeSnapshot() {
	var timer = setInterval(function () {
		//Add an image from video to canvas.
		canvas1.getContext('2d').drawImage(video, 0, 0, canvas1.width, canvas1.height);

		// Get image from canvas and send it to server.
		sendFile();
	}, 5000);
}

navigator.getUserMedia(constraints, successCallback, errorCallback);


/* WebSocket */

var wsUri = "ws://localhost:8081/WebSocketAndWebRTC/imageEcho";
var websocket = null;

function connect() {
	if (websocket == null) {
		// Create a web socket.
		websocket = new WebSocket(wsUri);
		// Define type of WebSocket, can be UTF-8 String, buffer or blob.
		websocket.binaryType = 'arraybuffer';

		// Add WebSocket default methods.
		websocket.onopen = function(evt) {
			onOpen(evt)
		};

		websocket.onmessage = function(evt) {
			onMessage(evt)
		};

		websocket.onerror = function(evt) {
			onError(evt)
		};
	}
};

function onOpen(evt) {
	console.log("Connected to Endpoint!");
}

function onError(evt) {
	console.log('ERROR: ' + evt.data);
}

function onMessage(evt) {
	// Our WebSocket only accepts communication throw binary (buffer).
	if(evt.data instanceof ArrayBuffer) {
		convertFromBinary(evt.data);
		console.log("File received.");
	}
}

function convertToBinary(image) {
	var buffer = new ArrayBuffer(image.data.length);
	var bytes = new Uint8Array(buffer);
	for (var i=0; i<bytes.length; i++) {
		bytes[i] = image.data[i];
	}
	return buffer;
}

function convertFromBinary(buffer) {
	var bytes = new Uint8Array(buffer);
	var image = canvas2.getContext('2d').createImageData(canvas2.width, canvas2.height);
	for (var i=0; i<bytes.length; i++) {
		image.data[i] = bytes[i];
	}
	//Add the new image to the newImage canvas.
	canvas2.getContext('2d').putImageData(image,0,0);
}

function sendFile() {
	if (websocket != null) {
		var image = canvas1.getContext('2d').getImageData(0, 0, canvas1.width, canvas1.height);
		var buffer = convertToBinary(image);
		websocket.send(buffer);
		console.log("File sended.");
	}
};
