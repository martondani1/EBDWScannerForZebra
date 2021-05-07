
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"sap/ui/core/mvc/View"
], function (Controller,
	MessageToast,
	View) {
	"use strict";

	//These are datawedge variables
	var _oController;
	var _sendCommandResults = "false";
	var _scans = [];

	//Enterprise Browser variables
	var barcodeDemo = {};
	barcodeDemo.barcodeObjects = null;
	barcodeDemo.done = false;
	var scannerArray=[];
	var done = false;
	var scanner;
	var radio_home = document.getElementById("radio_home");


	//Datawedge with EB
	var outputData = "";

	return Controller.extend("transmeri.barcode.Barcode.controller.Reader", {
		onInit: function () {
			_oController = this;

			var app = {
				// Application Constructor
				initialize: function () {
					this.bindEvents();
					_oController.registerBroadcastReceiver();
					_oController.determineVersion();
				},

				onPause: function () {
					console.log('Paused');
					unregisterBroadcastReceiver();
				},
				onResume: function () {
					console.log('Resumed');
					registerBroadcastReceiver();
				},
				// Update DOM on a Received Event
				receivedEvent: function (id) {
					console.log('Received Event: ' + id);
				},

				// Bind Event Listeners
				//
				// Bind any events that are required on startup. Common events are:
				// 'load', 'deviceready', 'offline', and 'online'.
				bindEvents: function () {
					document.addEventListener('deviceready', this.onDeviceReady, false);
				},
				// deviceready Event Handler
				//
				// The scope of 'this' is the event. In order to call the 'receivedEvent'
				// function, we must explicitly call 'app.receivedEvent(...);'
				onDeviceReady: function () {
					app.receivedEvent('deviceready');
				}
			};
			app.initialize();
			




			
			//Datawedge with EB
			this.registerIntent();
			//console.log(EB);
			//scannerArray = EB?.Barcode?.enumerate();
			
			//scanner = scannerArray[0];

			
			//scanner.enable({},myIntentListenerCallback);
		},

		//Zebra scan - method one - EnterpriseBrowser
		onScan: function(){
			MessageToast.show("Button pressed");
			EB.Barcode.enable({}, scanReceived);

			alert('Button pressed');


			
		},
		scanRecieved: function(params){
			// No data or no timestamp, scan failed.
            if(params['data']== "" || params['time']==""){
                document.getElementById('display').innerHTML = "Failed!";
                return;
            }
            // Data and timestamp exist, barcode successful, show results
            var displayStr = "Barcode Data: " + params['data']+"<br>Time: "+params['time'];
            document.getElementById("display").innerHTML = displayStr;
		},



		//Zebra scan - method three - EnterpriseBrowser
		onScan2: function () { 
			EB.Barcode.enumerateScanners(function (e){
				if(e.scannerType == 'Laser'){
					scanner = e;
				}
			});

			var scannerProperties = {beamWidth:EB.Barcode.BEAM_NARROW, decodeVolume:5};
			scanner.enable(scannerProperties, function(e){
        		barcodeData = e.data;
    		});
		},


		fnScanEnable: function fnScanEnable() { 
			EB.Barcode.enable({allDecoders:true},fnBarcodeScanned); 
			 document.getElementById('scanData').value 
		  = "enabled: press HW trigger to capture.";   
	   	},
	   	fnBarcodeScanned: function fnBarcodeScanned(jsonObject) {
		console.log("Barcode Scanned:{" + JSON.stringify(jsonObject) + "}");
		document.getElementById('scanData').value = "barcode: " + jsonObject.data;
	  	},
		fnScanDisable: function fnScanDisable() { 
		EB.Barcode.disable(); 
		document.getElementById('scanData').value = "disabled: press 'enable' to scan.";  
		},

		//Android camera scan
		scan: function scan(){
		
			cordova.plugins.barcodeScanner.scan(
				function (result) {

					alert("We got a barcode\n" +
		
						"Result: " + result.text + "\n" +
		
						"Format: " + result.format + "\n" +
		
						"Cancelled: " + result.cancelled);
		
				},
		
				function (error) {
		
					alert("Scanning failed: " + error);
		
				}
	 		);
			MessageToast.show("Button pressed");
  
		},

		//oData scan
		doScan: function() {
			cordova.plugins.barcodeScanner.scan(
			function (result) {
			jQuery.sap.require("sap.ui.model.odata.datajs");
			var sUrl = "https://sapes5.sapdevcenter.com/sap/opu/odata/IWBEP/GWSAMPLE_BASIC/";
			var oModel = new sap.ui.model.odata.ODataModel(sUrl, true);
			oModel.read(
			"/ProductSet('" + result.text + "')",
			null,
			null,
			true,
			function(oData, response) {
			console.log(response.data.Material);
			var oMatID = []; var oMatDescr=[];
			oMatID.push(response.data.Material);
			oMatDescr.push(response.data.MatlDesc);
			var data = [];
			for(var i = 0; i < oMatID.length; i++) {
			data.push({"MatID": oMatID[i], "MatDescr": oMatDescr[i]});
			}
			var oModel1 = new sap.ui.model.json.JSONModel({ "zgwmat": data });
			sap.ui.getCore().setModel(oModel1, "zgwmatmodel");
			var bus = sap.ui.getCore().getEventBus();
			bus.publish("nav", "to", {
			id : "scanresult",
			});
			},
			function (err) {
						alert("Error in Get -- Request " + err.response.body);
							console.log(err.response.body);
					   }
			);
				 },
			   function (error) {
				  alert("Scanning failed: " + error);
			  }
			);
		},






		// DATAWEDGE METHOD
		//Call this on the button press to activate the scanner with cordova
		startSoftTrigger: function() {
			this.sendCommand("com.symbol.datawedge.api.SOFT_SCAN_TRIGGER", 'START_SCANNING');
		},
		
		stopSoftTrigger: function() {
			this.sendCommand("com.symbol.datawedge.api.SOFT_SCAN_TRIGGER", 'STOP_SCANNING');
		},
		
		determineVersion: function() {
			// var oController = sap.ui.getCore().byId("../View/Reader.view.xml").getController();
			// oController.sendcommand("com.symbol.datawedge.api.GET_VERSION_INFO", "");
			this.sendCommand("com.symbol.datawedge.api.GET_VERSION_INFO", "");
		},
		
		setDecoders: function setDecoders() {
			var ean8Decoder = "" + document.getElementById('chk_ean8').checked;
			var ean13Decoder = "" + document.getElementById('chk_ean13').checked;
			var code39Decoder = "" + document.getElementById('chk_code39').checked;
			var code128Decoder = "" + document.getElementById('chk_code128').checked;
			//  Set the new configuration
			var profileConfig = {
				"PROFILE_NAME": "ZebraCordovaDemo",
				"PROFILE_ENABLED": "true",
				"CONFIG_MODE": "UPDATE",
				"PLUGIN_CONFIG": {
					"PLUGIN_NAME": "BARCODE",
					"PARAM_LIST": {
						//"current-device-id": this.selectedScannerId,
						"scanner_selection": "auto",
						"decoder_ean8": "" + ean8Decoder,
						"decoder_ean13": "" + ean13Decoder,
						"decoder_code128": "" + code128Decoder,
						"decoder_code39": "" + code39Decoder
					}
				}
			};
			this.sendCommand("com.symbol.datawedge.api.SET_CONFIG", profileConfig);
		},

		sendCommand: function(extraName, extraValue) {
			console.log("Sending Command: " + extraName + ", " + JSON.stringify(extraValue));
			var broadcastExtras = {};
			broadcastExtras[extraName] = extraValue;
			broadcastExtras["SEND_RESULT"] = _sendCommandResults;
			window.plugins.intentShim.sendBroadcast({
				action: "com.symbol.datawedge.api.ACTION",
				extras: broadcastExtras
			},
				function () { },
				function () { }
			);
		},
		
		registerBroadcastReceiver: function() {
			//var controller = _oController;
			
			window.plugins.intentShim.registerBroadcastReceiver({
				filterActions: [
					'com.zebra.cordovademo.ACTION',
					'com.symbol.datawedge.api.RESULT_ACTION'
				],
				filterCategories: [
					'android.intent.category.DEFAULT'
				]
			},
				function (intent) {
					function barcodeScanned(scanData, timeOfScan) {
						var scannedData = scanData.extras["com.symbol.datawedge.data_string"];
						var scannedType = scanData.extras["com.symbol.datawedge.label_type"];
						console.log("Scan: " + scannedData);
						_scans.unshift({ "data": scannedData, "decoder": scannedType, "timeAtDecode": timeOfScan });
						console.log(_scans);
						var scanDisplay = "";
						for (var i = 0; i < _scans.length; i++)
						{
							scanDisplay += "<b><small>" + _scans[i].decoder + " (" + _scans[i].timeAtDecode + ")</small></b><br>" + _scans[i].data + "<br><br>";
						}
						document.getElementById('container-Barcode---Reader--scannedBarcodes').innerHTML = scanDisplay;
					}
					//  Broadcast received
					console.log('Received Intent: ' + JSON.stringify(intent.extras));
					if (intent.extras.hasOwnProperty('RESULT_INFO')) {
						var commandResult = intent.extras.RESULT + " (" +
							intent.extras.COMMAND.substring(intent.extras.COMMAND.lastIndexOf('.') + 1, intent.extras.COMMAND.length) + ")";// + JSON.stringify(intent.extras.RESULT_INFO);
							_oController.commandReceived(commandResult.toLowerCase());
					}
		
					if (intent.extras.hasOwnProperty('com.symbol.datawedge.api.RESULT_GET_VERSION_INFO')) {
						//  The version has been returned (DW 6.3 or higher).  Includes the DW version along with other subsystem versions e.g MX  
						var versionInfo = intent.extras['com.symbol.datawedge.api.RESULT_GET_VERSION_INFO'];
						console.log('Version Info: ' + JSON.stringify(versionInfo));
						var datawedgeVersion = versionInfo['DATAWEDGE'];
						console.log("Datawedge version: " + datawedgeVersion);
		
						//  Fire events sequentially so the application can gracefully degrade the functionality available on earlier DW versions
						if (datawedgeVersion >= "6.3")
							_oController.datawedge63();
						if (datawedgeVersion >= "6.4")
							_oController.datawedge64();
						if (datawedgeVersion >= "6.5")
							_oController.datawedge65();
					}
					else if (intent.extras.hasOwnProperty('com.symbol.datawedge.api.RESULT_ENUMERATE_SCANNERS')) {
						//  Return from our request to enumerate the available scanners
						var enumeratedScannersObj = intent.extras['com.symbol.datawedge.api.RESULT_ENUMERATE_SCANNERS'];
						_oController.enumerateScanners(enumeratedScannersObj);
					}
					else if (intent.extras.hasOwnProperty('com.symbol.datawedge.api.RESULT_GET_ACTIVE_PROFILE')) {
						//  Return from our request to obtain the active profile
						var activeProfileObj = intent.extras['com.symbol.datawedge.api.RESULT_GET_ACTIVE_PROFILE'];
						_oController.activeProfile(activeProfileObj);
					}
					else if (!intent.extras.hasOwnProperty('RESULT_INFO')) {
						//  A barcode has been scanned
						barcodeScanned(intent, new Date().toLocaleString()); //NOT DEFINED?????? 
					}
				}
			);
		},
		
		unregisterBroadcastReceiver: function() {
			window.plugins.intentShim.unregisterBroadcastReceiver();
		},
		
		datawedge63 :function() {
			console.log("Datawedge 6.3 APIs are available");
			//  Create a profile for our application
			this.sendCommand("com.symbol.datawedge.api.CREATE_PROFILE", "ZebraCordovaDemo");
			document.getElementById('info_datawedgeVersion').innerHTML = "6.3.  Please configure profile manually.  See ReadMe for more details.";
		
			//  Although we created the profile we can only configure it with DW 6.4.
			this.sendCommand("com.symbol.datawedge.api.GET_ACTIVE_PROFILE", "");
		
			//  Enumerate the available scanners on the device
			this.sendCommand("com.symbol.datawedge.api.ENUMERATE_SCANNERS", "");
		
			//  Functionality of the scan button is available
			document.getElementById('scanButton').style.display = "block";
		},
		
		datawedge64: function() {
			console.log("Datawedge 6.4 APIs are available");
		
			//  Documentation states the ability to set a profile config is only available from DW 6.4.
			//  For our purposes, this includes setting the decoders and configuring the associated app / output params of the profile.
			document.getElementById('info_datawedgeVersion').innerHTML = "6.4.";
			document.getElementById('info_datawedgeVersion').classList.remove("attention");
		
			//  Decoders are now available
			document.getElementById('chk_ean8').disabled = false;
			document.getElementById('chk_ean13').disabled = false;
			document.getElementById('chk_code39').disabled = false;
			document.getElementById('chk_code128').disabled = false;
		
			//  Configure the created profile (associated app and keyboard plugin)
			var profileConfig = {
				"PROFILE_NAME": "ZebraCordovaDemo",
				"PROFILE_ENABLED": "true",
				"CONFIG_MODE": "UPDATE",
				"PLUGIN_CONFIG": {
					"PLUGIN_NAME": "BARCODE",
					"RESET_CONFIG": "true",
					"PARAM_LIST": {}
				},
				"APP_LIST": [{
					"PACKAGE_NAME": "com.zebra.datawedgecordova",
					"ACTIVITY_LIST": ["*"]
				}]
			};
			this.sendCommand("com.symbol.datawedge.api.SET_CONFIG", profileConfig);
		
			//  Configure the created profile (intent plugin)
			var profileConfig2 = {
				"PROFILE_NAME": "ZebraCordovaDemo",
				"PROFILE_ENABLED": "true",
				"CONFIG_MODE": "UPDATE",
				"PLUGIN_CONFIG": {
					"PLUGIN_NAME": "INTENT",
					"RESET_CONFIG": "true",
					"PARAM_LIST": {
						"intent_output_enabled": "true",
						"intent_action": "com.zebra.cordovademo.ACTION",
						"intent_delivery": "2"
					}
				}
			};
			this.sendCommand("com.symbol.datawedge.api.SET_CONFIG", profileConfig2);
		
			//  Give some time for the profile to settle then query its value
			setTimeout(function () {
				this.sendCommand("com.symbol.datawedge.api.GET_ACTIVE_PROFILE", "");
			}, 1000);
		},
		
		datawedge65: function() {
			console.log("Datawedge 6.5 APIs are available");
		
			document.getElementById('info_datawedgeVersion').innerHTML = "6.5 or higher.";
		
			//  Instruct the API to send 
			_sendCommandResults = "true";
			document.getElementById('header_lastApiMessage').style.display = "block";
			document.getElementById('info_lastApiMessage').style.display = "block";
		},
		
		commandReceived: function(commandText) {
			document.getElementById('info_lastApiMessage').innerHTML = commandText;
		},
		
		enumerateScanners: function(enumeratedScanners) {
			var humanReadableScannerList = "";
			for (var i = 0; i < enumeratedScanners.length; i++)
			{
				console.log("Scanner found: name= " + enumeratedScanners[i].SCANNER_NAME + ", id=" + enumeratedScanners[i].SCANNER_INDEX + ", connected=" + enumeratedScanners[i].SCANNER_CONNECTION_STATE);
				humanReadableScannerList += enumeratedScanners[i].SCANNER_NAME;
				if (i < enumeratedScanners.length - 1)
					humanReadableScannerList += ", ";
			}
			document.getElementById('info_availableScanners').innerHTML = humanReadableScannerList;
		},
		
		activeProfile: function(theActiveProfile) {
			document.getElementById('info_activeProfile').innerHTML = theActiveProfile;
		},
		
		// barcodeScanned: function(scanData, timeOfScan) {
		// 	var scannedData = scanData.extras["com.symbol.datawedge.data_string"];
		// 	var scannedType = scanData.extras["com.symbol.datawedge.label_type"];
		// 	console.log("Scan: " + scannedData);
		// 	scans.unshift({ "data": scannedData, "decoder": scannedType, "timeAtDecode": timeOfScan });
		// 	console.log(scans);
		// 	var scanDisplay = "";
		// 	for (var i = 0; i < scans.length; i++)
		// 	{
		// 		scanDisplay += "<b><small>" + scans[i].decoder + " (" + scans[i].timeAtDecode + ")</small></b><br>" + scans[i].data + "<br><br>";
		// 	}
		// 	document.getElementById('container-Barcode---Reader--scannedBarcodes').innerHTML = scanDisplay;
		// }



		//Methods for enterprisebrowser
		enumerate: function() {
			scannerArray = EB.Barcode.enumerate();
			if (scannerArray.length == 0) {
				alert("No SCanners Found");
			}
			if (done == false) {
				for (count = 0; count < scannerArray.length; count++) {
					var yes_button = makeRadioButton(scannerArray[count].friendlyName, count);
					radio_home.appendChild(yes_button);
				}
			}
			done = true;
			document.getElementById('Scanners').style.visibility = 'visible';
		},
		
		btnSearch_Click: function() {
			document.getElementById('enable').style.visibility = 'visible';
			document.getElementById('enable2').style.visibility = 'visible';
		},
		
		enableCommonAPI: function() {
			if (document.getElementById('b0').checked == true) {
				scanner = scannerArray[0];
			} else if (document.getElementById('b1').checked == true) {
				scanner = scannerArray[1];
			} else if (document.getElementById('b2').checked == true) {
				scanner = scannerArray[2];
			}
		
			scanner.enable({}, callback);
			document.getElementById('start').style.visibility = 'visible';
			document.getElementById('start2').style.visibility = 'visible';
		},
		
		enableWithoutCallback: function() {
			if (document.getElementById('b0').checked == true) {
				scanner = scannerArray[0];
			} else if (document.getElementById('b1').checked == true) {
				scanner = scannerArray[1];
			} else if (document.getElementById('b2').checked == true) {
				scanner = scannerArray[2];
			}
			scanner.enable();
		},
		
		disableCommonAPI: function() {
			scanner.disable();
			document.getElementById('quit').style.visibility = 'visible';
			document.getElementById('quit2').style.visibility = 'visible';
		},
		
		startScanner: function() {
			scanner.start();
			document.getElementById('data').style.visibility = 'visible';
			document.getElementById('stop').style.visibility = 'visible';
			document.getElementById('stop2').style.visibility = 'visible';
			document.getElementById('restart').style.visibility = 'visible';
			document.getElementById('disable').style.visibility = 'visible';
			document.getElementById('disable2').style.visibility = 'visible';
		},
		
		stopScanner: function() {
			scanner.stop();
			document.getElementById('quit').style.visibility = 'visible';
			document.getElementById('quit2').style.visibility = 'visible';
		},
		
		callback: function(dat) {
			document.getElementById("display").value = dat.data;
		},
		
		quit: function() { 
			EB.Application.quit();
		},
		
		//var radio_home = document.getElementById("radio_home");
		
		makeRadioButton: function(name, count) {
		
			var label = document.createElement("label");
			var radio = document.createElement("input");
			var br = document.createElement("br");
			radio.onclick = btnSearch_Click;
			radio.type = "radio";
			radio.name = "Scanner";
			radio.id = "b" + count;
			radio.value = name;
			label.appendChild(radio);
		
			label.appendChild(document.createTextNode(name));
			label.appendChild(br);
			return label;
		},
		
		handleClick: function(property) {
			alert("Property for " + property.value + "=" + property.checked + " has successfuly applied");
			if (property.value == "autoenter") {
				if (property.checked == true)
					scanner.setProperty("autoenter", "true");
				else
					scanner.setProperty("autoenter", "false");
			} else if (property.value == "autotab") {
				if (property.checked == true)
					scanner.setProperty("autotab", "true");
				else
					scanner.setProperty("autotab", "false");
			} else if (property.value == "allDecoders") {
				if (property.checked == true)
					scanner.setProperty("allDecoders", "true");
				else
					scanner.setProperty("allDecoders", "false");
			}
			enableWithoutCallback();
		},

	//DATAWEDGE with enterprise browser

	sendIntentShimCommand: function(extraName, extraValue) {
		console.log("Sending Command: " + extraName + ", " + JSON.stringify(extraValue));
		var broadcastExtras = {};
		broadcastExtras[extraName] = extraValue;
		broadcastExtras["SEND_RESULT"] = _sendCommandResults;
		window.plugins.intentShim.sendBroadcast({
			action: "com.symbol.datawedge.api.ACTION",
			extras: broadcastExtras
		},
			function () { },
			function () { }
		);
	},


	//Enterprise Browser
	sendIntentCommand: function(extraName, extraValue) {
		console.log("Sending Command: " + extraName + ", " + JSON.stringify(extraValue));
		//console.log(`${expression}`, "extraValue");
		EB.Intent.send({
			action: "com.symbol.datawedge.api.ACTION",
			data: {"com.symbol.datawedge.api.SOFT_SCAN_TRIGGER":"START_SCANNING"}
		},
			function () { 
				console.log(broadcastExtras);
			}
		);
	},

	triggerScan: function(){
		//scanner.start(startIntentListener); //It doesn't work
		// console.log(EB.Barcode.enumerate()[0]);
		// EB.Barcode.enable({illuminationMode:'alwaysOn', code128:'enabled'}, this.myIntentListenerCallback);
		// console.log(EB.Barcode.getProperty('illuminationMode'));
		// EB.Barcode.start();
		//this.sendIntentCommand("com.symbol.datawedge.api.SOFT_SCAN_TRIGGER",'START_SCANNING');
		//this.sendIntentShimCommand("com.symbol.datawedge.api.SOFT_SCAN_TRIGGER",'START_SCANNING');
		// EB.Intent.send({
		// 	action:"com.symbol.datawedge.api.SOFT_SCAN_TRIGGER",
		// 	data:{}
		// },
		// function(){ });
		var params = {
			intentType: EB.Intent.BROADCAST,
			action: 'com.symbol.datawedge.api.ACTION',
			appName: 'com.symbol.datawedge',
			data: {"com.symbol.datawedge.api.SOFT_SCAN_TRIGGER":"START_SCANNING"}};
		EB.Intent.send(params);
	},



	myIntentListenerCallback: function(myIntentData){

		if((myIntentData != null) && (myIntentData.action == "com.symbol.dw.action")){
			
			var dataWedgeScannedData = myIntentData.data;
			
			outputData = "<BR/> <b>Scanned Data:</b> <BR/>" +
			
			"<BR/> Intent Type:" + myIntentData.intentType + "<BR/>" +
			
			"<BR/> Intent Action:" + myIntentData.action + "<BR/>" +
			
			"<BR/> Decode Source:" + dataWedgeScannedData["com.symbol.datawedge.source"] + "<BR/>" +
			
			"<BR/> Decode Label Type:" + dataWedgeScannedData["com.symbol.datawedge.label_type"] + "<BR/>" + 
			
			"<BR/> Decode Data:" + dataWedgeScannedData["com.symbol.datawedge.decode_data"] + "<BR/>" +
			
			"<BR/> Decode Data String:" + dataWedgeScannedData["com.symbol.datawedge.data_string"] + "<BR/>";
			
			var ouptutDiv = document.getElementById("container-Barcode---Reader--scannedBarcodes");
			
			ouptutDiv.innerHTML = outputData;
			
			}

			var params = {
				intentType: EB.Intent.BROADCAST,
				action: 'com.symbol.datawedge.api.ACTION',
				appName: 'com.symbol.datawedge',
				data: {"com.symbol.datawedge.api.SOFT_SCAN_TRIGGER":"STOP_SCANNING"}};
			EB.Intent.send(params);
		
		},
		
		startIntentListener: function()
		
		{
		
			//var startListeningDiv = document.getElementById("intentMessageDiv");
			
			//startListeningDiv.innerHTML = "Enterprise Browser is listening the DataWedge Intent. <BR/>Scan any data using DataWedge.<BR/><BR/>";
			
			EB.Intent.startListening(this.myIntentListenerCallback);
		
		},
		
		registerIntent: function(){
		
			this.startIntentListener();
		
		}



	});




	
});