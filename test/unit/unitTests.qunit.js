/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"transmeri/barcode/Barcode/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});