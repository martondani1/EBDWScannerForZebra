/*global QUnit*/

sap.ui.define([
	"transmeri/barcode/Barcode/controller/Reader.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Reader Controller");

	QUnit.test("I should test the Reader controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});