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

// list search result
function list_search(yunData, url, cb){
	// get keyword
	var key = getURLParameter(url, 'key');

	// get sign parameter
	var u;
	eval("u = " + yunData.sign2);
	if(!yunData.sign5)sign = b64(u(yunData.sign3, yunData.sign1));
	else sign = b64(u(yunData.sign5, yunData.sign1));
	sign = encodeURIComponent(sign);


	// list search result
	$.ajax({
		type: 'GET',
		url: 'https://pan.baidu.com/api/search?recursion=1&order=time&desc=1&showempty=0&page=1&num=100&key='+key,
		dataType: 'json',
		success: function(res){
			// in case of failure
			if(res.errno != 0){
				console.log(res);
				database.status = 'error';
				database.message = 'Warning: can\'t get search result';
				return;
			}
			cb(res.list);
		}
	});
}

function refresh(url){
	console.log('refreshing '+url.href);
	if(url.host != 'pan.baidu.com')return;

	if(url.pathname == '/disk/home'){
		if((url.hash.substr(0, 5) == '#list'||url.hash.substr(0, 5) == '#/all') && url.hash.indexOf('vmode') > 0){
			page = new HomePage(url);
			page.execute();
		}
		else if(url.hash.substr(0, 7) == '#search' && url.hash.indexOf('vmode') > 0){
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
			page.fileList.merge(page.sharePage.fileList);
			page.sharePage = undefined;
			updatePopup();
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
