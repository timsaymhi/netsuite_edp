jQuery.getScript("https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js", function() {jQuery('<style>').load("https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css").appendTo("head");})
		.defaults = {
			bgOpacity: null,
			backgroundDismiss: false,
			backgroundDismissAction: 'shake',
			autoClose: false,
			boxWidth: '50%',
			useBootstrap: false,
			type: 'blue',
			onContentReady: function() {},
			onOpenBefore: function() {},
			onOpen: function() {},
			onClose: function() {},
			onDestroy: function() {},
			onAction: function() {},
			buttons: {},
			defaultButtons: {
				ok: {
					action: function () {
					}
				}
			}
		};
const suiteletRecord = 2012;
const suiteletDeployment = 1;		
	
function arrUnique(obj) {
    var uniques=[];
    var stringify={};
    for(var i=0;i<obj.length;i++){
       var keys=Object.keys(obj[i]);
       keys.sort(function(a,b) {return a-b});
       var str='';
        for(var j=0;j<keys.length;j++){
           str+= JSON.stringify(keys[j]);
           str+= JSON.stringify(obj[i][keys[j]]);
        }
        if(!stringify.hasOwnProperty(str)){
            uniques.push(obj[i]);
            stringify[str]=true;
        }
    }
    return uniques;
}

function FieldChanged(name, type) {
	if (name === 'custpage_price_list') {
		if (type === 'custpage_edit_price') {
			var editLine = nlapiGetCurrentLineItemValue('custpage_price_list', 'custpage_edit_price')||'';
			if (editLine === 'add') {
				jQuery('#custpage_price_list_custpage_edit_item_display').prop('disabled', false);
				jQuery('#custpage_price_list_custpage_base_currency_display').prop('disabled', false);
				
			}
		}
	}
}

function getCurrency() {
	var itemSearch = nlapiSearchRecord("currency", null, null,
		[
			new nlobjSearchColumn("internalid"),
			new nlobjSearchColumn("name"),
			new nlobjSearchColumn("symbol")
		]
	);
	var itemResults = [];
	if (itemSearch && itemSearch.length) {
		for (var i = 0; i < itemSearch.length; i++) {
			var itemLine = {};
			itemLine.id = Number(itemSearch[i].getValue('internalid'));
			itemLine.name = itemSearch[i].getValue('name');
			itemLine.symbol = itemSearch[i].getValue('symbol');
			itemResults.push(itemLine);
		}
	}
	return itemResults;
}

function cRedirect() {
	
	var url = nlapiResolveURL('suitelet',suiteletRecord,suiteletDeployment);
	window.onbeforeunload = null;
	window.open(url, "_self");
}

function PageInit() {
	try {
		jQuery(document).ready(function() {
			jQuery('#custpage_price_list_custpage_edit_item_display').prop('disabled', true);
			jQuery('#custpage_price_list_custpage_base_currency_display').prop('disabled', true);
		});
		return true;
	}
	catch(e) {console.log(e); return true;}
}

function openURL(customerId) {
	var url = nlapiResolveURL('suitelet', suiteletRecord, suiteletDeployment) + '&custpage_customer=' + customerId + '&custpage_list_edit=F';
	window.onbeforeunload = null;
	window.open(url, "_self");
}

function LineInit(name) {
	if (name === 'custpage_price_list') {
		var lineItem = nlapiGetCurrentLineItemValue('custpage_price_list', 'custpage_record_id')||'';
		if (lineItem && lineItem != '') {
			nlapiRemoveLineItemOption('custpage_price_list', 'custpage_edit_price', 'add');
		}
		else {
			nlapiInsertLineItemOption('custpage_price_list', 'custpage_edit_price', 'add', 'Add');
			nlapiRemoveLineItemOption('custpage_price_list', 'custpage_edit_price', 'edit');
			nlapiRemoveLineItemOption('custpage_price_list', 'custpage_edit_price', 'delete');
		}
	}
}

function ValidateLine(name) {
	var customerId = nlapiGetFieldValue('custpage_customer');
	if (name === 'custpage_price_list') {
		var editLine = nlapiGetCurrentLineItemValue('custpage_price_list', 'custpage_edit_price')||'';
		if (!editLine || editLine == '') {
			return true;
		}
		else if (editLine == 'edit') {
			var lineItem = nlapiGetCurrentLineItemValue('custpage_price_list', 'custpage_record_id');
			var liUpdate = nlapiSubmitField('customrecord_edp_base_price', Number(lineItem), ['custrecord_edp_price','custrecord_edp_base_start'], [Number(nlapiGetCurrentLineItemValue('custpage_price_list', 'custpage_base_price')),nlapiGetCurrentLineItemValue('custpage_price_list','custpage_base_start')]);
			openURL(customerId);
		}
		else if (editLine == 'delete') {
			var lineItem = nlapiGetCurrentLineItemValue('custpage_price_list', 'custpage_record_id');
			var liUpdate = nlapiDeleteRecord('customrecord_edp_base_price', Number(lineItem));
			openURL(customerId);
		}
		else if (editLine == 'add') {
			var priceRec = nlapiCreateRecord('customrecord_edp_base_price');
			priceRec.setFieldValue('custrecord_edp_customer', customerId);
			priceRec.setFieldValue('custrecord_edp_item', Number(nlapiGetCurrentLineItemValue('custpage_price_list', 'custpage_edit_item')));
			priceRec.setFieldValue('custrecord_edp_currency', Number(nlapiGetCurrentLineItemValue('custpage_price_list', 'custpage_base_currency')));
			priceRec.setFieldValue('custrecord_edp_price', Number(nlapiGetCurrentLineItemValue('custpage_price_list', 'custpage_base_price')));
			priceRec.setFieldValue('custrecord_edp_base_start', (nlapiGetCurrentLineItemValue('custpage_price_list', 'custpage_base_start')));
			var liAdd = nlapiSubmitRecord(priceRec);
			openURL(customerId);
		}
		else {
			return true;
		}
	}
	return true;
}

function DownloadCSV() {
	var customerId = nlapiGetFieldValue('custpage_customer')||'';
	if (!customerId) {
		jQuery.alert({
			title: 'Error',
			content: 'No customer was selected.',
			boxWidth: '50%',
			useBootstrap: false,
			type: 'red',
			buttons: {
				ok: function() {
					var url = nlapiResolveURL('suitelet', suiteletRecord, suiteletDeployment);
					window.onbeforeunload = null;
					window.open(url, "_self");
				}
			}
		});
	}
	else {
		var csvContents = convertToCSV(customerId);
		var suggestedName = customerId + '-base-pricing.csv';
		var element = document.createElement('a');
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(csvContents));
		element.setAttribute('download', suggestedName);
		element.style.display = 'none';
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);
		return true;
	}
}

function UploadCSV() {
	jQuery.getScript("https://static.filestackapi.com/filestack-js/3.x.x/filestack.min.js");
	var customerId = nlapiGetFieldValue('custpage_customer')||'';
	if (!customerId) {
		jQuery.alert({
			title: 'Error',
			content: 'No customer was selected.',
			type: 'red',
			boxWidth: '50%',
			useBootstrap: false,
			buttons: {
				ok: function() {
					var url = nlapiResolveURL('suitelet', suiteletRecord, suiteletDeployment);
					window.onbeforeunload = null;
					window.open(url, "_self");
				}
			}
		});
	}
	else {
		var contents = 'This process will delete all base pricing for the selected customer<br/>and import the selected content.<br/><br/><u>CSV Format:</u><br/>customerid,itemid,price,currency,date<br>custintid,itemname,5.00,currencyname,28/08/2023<br/><br/>';
		contents += 'Valid currencies are:<br/><table><tr><th>Symbol</th><th>Name</th></tr>';
		var currencies = getCurrency();
		currencies.forEach(function(c) {
			contents += '<tr><td>'+c.symbol+'</td><td>'+c.name+'</td></tr>';
			return true;
		});
		contents += '</table><br/>';
		contents += '<form name="form_input" enctype="multipart/form-data">';
		contents += '<input type="checkbox" id="removeall" name="removeall">';
		contents += '<label for="removeall">Remove All Base Prices Before Input</label><br>';
		contents += '<input id="file" name="file" type="file" />';
		contents += '<button type="button" onclick="doSomething()">Upload</button>';
		contents += '</form>';
		contents += '<div id="outputDiv" hidden></div>';
		contents += '<script>function doSomething() {';
		contents += 'var file = document.getElementById("file");';
		contents += 'var reader = new FileReader();';
		contents += 'reader.onload = function(e) {';
		contents += 'document.getElementById("outputDiv").innerHTML = e.target.result;';
		contents += 'jQuery.dialog({title: "Uploaded", useBootstrap: false, Width: "50%", content: "Document loaded"});'
		contents += '}; reader.readAsBinaryString(file.files[0]);';
		contents += '}</script>';
		jQuery.confirm({
			title: 'Bulk Price Import',
			content: contents,
			boxWidth: '50%',
			useBootstrap: false,
			buttons: {
				formSubmit: {
				text: 'Submit',
				btnClass: 'btn-blue',
				action: function () {
					var fileContent = document.getElementById("outputDiv").innerHTML;
					if (!fileContent) {
						jQuery.alert({title: 'Error', useBootstrap: false, boxWidth: '50%', content: 'No document content uploaded.'});
					}
					else {
						var removePricing = document.getElementById("removeall").checked;
						var procMsg = jQuery.alert({
							title: 'Notice', 
							boxWidth: '50%',
							useBootstrap: false,
							content: 'This process will take a minute<br/> and your screen may appear to freeze.<br/>Please wait.<br/>Open your browsers console to see progress before clicking ok.<br/>',
							buttons: {
								ok: function() {
									var customerId = Number(nlapiGetFieldValue('custpage_customer'))||0;
									var newInfo = fileContent.split('\n');
									if (customerId && customerId != 0) {
										var searchResult = nlapiSearchRecord("customrecord_edp_base_price",null,
										[
										   ["custrecord_edp_customer.internalidnumber","equalto",customerId]
										], 
										[
											new nlobjSearchColumn("internalid"),
											new nlobjSearchColumn("internalid","CUSTRECORD_EDP_CUSTOMER", null),
											new nlobjSearchColumn("CUSTRECORD_EDP_ITEM"),
											new nlobjSearchColumn("internalid","CUSTRECORD_EDP_ITEM",null), 
											new nlobjSearchColumn("custrecord_edp_price"),
											new nlobjSearchColumn("internalID", "CUSTRECORD_EDP_CURRENCY", null)
										]
										);
										if (searchResult && searchResult.length > 0) {
											for (var j = 0; j < searchResult.length; j++) {
												if (removePricing == true) {
													var priceId = searchResult[j].getValue("internalid");
													var itemName = searchResult[j].getText("custrecord_edp_item");
													var delId = nlapiDeleteRecord('customrecord_edp_base_price', Number(priceId));
												}
												else {
													var itemId = searchResult[j].getText("CUSTRECORD_EDP_ITEM");
													for (var l = 0; l < newInfo.length; l++) {
														var line = newInfo[l];
														var lineInfo = line.split(',');
														if (itemId == lineInfo[1]) {
															var priceId = searchResult[j].getValue("internalid");
															var itemName = searchResult[j].getText("custrecord_edp_item");
															var delId = nlapiDeleteRecord('customrecord_edp_base_price', Number(priceId));
															break;
														}
													}
												}
											}
										}
									}
									else {
										var fileCustomer = [];
										var fileCustomerItem = [];
										newInfo.forEach(function(line) {
											var lineInfo = line.split(',');
											if (lineInfo.length == 5) {
												if (!fileCustomer.includes(Number(lineInfo[0]))) {
													fileCustomer.push(Number(lineInfo[0]));
												}
												var cfiLine = {};
												cfiLine.customer = Number(lineInfo[0]);
												cfiLine.item = lineInfo[1];
												fileCustomerItem.push(cfiLine);
											}
											return true;
										});
										if (fileCustomer && fileCustomer.length > 0) {
											fileCustomer.forEach(function(c) {
												var cItems = [];
												fileCustomerItem.forEach(function(f) {
													if (Number(f.customer) == Number(c)) {
														cItems.push(f.item);
													}
													return true;
												});
												var searchResult = nlapiSearchRecord("customrecord_edp_base_price",null,
												[
												   ["custrecord_edp_customer.internalidnumber","equalto",c]
												], 
												[
													new nlobjSearchColumn("internalid"),
													new nlobjSearchColumn("internalid","CUSTRECORD_EDP_CUSTOMER", null),
													new nlobjSearchColumn("CUSTRECORD_EDP_ITEM"),
													new nlobjSearchColumn("internalid","CUSTRECORD_EDP_ITEM",null), 
													new nlobjSearchColumn("custrecord_edp_price"),
													new nlobjSearchColumn("internalID", "CUSTRECORD_EDP_CURRENCY", null)
												]
												);
												if (searchResult && searchResult.length > 0) {
													for (var j = 0; j < searchResult.length; j++) {
														if (removePricing == true) {
															var itemName = searchResult[j].getText("custrecord_edp_item");
															var delId = nlapiDeleteRecord('customrecord_edp_base_price', Number(searchResult[j].getValue("internalid")));
														}
														else {
															var itemId = searchResult[j].getText("CUSTRECORD_EDP_ITEM");
															if (cItems.includes(itemId)) {
																var itemName = searchResult[j].getText("custrecord_edp_item");
																var delId = nlapiDeleteRecord('customrecord_edp_base_price', Number(searchResult[j].getValue("internalid")));
															}
														}
													}
												}
												return true;
											});
										}
									}
									var records = 0;
									var items = getItems();
									newInfo.forEach(function(line) {
										var lineInfo = line.split(',');
										if (lineInfo.length == 5) {
										var priceRec = nlapiCreateRecord('customrecord_edp_base_price');
										priceRec.setFieldValue('custrecord_edp_customer', Number(lineInfo[0]));
										for (var i = 0; i < items.length; i++) {
											if (items[i].name === lineInfo[1]) {
												priceRec.setFieldValue('custrecord_edp_item', Number(items[i].id));
												break;
											}
										}	
										priceRec.setFieldValue('custrecord_edp_price', parseFloat(lineInfo[2]));
										for (var c = 0; c < currencies.length; c++) {
											if (lineInfo[3] === currencies[c].symbol) {
												priceRec.setFieldValue('custrecord_edp_currency', Number(currencies[c].id));
												break;
											}
										}
										priceRec.setFieldValue('custrecord_edp_base_start', lineInfo[4]);
										var liAdd = nlapiSubmitRecord(priceRec);
										if (liAdd) {
											records++;
										}
										}
										return true;
									});
									jQuery.alert({
										title: 'Complete',
										content: records + ' base price records imported.',
										boxWidth: '50%',
										useBootstrap: false,
										buttons: {
											ok: function() {
												var url = nlapiResolveURL('suitelet', suiteletRecord, suiteletDeployment);
												window.onbeforeunload = null;
												window.open(url, "_self");
											}
										}
									});
								}
							}
						});
					}
				}
				},
				cancel: function () {
				},
			}
		});
	}
}

function getItems() {
	var searchquery = nlapiCreateSearch("inventoryitem", null, 
		[
			new nlobjSearchColumn("internalid"),
			new nlobjSearchColumn("itemid")
		]
	);
	var searchresults = searchquery.runSearch();
	var itemResults = [];
	var resultIndex = 0;
	var resultStep = 1000;
	var resultSet;
	do {
		resultSet = searchresults.getResults(resultIndex, resultIndex + resultStep);    
		resultIndex = resultIndex + resultStep;                     
		for (var i = 0; !!resultSet && i < resultSet.length; i++) {   
			var itemLine = {};
			itemLine.id = Number(resultSet[i].getValue('internalid'));
			itemLine.name = resultSet[i].getValue('itemid');
			itemResults.push(itemLine);
		}
	} while (resultSet && resultSet.length > 0)
	console.log(JSON.stringify(itemResults));
	return itemResults;
}
							
function convertToCSV (customerId) {
	var contents = "";
	if (Number(customerId) == 0) {
		var searchquery = nlapiCreateSearch("customrecord_edp_base_price", 
		[
			["custrecord_edp_customer.internalidnumber","isnotempty",""]
		],
		[
			new nlobjSearchColumn("internalid","CUSTRECORD_EDP_CUSTOMER", null),
			new nlobjSearchColumn("itemid","CUSTRECORD_EDP_ITEM",null), 
			new nlobjSearchColumn("custrecord_edp_price"),
			new nlobjSearchColumn("symbol", "CUSTRECORD_EDP_CURRENCY", null),
			new nlobjSearchColumn("custrecord_edp_base_start")
		]
		);
	}
	else {
		var searchquery = nlapiCreateSearch("customrecord_edp_base_price", 
		["custrecord_edp_customer.internalidnumber","equalto",customerId], 
		[
			new nlobjSearchColumn("internalid","CUSTRECORD_EDP_CUSTOMER", null),
			new nlobjSearchColumn("itemid","CUSTRECORD_EDP_ITEM",null), 
			new nlobjSearchColumn("custrecord_edp_price"),
			new nlobjSearchColumn("symbol", "CUSTRECORD_EDP_CURRENCY", null),
			new nlobjSearchColumn("custrecord_edp_base_start")
		]
		);
	}
		var custResults = [];
		var searchresults = searchquery.runSearch();
		var resultIndex = 0;
		var resultStep = 1000;
		var resultSet;
		do {
			resultSet = searchresults.getResults(resultIndex, resultIndex + resultStep);    
			resultIndex = resultIndex + resultStep; 
			for (var i = 0; !!resultSet && i < resultSet.length; i++) {   
				var custResults = resultSet[i];
				var columns = custResults.getAllColumns();
				var x = 1;
				for (var y = 0; y < columns.length; y++) {
					contents += custResults.getValue(columns[y])||'';
					if (x != columns.length) {contents += ',';}
					x++;
				}
				contents += '\r\n';
			}
		} while (resultSet && resultSet.length > 0)
	if (!custResults || custResults.length <= 0) {
		jQuery.alert({
			title: 'Error',
			content: 'No customer base pricing was found.',
			boxWidth: '50%',
			useBootstrap: false,
			type: 'red',
			buttons: {
				ok: function() {
					var url = nlapiResolveURL('suitelet', 'customscript_edp_edit_base_price', 'customdeploy_edp_edit_base_price');
					window.onbeforeunload = null;
					window.open(url, "_self");
				}
			}
		});
	}
	return contents;
}

function getAll() {
	var customerSearch = nlapiSearchRecord("customer",null,
	[
	], 
	[
	   new nlobjSearchColumn("internalid"), 
	   new nlobjSearchColumn("entityid").setSort(false), 
	   new nlobjSearchColumn("item","pricing",null), 
	   new nlobjSearchColumn("pricelevel","pricing",null), 
	   new nlobjSearchColumn("unitprice","pricing",null), 
	   new nlobjSearchColumn("currency","pricing",null)
	]
	);
	var priceTable = '<table><thead><tr><th>Customer</th><th>Item</th><th>Price Level</th><th>Unit Price</th><th>Currency</th></tr></thead><tbody>';
	for (var c = 0; c < customerSearch.length; c++) {
		priceTable += '<tr><td>'+customerSearch[c].getValue("entityid")+'</td><td>'+customerSearch[c].getText("item","pricing")+'</td><td>'+customerSearch[c].getText("pricelevel","pricing")+'</td><td>'+customerSearch[c].getValue("unitprice","pricing")+'</td><td>'+customerSearch[c].getText("currency","pricing")+'</td></tr>';
	}
	priceTable += '</tbody></table>';
	jQuery.dialog({
		title: 'All Pricing',
		content: priceTable
	});
}