/**
*@NApiVersion 2.1
*@NScriptType MapReduceScript
*/

define(['N/search', 'N/record'], function(search, record) {
	
	function getInputData(context) {
		
		return search.create({
		   type: "customrecord_edp_base_price",
		   filters:
		   [
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
	}
			
	function map(context) {
      	var data = JSON.parse(context.value);
		var dataline = {};
		dataline.id = Number(data.values["MAX(internalid)"].value);
		dataline.item = Number(data.values["GROUP(custrecord_edp_item)"].value);
		dataline.currency = Number(data.values["GROUP(custrecord_edp_currency)"].value);
		dataline.price = '';
		dlinejson = JSON.stringify(dataline);
		context.write({key: Number(data.values["GROUP(custrecord_edp_customer)"].value), value: dlinejson});
	}
	
	function reduce(context) {
		var customerId = Number(context.key);
		var data = context.values.map(JSON.parse);
		try {
			var customrecord_edp_base_priceSearchObj = search.create({
			   type: "customrecord_edp_base_price",
			   filters:
			   [
				  ["custrecord_edp_customer.internalidnumber","equalto",customerId]
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
			data.forEach(function(r) {
				for (let i = 0; i < prices.length; i++) {
					if (Number(r.id) == Number(prices[i].id)) {
						r.price = Number(prices[i].price);
						break;
					}
				}
				return true;
			});
			var cRec = record.load({
				type: 'customer',
				id: customerId
			});
			var numLines = cRec.getLineCount({
			  sublistId: 'itempricing'
			});
			var updatedLines = false;
			data.forEach(function(line) {
				var existingLine = cRec.findSublistLineWithValue({
					sublistId: 'itempricing',
					fieldId: 'item',
					value: Number(line.item)
				});
				if (existingLine < 0) {
					cRec.insertLine({
						sublistId: 'itempricing',
						line: 0
					});
					cRec.setSublistValue({
						sublistId: 'itempricing',
						fieldId: 'item',
						value: Number(line.item),
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
						value: Number(line.currency),
						line: 0
					});
					cRec.setSublistValue({
						sublistId: 'itempricing',
						fieldId: 'price',
						value: Number(line.price),
						line: 0
					});
					updatedLines = true;
				}
				else {
					var currentPrice = cRec.getSublistValue({
						sublistId: 'itempricing',
						fieldId: 'price',
						line: existingLine
					});
					if (Number(currentPrice) != Number(line.price)) {
						cRec.setSublistValue({
							sublistId: 'itempricing',
							fieldId: 'price',
							line: existingLine,
							value: Number(line.price)
						});
						log.debug(recordId, 'Updating ' + line.item + ' found on line ' + existingLine);
					}
					else {
						log.debug(recordId, 'Skipping ' + line.item + ' found on line ' + existingLine);
					}
				}
				return true;
			});
			var cRecId = cRec.save();
			log.debug(cRecId, 'Updated');
		}
		catch(z) {log.debug(customerId, 'Error: ' + z.message); }
	}
	
	function summarize(context) {
		log.debug('Summarize', context);
	}
	
	return {
		config:{
        retryCount: 3,
        exitOnError: true
		},
		getInputData: getInputData,
		map: map,
		reduce: reduce,
		summarize: summarize
	};
});
