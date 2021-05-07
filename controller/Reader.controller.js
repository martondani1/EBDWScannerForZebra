
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"sap/ui/core/mvc/View",
	"../ebapi-modules"
], function (Controller,
	MessageToast,
	View,
	EB) {
	"use strict";
	var _oController;
	var outputData = "";

	return Controller.extend("transmeri.barcode.Barcode.controller.Reader", {
		onInit: function () {
			_oController = this;
			this.registerIntent();
		},

	//This will be a universal function for different intent commands
	sendIntentCommand: function(extraName, extraValue) {
		console.log("Sending Command: " + extraName + ", " + JSON.stringify(extraValue));
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
		
		startIntentListener: function(){
			EB.Intent.startListening(this.myIntentListenerCallback);
		},
		
		registerIntent: function(){
			this.startIntentListener();
		}



	});




	
});