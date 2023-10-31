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
			custLine.currency = resultSet[i].getText("currency");
			custResults.push(custLine);
		}
	} while (resultSet && resultSet.length > 0)
	return custResults;
}

function renderForm(request, response) {
    var context = nlapiGetContext();
	if (request.getMethod() == 'GET') {
		var form = nlapiCreateForm('Customer EDP Base Pricing');
		form.setScript('customscript_c_base_price_cl');
		form.addField('custpage_customer', 'select', 'Select Customer', null, null);
		form.getField('custpage_customer').addSelectOption(0,'Multiple Customer',true);
		var customers = getCustomers();
		customers.forEach(function(c) {
			form.getField('custpage_customer').addSelectOption(Number(c.id),c.name + ' ' + c.currency);
			return true;
		});
		form.addSubmitButton('Search');
		form.addButton('custpage_all_price', 'All Pricing', 'getAll()');
		form.addButton('custpage_csv_up', 'CSV Import', 'UploadCSV()');
		form.addButton('custpage_csv_down', 'CSV Download', 'DownloadCSV()');
		form.addButton('custpage_promo_old', 'Load Promos', 'cRedirect()');
		response.writePage(form);
	}
	else {
		var customerId = request.getParameter('custpage_customer')||'';
		var priceUpdates = request.getParameter('custpage_list_edit')||'F';
		if (customerId && priceUpdates == 'F') {
			var form = nlapiCreateForm('Customer EDP Base Pricing');
			form.setScript('customscript_c_base_price_cl');
			form.addField('custpage_customer', 'text', 'Customer').setDisplayType('hidden').setDefaultValue(customerId);
			form.addField('custpage_list_edit', 'checkbox', 'List Editing').setDisplayType('hidden').setDefaultValue('T');
			var customerName = customerId == 0 ? 'All Customers' : nlapiLookupField('customer', customerId, 'companyname');
			var priceList = form.addSubList('custpage_price_list', 'inlineeditor', customerName);
			priceList.addField('custpage_record_id', 'text', 'Internal ID').setDisplayType('hidden');
			var editOptions = priceList.addField('custpage_edit_price', 'select', 'Operation');
			editOptions.addSelectOption('','',true);
			editOptions.addSelectOption('edit','Edit');
			editOptions.addSelectOption('delete','Delete');
			editOptions.addSelectOption('add','Add');
			priceList.addField('custpage_edit_item', 'select', 'Item', 'item');
			priceList.addField('custpage_base_price', 'currency', 'Price');
			priceList.addField('custpage_base_currency', 'select', 'Currency', 'currency');
			priceList.addField('custpage_base_start', 'date', 'Start Date');
			if (customerId == 0) {
				var priceSearch = nlapiSearchRecord("customrecord_edp_base_price",null,
				[
				   ["custrecord_edp_base_start","onorbefore","today"]
				], 
				[
				   new nlobjSearchColumn("internalid",null,"GROUP"), 
				   new nlobjSearchColumn("internalid","CUSTRECORD_EDP_ITEM","GROUP"), 
				   new nlobjSearchColumn("custrecord_edp_price",null,"GROUP"),
				   new nlobjSearchColumn("custrecord_edp_currency",null,"GROUP"),			   
				   new nlobjSearchColumn("custrecord_edp_base_start",null,"MAX")
				]
				);
			}
			else {
				var priceSearch = nlapiSearchRecord("customrecord_edp_base_price",null,
				[
				   ["custrecord_edp_customer.internalidnumber","equalto",customerId], 
				   "AND", 
				   ["custrecord_edp_base_start","onorbefore","today"]
				], 
				[
				   new nlobjSearchColumn("internalid",null,"GROUP"), 
				   new nlobjSearchColumn("internalid","CUSTRECORD_EDP_ITEM","GROUP"), 
				   new nlobjSearchColumn("custrecord_edp_price",null,"GROUP"),
				   new nlobjSearchColumn("custrecord_edp_currency",null,"GROUP"),			   
				   new nlobjSearchColumn("custrecord_edp_base_start",null,"MAX")
				]
				);
			}
			var sl_line = 1;
			if (priceSearch && priceSearch.length > 0) {
			for (var iLR = 0; iLR < priceSearch.length; iLR++) {
				priceList.setLineItemValue('custpage_record_id', sl_line, priceSearch[iLR].getValue("internalid", null, "group"));
				priceList.setLineItemValue('custpage_edit_item', sl_line, Number(priceSearch[iLR].getValue("internalid","custrecord_edp_item","group")));
				priceList.setLineItemValue('custpage_base_price', sl_line, Number(priceSearch[iLR].getValue("custrecord_edp_price",null,"group")));
				priceList.setLineItemValue('custpage_base_currency', sl_line, Number(priceSearch[iLR].getValue("custrecord_edp_currency",null,"group")));
				priceList.setLineItemValue('custpage_base_start', sl_line, priceSearch[iLR].getValue("custrecord_edp_base_start",null,"max"));
				sl_line++;
			}
			}
			form.addButton('custpage_done_btn', 'Finish', 'cRedirect()');
			response.writePage(form);
		}
	}
}