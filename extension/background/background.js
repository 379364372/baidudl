// get configuration
var config = {};
chrome.storage.local.get('config', function(result){
	if('config' in result){
		config = result.config;
	}else{
		config.maxThreads	=	164;
		config.rpcList		=	[];
		var tmp = {
			protocol:	'http',
			name	:	'Default',
			token	:	null,
			host	:	'127.0.0.1',
			port	:	6800
		};
		// TODO: do operation to rank servers
		config.servers = [
			'd1.baidupcs.com',
			'd2.baidupcs.com',
			'd4.baidupcs.com',
			'd6.baidupcs.com',
			'd7.baidupcs.com',
			'd8.baidupcs.com',
			'd9.baidupcs.com',
			'd10.baidupcs.com',
			'd11.baidupcs.com',
			'd12.baidupcs.com',
			'd13.baidupcs.com',
			'd14.baidupcs.com',
			'd16.baidupcs.com',
			'nbcache00.baidupcs.com',
			'nbcache02.baidupcs.com',
			'nbcache03.baidupcs.com',
			'nj02all01.baidupcs.com',
			'nj01ct01.baidupcs.com',
			'nj01ct02.baidupcs.com',
			'nj01ct03.baidupcs.com',
			'nj01ct04.baidupcs.com',
			'nj01ct06.baidupcs.com',
			'nj01ct07.baidupcs.com',
			'yqall01.baidupcs.com',
			'yqall02.baidupcs.com',
			'yqall03.baidupcs.com',
			'yqall04.baidupcs.com',
			'yqall06.baidupcs.com',
			'yqall07.baidupcs.com',
			'bjbgp01.baidupcs.com',
			'allall01.baidupcs.com',
			'allall02.baidupcs.com',
			'allall04.baidupcs.com',
			'allall05.baidupcs.com',
			'qdcache00.baidupcs.com',
			'qdcache02.baidupcs.com',
			'qdcache03.baidupcs.com',
							];
		config.rpcList.push(tmp);
		config.rpc = config.rpcList[0];
	}
});

var page;
//distinguish different url and carry out different operations
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){

	var url = new URL(tab.url);
	if(url.host != 'pan.baidu.com')return;
	if(changeInfo.status != 'loading')return;

	if(url.pathname == '/disk/home'){
		chrome.pageAction.hide(tabId);
		if(url.hash.substr(0, 5) == '#list' | url.hash.substr(0, 5) == '#/all')chrome.pageAction.show(tabId);
		else if(url.hash.substr(0, 7) == '#search')chrome.pageAction.show(tabId);
	}
	else if(url.pathname.match(/s\/|share\/link/)){
		chrome.pageAction.show(tabId);
	}
});

