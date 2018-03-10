function get_user_yunData(cb){
	$.ajax({
		url: 'https://pan.baidu.com/disk/home',
		success: function(res){
			var code = res.match(/var context={.*};/);
			code = code[0].substr(12, code[0].length-13);
			var yunData = JSON.parse(code);
			cb(yunData);
		}
	})
}

// get path parameter from url
function getURLParameter(url, name) {
	var x = url.hash.split('/');
	var y = x[x.length-1].split('&')
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
		i = t.charCodeAt(r++),
		e += s.charAt(n >> 2),
		e += s.charAt((3 & n) << 4 | (240 & o) >> 4),
		e += s.charAt((15 & o) << 2 | (192 & i) >> 6),
		e += s.charAt(63 & i)
	}
	return e;
};

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
	})
}

// share file by fs_id
function share(yunData, fidlist, cb){
	$.ajax({
		type: "POST",
		url: "https://pan.baidu.com/share/set?web=1&channel=chunlei&web=1&bdstoken="+yunData.bdstoken+"&clienttype=0",
		data: "fid_list="+JSON.stringify(fidlist)+"&schannel=0&channel_list=%5B%5D&period=0",
		dataType: "json",
		success: function(res){
			if(res.errno != 0){
				console.log(res);
				var err_msg = "Error: cant't share this file";
				if(res.errno == -3)err_msg = "Error: this is not your file, you can't share it";
				if(res.errno == 110)err_msg = "Error: this file has been shared too frequently";
				database.status = 'error';
				database.message = err_msg;
				return
			}
			console.log("Share success");
			cb(res);
		}
	})
}

// unshare a file by its shareid
function unshare(yunData, shareid, cb){
	$.ajax({
		type: "POST",
		url: "https://pan.baidu.com/share/cancel?bdstoken="+yunData.bdstoken+"&channel=chunlei&web=1&clienttype=0",
		data: "shareid_list=%5B"+shareid+"%5D",
		dataType: "json",
		success: function(d){
			if(d.errno != 0){
				console.log(d);
				var err_msg = "Warning: can't auto unshare the file";
				var event = new CustomEvent("error", {detail: err_msg});
				window.dispatchEvent(event);
				return;
			}
			console.log("Unshare success");
			cb();
		}
	})
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
		$scope.page = page.page;
		$scope.vcode = page.vcode;
		$scope.message = page.message;
	});
}