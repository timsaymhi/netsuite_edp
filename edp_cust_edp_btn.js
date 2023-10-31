/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */

define(['N/record', 'N/ui/serverWidget', 'N/runtime', 'N/url'], 
function(record, serverWidget, runtime, url) {
		
		function beforeLoad(context) {
			if (context.type != context.UserEventType.VIEW) return;
			const { newRecord, form } = context;
			const { id, type } = newRecord;
			try {
			form.clientScriptModulePath = 'SuiteScripts/edp_cust_price_client.js';
			form.addButton({
				id: 'custpage_run_promo',
				label: 'Reprice Orders',
				functionName: 'repriceorders()'
			});
			form.addButton({
				id: 'custpage_run_base',
				label: 'Price Activate',
				functionName: 'activateprice()'
			});
			}
            catch(e) {log.error('Script Error', e.message);}
		}
		
		return {
			beforeLoad: beforeLoad
			};
});