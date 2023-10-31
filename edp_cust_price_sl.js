function getCustomers() {
	var searchquery = nlapiCreateSearch("customer", null, 
		[
			new nlobjSearchColumn("internalid"),
			new nlobjSearchColumn("companyname"),
			new nlobjSearchColumn("currency")
		]
	);
	var custResults = [];
	var searchresults = searchquery.runSearch();
	var resultIndex = 0;
	var resultStep = 1000;
	var resultSet;
	do {
		resultSet = searchresults.getResults(resultIndex, resultIndex + resultStep);    
		resultIndex = resultIndex + resultStep; 
		for (var i = 0; !!resultSet && i < resultSet.length; i++) {   
			var custLine = {};
			custLine.id = Number(resultSet[i].getValue("internalid"));
			custLine.name = resultSet[i].getValue("companyname");
			custLine.currency = resultSet[i].getValue("currency");
			custResults.push(custLine);
		}
	} while (resultSet && resultSet.length > 0)
	return custResults;
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
	return itemResults;
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
	if (itemSearch && itemSearch.length > 0) {
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

function processCSV(contents) {
	var customers = getCustomers();
	var items = getItems();
	var currency = getCurrency();
	var lines = contents.split('\n');
	var csvArray = [];
	lines.forEach(function(line) {
		var v = line.replace(/\\/g, "");
		var w = v.split(",");
		if (w.length > 1) {
		var cLine = {};
		cLine.isok = 'T';
		cLine.custid = Number(w[0]).toFixed(0);
		cLine.custname = 'invalid';
		cLine.itemid = 'invalid';
		cLine.itemname = w[1];
		cLine.start = w[2];
		cLine.end = w[3];
		cLine.price = parseFloat(w[4]);
		cLine.currid = 'invalid';
		cLine.currname = w[5];
		for (var a = 0; a < customers.length; a++) {
			if (customers[a].id == w[0]) {
				cLine.custname = customers[a].name;
				break;
			}
		}
		for (var a = 0; a < items.length; a++) {
			if (items[a].name == w[1]) {
				cLine.itemid = Number(items[a].id).toFixed(0);
				break;
			}
		}
		for (var a = 0; a < currency.length; a++) {
			if (currency[a].symbol == w[5]) {
				cLine.currid = currency[a].id;
				break;
			}
		}
		csvArray.push(cLine);
		return true;
		}
	});
	csvArray.forEach(function(c) {
		if (c.custname == 'invalid' || c.itemid == 'invalid' || c.currname == 'invalid') {
			c.isok = 'F';
		}
		return true;
	});
	
	return csvArray;
}

function renderForm(request, response) {
    var context = nlapiGetContext();
	if (request.getMethod() == 'GET') {
		var message = request.getParameter('message');
		var form = nlapiCreateForm('Customer EDP Promotional Pricing');
		form.setScript('customscript_c_promo_price_cl');
		form.addField('custpage_scripts', 'inlinehtml', 'Scripts');
		form.addFieldGroup('custpage_csv_options', 'Information').setSingleColumn(true);
		var format = '<B><U>CSV FILE FORMAT</U></B><BR><BR>';
		format += 'customer, item, startdate, enddate, price, currency<BR><BR>';
		format += '<B>NO HEADER!</B><br/><br/>';
		if (message) {
			format += "<b><u>CSV ERROR:</b></u><br/><br>" + message;
		}
		form.addField('custpage_information', 'inlinehtml', 'Information', null, 'custpage_csv_options').setDefaultValue(format);
		form.addField('custpage_csv_file', 'file', 'Select File', null, null).setLayoutType('outsidebelow','startrow').setMandatory(true);
		form.addSubmitButton('Submit');
		response.writePage(form);
	}
	else {
		var form = nlapiCreateForm('Customer EDP Promotional Pricing');
		form.setScript('customscript_c_promo_price_cl');
		form.addField('custpage_scripts', 'inlinehtml', 'Script Source', null, null).setDisplayType('hidden');
		var csvFile = request.getFile('custpage_csv_file')||'';
		if (!csvFile) {response.write('No CSV file selected.');}
		try {
			var csvValue = csvFile.getValue();
			form.addFieldGroup('custpage_csv_options', 'Options').setSingleColumn(true);
			form.addField('custpage_mod_so', 'checkbox', 'Modify Open Sales Orders', null, 'custpage_csv_options');
			form.addField('custpage_mrs_run', 'checkbox', 'Run Price Update After Save', null, 'custpage_csv_options');
			var alertMessage = '<BR><BR>The table below reflect existing pricing which has overlapping dates and will cause your<BR>import to fail. Modify the dates on existing pricing in the table below<BR>before submitting the CSV import.<BR><BR>';
			alertMessage += '<B>Modify only the existing start and end dates to fall outside the CSV range.<B><BR>End Dates cannot be modified earlier than the current date.<BR><BR>'
			form.addTab('custpage_csv_price', 'CSV Import');
			var csvList = form.addSubList('custpage_csv', 'list', 'CSV Import', 'custpage_csv_price');
			var cbbutton = csvList.addButton('custpage_p_con', 'Process Conflicts', 'processPrice()');
			var cbsubmit = csvList.addButton('custpage_p_sub', 'Submit Pricing', 'addPrice()');
			cbsubmit.setDisabled(true);
			csvList.addField('custpage_csv_ok', 'checkbox', 'Line OK').setDisplayType('inline');
			csvList.addField('custpage_csv_import', 'checkbox', 'Import OK').setDisplayType('inline');
			csvList.addField('custpage_csv_cust_id', 'text', 'Customer').setDisplayType('hidden');
			csvList.addField('custpage_csv_cust', 'text', 'Customer');
			csvList.addField('custpage_csv_item_id', 'text', 'Item').setDisplayType('hidden');
			csvList.addField('custpage_csv_item', 'text', 'Item');
			csvList.addField('custpage_csv_start', 'date', 'Start Date');
			csvList.addField('custpage_csv_end', 'date', 'End Date');
			csvList.addField('custpage_csv_price', 'currency', 'Price');
			csvList.addField('custpage_csv_currency_id', 'text', 'Currency').setDisplayType('hidden');
			csvList.addField('custpage_csv_currency', 'text', 'Currency');
			var csvArray = processCSV(csvValue);
			nlapiLogExecution('debug','csv',JSON.stringify(csvArray));
			form.addField('custpage_csv_data', 'textarea', 'CSV Data', null, 'custpage_csv_price').setDisplayType('hidden').setDefaultValue(JSON.stringify(csvArray));
			for (var i = 0; i < csvArray.length; i++) {
				csvList.setLineItemValue('custpage_csv_ok', i+1, csvArray[i].isok);
				csvList.setLineItemValue('custpage_csv_cust_id', i+1, csvArray[i].custid);
				csvList.setLineItemValue('custpage_csv_cust', i+1, csvArray[i].custname);
				csvList.setLineItemValue('custpage_csv_item_id', i+1, csvArray[i].itemid);
				csvList.setLineItemValue('custpage_csv_item', i+1, csvArray[i].itemname);
				csvList.setLineItemValue('custpage_csv_start', i+1, nlapiDateToString(nlapiStringToDate(csvArray[i].start,'DD/MM/YYYY'),'DD/MM/YYYY'));
				csvList.setLineItemValue('custpage_csv_end', i+1, nlapiDateToString(nlapiStringToDate(csvArray[i].end,'DD/MM/YYYY'),'DD/MM/YYYY'));
				csvList.setLineItemValue('custpage_csv_price', i+1, csvArray[i].price);
				csvList.setLineItemValue('custpage_csv_currency_id', i+1, csvArray[i].currid);
				csvList.setLineItemValue('custpage_csv_currency', i+1, csvArray[i].currname);
			};
			form.addTab('custpage_csv_conflicts', 'Price Conflicts');
			form.addField('custpage_conflict_info', 'inlinehtml', 'Alerts', null, 'custpage_csv_conflicts').setDefaultValue(alertMessage);
			form.addField('custpage_conflict_table', 'inlinehtml', 'Pricing Conflicts', null, 'custpage_csv_conflicts').setLayoutType('outsidebelow','startrow');
			response.writePage(form);
		}
		catch(e) {
			nlapiLogExecution('ERROR','Error',e.message);
			var p = new Array();
			p["message"] = e.message
			nlapiSetRedirectURL('suitelet', nlapiGetContext().getScriptId(), nlapiGetContext().getDeploymentId(),null,p);
		}
	}
}