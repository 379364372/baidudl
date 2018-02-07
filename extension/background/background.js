// get configuration
var config = {};
chrome.storage.local.get('config', function(result){
	if('config' in result){
		config = result.config;
	}else{
		config.max_threads	=	164;
		config.rpc			=	[];
		var tmp = {
			name	:	'Default',
			token	:	null,
			url		:	'127.0.0.1',
			port	:	6800
		};
		config.rpc.push(tmp);
	}
});

//distinguish different url and apply different operations
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){

	var url = new URL(tab.url);
	if(url.host != 'pan.baidu.com')return;
	if(changeInfo.status != 'loading')return;

	if(url.pathname == '/disk/home'){
		chrome.pageAction.show(tabId);
		if(url.hash.substr(0, 5) == '#list' && url.hash.indexOf('vmode') > 0){
			new HomePage(url).execute();
		}
		else if(url.hash.substr(0, 7) == '#search' && url.hash.indexOf('vmode') > 0){
			new SearchPage(url).execute();
		}
		else chrome.pageAction.hide(tabId);
	}
	else if(url.pathname.match(/s\/|share\/link/)){
		chrome.pageAction.show(tabId);
		new SharePage(url).execute();
	}
});