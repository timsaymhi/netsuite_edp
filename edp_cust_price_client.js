/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/record', 'N/search', 'N/currentRecord', 'N/ui/dialog', 'N/https', 'N/url', 'N/query', 'N/format'], 
function (record, search, cr, dialog, https, url, query, format) {
	jQuery.getScript("https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/js/bootstrap.min.js", function() {jQuery('<style>').load("https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/css/bootstrap.min.css").appendTo("head");})
  
function pageInit(context) {
	console.log(context);
}

function repriceorders(context) {
	var rec = cr.get();
	var recId = rec.id;
	var sql = `select  s.transaction, t.tranid, s.linesequencenumber, s.uniquekey, t.entity, s.item, BUILTIN.DF(s.item) itemname, s.foreignamount, s.quantity, s.foreignamount/s.quantity sorate, p.price custrate from transaction t
		join transactionline s on s.transaction = t.id
		join customeritempricing p on p.customer = t.entity and p.item = s.item 
		where t.entity = ${recId}  and t.type = 'SalesOrd' and s.mainline = 'F' and s.foreignamount != 0 and s.quantity < 0
		and (t.status = 'SalesOrd:B' or t.status = 'SalesOrd:A') and s.foreignamount != (p.price*s.quantity)
		order by t.id, s.linesequencenumber`;
	var priceInfo = query.runSuiteQL({query: sql}).asMappedResults(); 
	if (priceInfo && priceInfo.length > 0) {
		var htmlTable = `The following sales orders will be updated to reflect the currently active pricing for the customer.<BR><BR>`;
		htmlTable += `<table class="table table-bordered"><thead><tr><th scope="col">Sales Order</th><th scope="col">Item</th><th scope="col">SO Price</th><th scope="col">Active Price</th></tr></thead><tbody>`;
		priceInfo.forEach(function (p) {
			htmlTable += `<tr><th scope="row">`;
			htmlTable += p.tranid;
			htmlTable += `</th><td>`;
			htmlTable += p.itemname;
			htmlTable += `</td><td>`;
			htmlTable += p.sorate;
			htmlTable += `</td><td>`;
			htmlTable += p.custrate;
			htmlTable += `</td></tr>`;
			return true;
		});
		htmlTable += `</tbody></table>`;
		var options = {
			title: 'Customer Sales Order Update',
			message: htmlTable,
			buttons: [
				{label: 'Cancel', value: 0},
				{label: 'Update', value: 1}
			]
		}
		function success(result) {
			var rec = cr.get();
			if (result == 0) {
				return true;
			}
			else if (result == 1) {
				updatesalesorder(priceInfo);
			}
			else {return true;}
		}
		
		function failure(reason) {
			console.log('Failure',reason);
		}
		dialog.create(options).then(success).catch(failure);
	}
	else {alert('No open sales orders have pricing differences.');}
}

function updatesalesorder(priceInfo) {
	var failedUpdates = true;
	priceInfo.forEach(function(p) {
		var soRec = record.load({
			type: 'salesorder',
			id: p.transaction,
			isDynamic: false
		});
		console.log(p.tranid, ' Loaded');
		try {
			var itemLine = soRec.findSublistLineWithValue({
				sublistId: 'item',
				fieldId: 'lineuniquekey',
				value: Number(p.uniquekey)
			});
			var itemRate = parseFloat(p.custrate).toFixed(2);
			console.log(p.tranid, 'New Rate ' + itemRate + ' on ' + itemLine);
			var itemQty = soRec.getSublistValue({
				sublistId: 'item',
				fieldId: 'quantity',
				line: itemLine
			});
			soRec.setSublistValue({
				sublistId: 'item',
				fieldId: 'rate',
				value: format.parse({value: itemRate, type: format.Type.CURRENCY2}),
				line: itemLine
			});
			soRec.setSublistValue({
				sublistId: 'item',
				fieldId: 'amount',
				value: format.parse({value: (itemRate*itemQty), type: format.Type.CURRENCY2}),
				line: itemLine
			});	
			failedUpdates = false;
		}
		catch(e) {
			console.log(p.tranid, itemLine, e.message);
		}
		if (failedUpdates === false) {
			var soRecId = soRec.save();
			console.log(p.itemname, ' Updated on ' + p.tranid);
		}
		else {
			console.log(p.itemname, ' FAILED updated on ' + p.tranid);
		}
		return true;
	});
	if (failedUpdates == false) {
		dialog.alert({
			title: 'Complete',
			message: 'Price update complete.'
		}).then(goOn).catch(goOn);
	}
	else {
		dialog.alert({
			title: 'ERROR',
			message: 'Price update failed on some records.'
		}).then(goOn).catch(goOn);
	}
}

function activateprice(context) {
	var options = {
		title: 'Customer Price Update',
		message: 'Clicking load will update promo and base pricing for this customer.<BR>Any pricing without dates will not be loaded.',
		buttons: [
			{label: 'Cancel', value: 0},
			{label: 'Load', value: 1}
		]
	}
	function success(result) {
		var rec = cr.get();
		if (result == 0) {
			return true;
		}
		else if (result == 1) {
			loadcustomer(rec.id);
		}
		else {return true;}
	}
	
	function failure(reason) {
		console.log('Failure',reason);
	}
	dialog.create(options).then(success).catch(failure);
}

function loadcustomer(rec) {
		var baseDate = search.create({
		   type: "customrecord_edp_base_price",
		   filters:
		   [
			  ["custrecord_edp_customer.internalidnumber","equalto",rec], 
			  "AND", 
			  ["custrecord_edp_base_start","onorbefore","today"]
		   ],
		   columns:
		   [
			  search.createColumn({
				 name: "internalid",
				 summary: "MAX",
				 label: "Internal ID"
			  }),
			  search.createColumn({
				 name: "custrecord_edp_customer",
				 summary: "GROUP",
				 label: "Customer"
			  }),
			  search.createColumn({
				 name: "custrecord_edp_item",
				 summary: "GROUP",
				 label: "Item"
			  }),
			  search.createColumn({
				 name: "custrecord_edp_base_start",
				 summary: "MAX",
				 label: "Start Date"
			  }),
			  search.createColumn({
				 name: "custrecord_edp_currency",
				 summary: "GROUP",
				 label: "Currency"
			  })
		   ]
		});
		var baseDateCount = baseDate.runPaged().count;
		if (baseDateCount > 0) {
			setBase(rec,baseDate);
		}
}

function setBase(rec,s) {
	try {
		var cRec = record.load({
			type: 'customer',
			id: rec
		});
		var numLines = cRec.getLineCount({
		  sublistId: 'itempricing'
		});
		var results = [];
		s.run().each(function(r) {
			let rLine = {}
			let c = r.toJSON();
			rLine.id = Number(c.values['MAX(internalid)']);
			rLine.item = Number(c.values['GROUP(custrecord_edp_item)'][0].value);
			rLine.currency = Number(c.values['GROUP(custrecord_edp_currency)'][0].value);
			rLine.price = '';
			results.push(rLine);
			return true;
		});
		var customrecord_edp_base_priceSearchObj = search.create({
		   type: "customrecord_edp_base_price",
		   filters:
		   [
			  ["custrecord_edp_customer.internalidnumber","equalto",rec]
		   ],
		   columns:
		   [
			  search.createColumn({name: "internalid", label: "Internal ID"}),
			  search.createColumn({name: "custrecord_edp_customer", label: "Customer"}),
			  search.createColumn({name: "custrecord_edp_item", label: "Item"}),
			  search.createColumn({name: "custrecord_edp_price", label: "Base Price"})
		   ]
		});
		var prices = [];
		customrecord_edp_base_priceSearchObj.run().each(function(r) {
			let rLine = {}
			let c = r.toJSON();
			rLine.id = Number(c.values['internalid'][0].value);
			rLine.price = Number(c.values['custrecord_edp_price']);
			prices.push(rLine);
			return true;
		});
		results.forEach(function(r) {
			for (let i = 0; i < prices.length; i++) {
				if (Number(r.id) == Number(prices[i].id)) {
					r.price = Number(prices[i].price);
					break;
				}
			}
			return true;
		});
		results.forEach(function(r) {
			var existingLine = cRec.findSublistLineWithValue({
				sublistId: 'itempricing',
				fieldId: 'item',
				value: Number(r.item)
			});
			if (existingLine < 0) {
				cRec.insertLine({
					sublistId: 'itempricing',
					line: 0
				});
				cRec.setSublistValue({
					sublistId: 'itempricing',
					fieldId: 'item',
					value: Number(r.item),
					line: 0
				});
				cRec.setSublistValue({
					sublistId: 'itempricing',
					fieldId: 'level',
					value: -1,
					line: 0
				});
				cRec.setSublistValue({
					sublistId: 'itempricing',
					fieldId: 'currency',
					value: Number(r.currency),
					line: 0
				});
				cRec.setSublistValue({
					sublistId: 'itempricing',
					fieldId: 'price',
					value: Number(r.price),
					line: 0
				});
			}
			else {
				var currentPrice = cRec.getSublistValue({
					sublistId: 'itempricing',
					fieldId: 'price',
					line: existingLine
				});
				if (Number(currentPrice).toFixed(2) != Number(r.price).toFixed(2)) {
					cRec.setSublistValue({
						sublistId: 'itempricing',
						fieldId: 'price',
						line: existingLine,
						value: Number(r.price).toFixed(2)
					});
					console.log(rec, 'Updating ' + r.price + ' found on line ' + existingLine);
				}
				else {
					console.log(rec, 'Skipping ' + r.price + ' found on line ' + existingLine);
				}
			}
			return true;
		});
		var cRecId = cRec.save();
		var restURL = url.resolveScript({
			scriptId: 'customscript_edp_edp_rest',
			deploymentId: 'customdeploy_edp_edp_rest',
			params: {
				task: 'customscript_edp_mr_customerpriceupdate'
			}
		});
		https.get.promise({
			url: restURL
		}).then(function(response) {
			console.log(response);
		}).catch(function onRejected(reason) {
			console.log(reason);
		});
		dialog.alert({
			title: 'Complete',
			message: 'Price update complete.'
		}).then(goOn).catch(goOn);
	}
	catch(z) {console.log(rec, 'Error: ' + z.message); return true;}
}

function goOn(result) {
	location.reload();
}

  return {
    pageInit: pageInit,
    activateprice: activateprice,
	repriceorders: repriceorders
  };
});
