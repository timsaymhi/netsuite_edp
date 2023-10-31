/**
* @NApiVersion 2.1
* @NScriptType Restlet
* @NModuleScope Public
*/

define( [ 'N/query', 'N/dataset', 'N/file', 'N/task' ], main );

function main( query, dataset, file, task ) {
    return {
		post: function( request ) {
			log.debug('request',request);
			return JSON.stringify(request);
		},
        get: function( request ) {
			try {
				var queryId = request['query']||'';
				var taskId = request['task']||'';
				if (queryId) {
					log.debug('Sql Query File',queryId);
					var sqlQuery = file.load({id: queryId}).getContents();
					log.debug(queryId, sqlQuery);
					var results = [];
					var paginatedResults = query.runSuiteQLPaged({query: sqlQuery, pageSize: 5000});
					log.debug(queryId,paginatedResults.pageRanges.length);
					for( var i=0; i < paginatedResults.pageRanges.length; i++ ) {
						var currentPage = paginatedResults.fetch(i);
						var pageResults = currentPage.data.asMappedResults();
						pageResults.forEach(function(result) {
							results = results.concat(result);
							return true;
						});
					}
					log.debug(queryId, results.length);
					return results;
				}				
				else if (taskId) {
					var mrTask = task.create({
						taskType: task.TaskType.MAP_REDUCE,
						scriptId: taskId
					});
					var mrTaskId = mrTask.submit();
					var returnResults = {};
					returnResults.data = mrTaskId;
					
					log.debug('Task', mrTaskId);
					return JSON.stringify(returnResults);
				}
				else {
					var error = {};
					error.error = "No data table, task, or SQL query specified";
					return JSON.stringify(error);
				}
			} catch (e) {
				return e;
			}        
        }
    }
}