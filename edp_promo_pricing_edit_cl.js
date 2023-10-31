jQuery('head').append('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">');
jQuery('head').append('<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/popper.js@1.12.9/dist/umd/popper.min.js" integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q" crossorigin="anonymous"></script>');
jQuery('head').append('<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>');
jQuery('head').append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
jQuery('head').append('<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js"></script>');
const mapReduceScriptId = 2014;
	
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
	if (type === 'custpage_type') {
		var value = nlapiGetFieldValue('custpage_type');
		if (value == 2)  {
			console.log(value);
			jQuery('#custpage_customer_display').prop('disabled',false);
		}
	}
}

function getEDPRecs() {
	var searchquery = nlapiCreateSearch("customrecord_edp_price_update", [
		   ["custrecord_edp_update_status","anyof","2"]
		], 
		[
		   new nlobjSearchColumn("internalid"), 
		   new nlobjSearchColumn("custrecord_edp_update_item"), 
		   new nlobjSearchColumn("internalid","CUSTRECORD_EDP_UPDATE_ITEM",null), 
		   new nlobjSearchColumn("custrecord_edp_update_customer"), 
		   new nlobjSearchColumn("internalid","CUSTRECORD_EDP_UPDATE_CUSTOMER",null), 
		   new nlobjSearchColumn("custrecord_edp_update_start_date"), 
		   new nlobjSearchColumn("custrecord_edp_update_end_date"), 
		   new nlobjSearchColumn("custrecord_edp_update_status")
		]
	);
	var searchresults = searchquery.runSearch();
	var pSqlR = [];
	var resultIndex = 0;
	var resultStep = 1000;
	var resultSet;
	do {
		resultSet = searchresults.getResults(resultIndex, resultIndex + resultStep);    
		resultIndex = resultIndex + resultStep;                     
		for (var i = 0; !!resultSet && i < resultSet.length; i++) {   
			var line = {};
			line.pid = resultSet[i].getValue('internalid');
			line.cid = resultSet[i].getValue('internalid','custrecord_edp_update_customer');
			line.iid = resultSet[i].getValue('internalid','custrecord_edp_update_item');
			line.item = resultSet[i].getText('custrecord_edp_update_item');
			line.start = resultSet[i].getValue('custrecord_edp_update_start_date');
			line.end = resultSet[i].getValue('custrecord_edp_update_end_date');
			line.customer = resultSet[i].getText('custrecord_edp_update_customer');
			line.level = 'Promo',
			line.currency = '';
			pSqlR.push(line);
		}
	} while (resultSet && resultSet.length > 0)
	return pSqlR;
}
				
function PageInit() {

}

function addPrice() {
	var importLines = nlapiGetLineItemCount('custpage_csv');
	jQuery.confirm({
		title: 'Processing...',
		content: 'Preparing to import '+importLines+ ' records.<br/> This process may take a minute.',
		buttons: {
			ok: function() {
				var importedRecs = 0;
				var importLines = nlapiGetLineItemCount('custpage_csv');
				for (var r = 0; r < importLines; r++) {
						var modSo = nlapiGetFieldValue('custpage_mod_so')||'F';
						var mrsRun = nlapiGetFieldValue('custpage_mrs_run')||'F';
						var errors = '<table border="0" cellspacing="0" cellpadding="0" class="listtable listborder uir-list-table"><tr><th>Line</th><th><center>Error</center></th></tr>';
						try {
							console.log(Number(nlapiGetLineItemValue('custpage_csv','custpage_csv_cust_id', r+1)));
							var pRecord = nlapiCreateRecord('customrecord_edp_price_update');
							pRecord.setFieldValue('custrecord_edp_update_customer', Number(nlapiGetLineItemValue('custpage_csv','custpage_csv_cust_id', r+1)));
							pRecord.setFieldValue('custrecord_edp_update_type', 3);
							pRecord.setFieldValue('custrecord_edp_update_item', Number(nlapiGetLineItemValue('custpage_csv','custpage_csv_item_id',r+1)));
							pRecord.setFieldValue('custrecord_edp_update_start_date', nlapiGetLineItemValue('custpage_csv', 'custpage_csv_start', r+1)); 
							pRecord.setFieldValue('custrecord_edp_update_end_date', nlapiGetLineItemValue('custpage_csv', 'custpage_csv_end', r+1)); 
							pRecord.setFieldValue('custrecord_edp_update_status', 1);
							var pRecId = nlapiSubmitRecord(pRecord);
						}
						catch(e) {
							errors += '<tr><td>' + r+1 + '</td><td>' + e.message + '</td></tr>';
							var pRecId = '';
						}
						if (pRecId) {
							try {
								var pRecord2 = nlapiCreateRecord('customrecord_edp_price_detail_update');
								pRecord2.setFieldValue('custrecord_edp_price_update_id', Number(pRecId));
								pRecord2.setFieldValue('custrecord_edp_price_update_type', 3);
								pRecord2.setFieldValue('custrecord_edp_price_update_status', 1);
								pRecord2.setFieldValue('custrecord_edp_price_level', 0);
								pRecord2.setFieldValue('custrecord_edp_price_customer', Number(nlapiGetLineItemValue('custpage_csv','custpage_csv_cust_id', r+1)));
								pRecord2.setFieldValue('custrecord_edp_price_item', Number(nlapiGetLineItemValue('custpage_csv','custpage_csv_item_id',r+1)));
								pRecord2.setFieldValue('custrecord_edp_price_currency', Number(nlapiGetLineItemValue('custpage_csv','custpage_csv_currency_id',r+1)));
								pRecord2.setFieldValue('custrecord_edp_price_detail_activate', modSo);
								pRecord2.setFieldValue('custrecord_edp_price_modified_price', parseFloat(nlapiGetLineItemValue('custpage_csv','custpage_csv_price',r+1)));
								var p2RecId = nlapiSubmitRecord(pRecord2);
							}
							catch(e) {
								errors += '<tr><td>' + r+1 + '</td><td>' + e.message + '</td></tr>';
								var delId = nlapiDeleteRecord('customrecord_edp_price_update', pRecId);
								var p2RecId = '';
								
							}
						}
						if (pRecId && p2RecId) {
								nlapiSetLineItemValue('custpage_csv', 'custpage_csv_import', r+1, 'T');
								this.setContentAppend('<br/>Record ' + r+1 + ' imported.');
								importedRecs++;
						}
						else {
							this.setContentAppend('<br/>Record ' + r+1 + ' failed.');
						}
				}
				errors += '</table>';
				if (importedRecs == importLines.length) {
					jQuery.alert({
						title: 'Import Complete',
						content: 'Import completed with no errors.',
						type: 'green',
						buttons: {
							ok: function() {
								var modSo = nlapiGetFieldValue('custpage_mod_so')||'F';
								var mrsRun = nlapiGetFieldValue('custpage_mrs_run')||'F';
								if (modSo == 'T') {
										var par = {custscript_edp_mrs_task: 'customscript_edp_pricing_activate'};
										var modSoSubmit = nlapiScheduleScript(mapReduceScriptId,1,par);
								}
								if (mrsRun == 'T') {
										var par = {custscript_edp_mrs_task: 'customscript_edp_mr_customerpriceupdate'};
										var modSoSubmit = nlapiScheduleScript(mapReduceScriptId,2,par);
								}
								if (modSo == 'T' || mrsRun == 'T') {
									jQuery('#tr_fg_custpage_csv_options').remove();
									jQuery('#tr_custpage_p_sub').addClass('tabBntDis');
									jQuery('#tr_custpage_p_sub').removeClass('tabBnt');
									jQuery('#custpage_p_sub').prop('disabled', true);
									jQuery.dialog({
										title: 'Scheduled',
										content: 'Requested updates have been scheduled'
									});
								}
							}
						}
					});
				}
				else {
					jconfirm.defaults = {
						bgOpacity: null,
						backgroundDismiss: false,
						backgroundDismissAction: 'shake',
						autoClose: false,
						boxWidth: '80%',
						useBootstrap: false,
						type: 'blue',
						onContentReady: function() {},
						onOpenBefore: function() {},
						onOpen: function() {},
						onClose: function() {},
						onDestroy: function() {},
						onAction: function() {}
					};
					jQuery.dialog({
						title: 'Import Error',
						content: errors,
						type: 'red'
					});
				}
			},
			cancel: function() {
			}
		}
	});
}

function processPrice() {
	var errorTable = '<table id="custpage_csv_errors" width="100%" border="0" cellspacing="0" cellpadding="0" class="listtable listborder uir-list-table">';
	errorTable += '<tr class="uir-machine-headerrow"><td class="listheadertdwht listheadertextb uir-column-large" align="left">Customer</td>';
	errorTable += '<td class="listheadertdwht listheadertextb uir-column-large" align="left">Item</td>';
	errorTable += '<td class="listheadertdwht listheadertextb uir-column-large" align="left">Start Date</td>';
	errorTable += '<td class="listheadertdwht listheadertextb uir-column-large" align="left">End Date</td>';
	errorTable += '<td class="listheadertdwht listheadertextb uir-column-large" align="left">Edit Link</td></tr>';
	var csvArray = JSON.parse(nlapiGetFieldValue('custpage_csv_data'));
	if (!Array.isArray(csvArray)) {
		jQuery.alert('CSV has not been processed or contains too many errors.');
		nlapiSetFieldValue('custpage_conflict_table', 'CSV has not been processed or contains too many errors.');
	}
	else {
		var pSqlR = getEDPRecs();
		var displayError = [];
		csvArray.forEach(function (price) {
			var cust = Number(price.custid);
			var itm = Number(price.itemid);
			var a_start = nlapiStringToDate(price.start, 'DD/MM/YYYY');
			var a_end = nlapiStringToDate(price.end, 'DD/MM/YYYY');
			for (var i = 0; i < pSqlR.length; i++) {
				var rcust = Number(pSqlR[i].cid);
				var ritm = Number(pSqlR[i].iid);
				var bs = pSqlR[i].start;
				var be = pSqlR[i].end||pSqlR[i].start;
				var b_start = nlapiStringToDate(bs, 'DD/MM/YYYY');
				var b_end = nlapiStringToDate(be, 'DD/MM/YYYY');
				if (rcust === cust && itm === ritm) {
					console.log('Match found');
					if (a_start <= b_start && b_start <= a_end) {
						var deLine = {};
						deLine.pid = pSqlR[i].pid;
						deLine.cid = pSqlR[i].cid;
						deLine.customer = pSqlR[i].customer;
						deLine.item = pSqlR[i].item;
						deLine.iid = pSqlR[i].iid;
						deLine.start = pSqlR[i].start;
						deLine.end = pSqlR[i].end;
						deLine.estart = price.start;
						deLine.eend = price.end;
						deLine.level = pSqlR[i].level;
						deLine.currency = pSqlR[i].currency;
						deLine.price = pSqlR[i].price;
						displayError.push(deLine);
					}
					else if (a_start <= b_end   && b_end   <= a_end) {
						var deLine = {};
						deLine.pid = pSqlR[i].pid;
						deLine.cid = pSqlR[i].cid;
						deLine.customer = pSqlR[i].customer;
						deLine.item = pSqlR[i].item;
						deLine.iid = pSqlR[i].iid;
						deLine.start = pSqlR[i].start;
						deLine.end = pSqlR[i].end;
						deLine.estart = price.start;
						deLine.eend = price.end;
						deLine.level = pSqlR[i].level;
						deLine.currency = pSqlR[i].currency;
						deLine.price = pSqlR[i].price;
						displayError.push(deLine);
					}
					else if (b_start <  a_start && a_end   <  b_end) {
						var deLine = {};
						deLine.pid = pSqlR[i].pid;
						deLine.cid = pSqlR[i].cid;
						deLine.customer = pSqlR[i].customer;
						deLine.item = pSqlR[i].item;
						deLine.iid = pSqlR[i].iid;
						deLine.start = pSqlR[i].start;
						deLine.end = pSqlR[i].end;
						deLine.estart = price.start;
						deLine.eend = price.end;
						deLine.level = pSqlR[i].level;
						deLine.currency = pSqlR[i].currency;
						deLine.price = pSqlR[i].price;
						displayError.push(deLine);
					}
				}
			}
			return true;
		});
		var wheight = window.screen.availHeight-100;
		var wwidth = window.screen.availWidth-150;
		displayError.forEach(function (e) {
			var recUrl = "https://5137738.app.netsuite.com" + nlapiResolveURL('RECORD', 'customrecord_edp_price_update', e.pid, true);
			console.log(recUrl);
			errorTable += '<tr class="uir-machine-row uir-machine-row-odd">';
			errorTable += '<td class="listtexthlwht" align="left" data-ns-tooltip="Customer Name">'+e.customer+'</td>';
			errorTable += '<td class="listtexthlwht" align="left" data-ns-tooltip="Item Name">'+e.item+'</td>';
			errorTable += '<td class="listtexthlwht" align="left" data-ns-tooltip="Pricing Start Date">'+e.start+'</td>';
			errorTable += '<td class="listtexthlwht" align="left" data-ns-tooltip="Pricing End Date">'+e.end+'</td>';
			errorTable += '<td class="listtexthlwht" align="left" data-ns-tooltip="Edit Price Record">';
			errorTable += '<a href="'+recUrl+'" target="_blank">Edit Pricing</a></td></tr>';
			return true;
		});
		errorTable += '</table>';
		if (displayError.length == 0) {
			errorTable += '<br><b>No pricing conflict found.</b>';
		}
		nlapiSetFieldValue('custpage_conflict_table', errorTable);
		if (!displayError || displayError.length == 0) {
			jQuery.alert({
			title: 'Price conflict check complete.',
			content: 'No errors exist.<br/>You may submit pricing.',
			type: 'green',
			buttons: {
				ok: function() {
					jQuery('#tr_custpage_p_con').addClass('tabBntDis');
					jQuery('#tr_custpage_p_con').removeClass('tabBnt');
					jQuery('#custpage_p_con').prop('disabled', true);
					jQuery('#tr_custpage_p_sub').removeClass('tabBntDis');
					jQuery('#tr_custpage_p_sub').addClass('tabBnt');
					jQuery('#custpage_p_sub').prop('disabled', false);
				}
			}
			});
		}
		else {
			jQuery.alert({
				title: 'Price conflict check complete.',
				content: 'Please review conflict tab.<br/>Reprocess pricing conflict after resolving any errors.',
				type: 'orange',
				buttons: {
					ok: function() {
					}
				}
			});
		}
	}
}