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
		config.servers = [
    		'd11.baidupcs.com',
    		'd1.baidupcs.com',
    		'd7.baidupcs.com',
    		'nbcache00.baidupcs.com',
    		'nbcache03.baidupcs.com',
    		'nj02all01.baidupcs.com',
    		'yqall02.baidupcs.com',
    		'bjbgp01.baidupcs.com',
    		'allall01.baidupcs.com',
    		'allall02.baidupcs.com'
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
		chrome.pageAction.show(tabId);
		if(url.hash.substr(0, 5) == '#list' && url.hash.indexOf('vmode') > 0){
			page = new HomePage(url);
			page.execute();
		}
		else if(url.hash.substr(0, 7) == '#search' && url.hash.indexOf('vmode') > 0){
			page = new SearchPage(url);
			page.execute();
		}
		else chrome.pageAction.hide(tabId);
	}
	else if(url.pathname.match(/s\/|share\/link/)){
		chrome.pageAction.show(tabId);
		page = new SharePage(url);
		page.execute();
	}
});