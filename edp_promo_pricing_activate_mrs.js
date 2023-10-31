/**
*@NApiVersion 2.1
*@NScriptType MapReduceScript
*/

define(['N/record', 'N/query', 'N/format', 'N/runtime', 'N/search'],
function(record, query, format, runtime, search) {
	
	function getInputData(context) {
		var rt = runtime.getCurrentScript();
		var entity = rt.getParameter({name: 'custscript_edp_p_entity'});
		var sql = `select distinct s.transaction, t.tranid, s.tranline, s.uniquekey, s.entity, s.item, BUILTIN.DF(s.item) itemname, s.amount/s.itemcount sorate, p.price crate from salesordered s
		join transaction t on t.id = s.transaction
		join customeritempricing p on  p.customer = s.entity and p.item = s.item 
		where s.entity = ${entity} and (t.status = 'SalesOrd:B' or t.status = 'SalesOrd:A') and s.amount is not null and s.itemcount is not null and s.amount != (p.price*s.itemcount)
		order by s.transaction, s.tranline`;
		var priceInfo = query.runSuiteQL({query: sql}).asMappedResults(); 
		log.debug('Processing', priceInfo.length + ' pricing updates.');
		return priceInfo;
	}
			
	function map(context) {
      	var scriptRec = runtime.getCurrentScript();
      	var p = JSON.parse(context.value);
		var soRec = record.load({
			type: 'salesorder',
			id: p.transaction,
			isDynamic: false
		});
		try {
			var itemLine = soRec.findSublistLineWithValue({
				sublistId: 'item',
				fieldId: 'lineuniquekey',
				value: Number(p.uniquekey)
			});
			var itemRate = parseFloat(p.crate).toFixed(2);
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
			log.error(p.tranid, itemLine, e.message);
		}
		if (failedUpdates === false) {
			var soRecId = soRec.save();
			log.debug(p.itemname, ' Updated on ' + p.tranid);
		}
		else {
			log.error(p.itemname, ' FAILED updated on ' + p.tranid);
		}
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
		summarize: summarize
	};
});
