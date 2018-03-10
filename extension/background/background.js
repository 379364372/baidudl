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
		page = new SharePage(url)
		page.execute();
	}
});