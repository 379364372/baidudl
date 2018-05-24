// get configuration
var config = {};
chrome.storage.local.get('config', function(result){
	if('config' in result){
		config = result.config;
	}else{
		resetConfig();
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
		else if(url.hash.substr(0, 8) == '#/search')chrome.pageAction.show(tabId);
	}
	else if(url.pathname.match(/s\/|share\/link/)){
		chrome.pageAction.show(tabId);
	}
});

