// get path parameter from url
function getURLParameter(url, name) {
	var x = url.hash.split(/[\?\/]/);
	var y = x[x.length-1].split('&');
	for(var i=0; i<y.length; i++){
		var e = y[i];
		e = e.split('=');
		if(e[0]==name)return e[1];
	}
	return null;
}

// variant base64 encoding function, copy from pan.baidu.com
// I don't understand it. But we don't have to.
function b64(t) {
	var e, r, a, n, o, i, s = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	for (a = t.length, r = 0, e = ""; a > r; ) {
		if (n = 255 & t.charCodeAt(r++), r == a) {
			e += s.charAt(n >> 2);
			e += s.charAt((3 & n) << 4);
			e += "==";
			break;
		}
		if (o = t.charCodeAt(r++), r == a) {
			e += s.charAt(n >> 2);
			e += s.charAt((3 & n) << 4 | (240 & o) >> 4);
			e += s.charAt((15 & o) << 2);
			e += "=";
			break;
		}
		i = t.charCodeAt(r++);
		e += s.charAt(n >> 2);
		e += s.charAt((3 & n) << 4 | (240 & o) >> 4);
		e += s.charAt((15 & o) << 2 | (192 & i) >> 6);
		e += s.charAt(63 & i);
	}
	return e;
}

function resetConfig(){
	config ={};
	config.maxThreads	=	"100";
	config.rpcList		=	[];
	var tmp = {
		protocol:	'http',
		name	:	'Default',
		token	:	null,
		host	:	'127.0.0.1',
		port	:	"6800"
	};
	config.rpcList.push(tmp);
	config.rpcIdx = 0;
	config.mode = 'rpc';
	config.servers = [
		'qdall01.baidupcs.com',
		'd11.baidupcs.com',

		'd1.baidupcs.com',
		'd2.baidupcs.com',
		'd4.baidupcs.com',
		'd6.baidupcs.com',
		'd7.baidupcs.com',
		'd8.baidupcs.com',
		'd9.baidupcs.com',
		'd10.baidupcs.com',
		'd12.baidupcs.com',
		'd13.baidupcs.com',
		'd14.baidupcs.com',
		'd16.baidupcs.com',
		'nb.cache.baidupcs.com',
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
	chrome.storage.local.set({'config': config});
}

function refresh(url){
	console.log('refreshing '+url.href);
	if(url.host != 'pan.baidu.com')return;

	if(url.pathname == '/disk/home'){
		if((url.hash.substr(0, 5) == '#list'||url.hash.substr(0, 5) == '#/all') && url.hash.indexOf('vmode') > 0){
			page = new HomePage(url);
			page.execute();
		}
		else if(url.hash.substr(0, 8) == '#/search' && url.hash.indexOf('vmode') > 0){
			page = new SearchPage(url);
			page.execute();
		}
	}
	else if(url.pathname.match(/s\/|share\/link/)){
		page = new SharePage(url);
		page.execute(function(){});
	}
}

function generate(fileList){
	var fsidList = fileList.map(function(file){
		return file.fid;
	});
	page.share(fsidList, function(){
		page.sharePage = new SharePage(page.shorturl);
		page.sharePage.execute(function(){
			page.unshare();
		});
	});
}

function updatePopup(){
	var views = chrome.extension.getViews({
		type: "popup"
	});
	if(!views.length){
		console.log('No popup detected');
		return;
	}
	console.log('updating popup');
	var $scope = views[0].angular.element(views[0].document.getElementById('app')).scope();
	$scope.$apply(function(){
		$scope.message = 'Loading...';
		$scope.fileList = page.fileList.fileList;
		$scope.fsidList = page.fileList.fsidList;
		$scope.page = page;
		$scope.vcode = page.vcode;
		$scope.message = page.message;
	});
}
