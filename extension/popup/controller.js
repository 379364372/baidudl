var app = angular.module('app', []);
app.controller('control', function($scope, $http){
	// initialize angular model
	$scope.message = 'pan.baidu.com only';
	$scope.status = false;
	$scope.login = false;
	$scope.page = 1;
	$scope.vcodes = [];
	$scope.vcode_input = "";
	$scope.bduss;
	$scope.rpc_options = [];
	$scope.rpc_addr;

	// set rpc address
	var rpc_index = 0;	
	var rpc_history = JSON.parse(localStorage.getItem('rpc_history'));
	var rpc_list=JSON.parse(localStorage.getItem('rpc_list'));
	if (rpc_list && rpc_list.length > 0) {
		for(var i=0; i<rpc_list.length; i++) {
			$scope.rpc_options[i] = rpc_list[i];
			if (rpc_history && (rpc_history.name == rpc_list[i].name)) {
				rpc_index = i;
			}
		}
	} else {
		$scope.rpc_options[0] = {'name': 'Aria2', 'url': 'http://localhost:6800/jsonrpc'}
	}
	$scope.rpc_addr = $scope.rpc_options[rpc_index];		

	// get pan.baidu.com credential
	chrome.cookies.get({url: 'https://pan.baidu.com/', name: 'BDUSS'}, function(cookie){
		$scope.$apply(function(){
			if(cookie){
				$scope.login = true;
				$scope.bduss = cookie.value;
			}
			else{
				$scope.bduss = '';
				$scope.message = 'You need to login first';
			}
		})
	})

	// function to generate high speed links
	$scope.generate = function(i){
		console.log(i);
		$scope.message = "Running...";
		var x = $scope.links[i];
		var fs_id = x.fs_id;
		var isdir = x.isdir;
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, {fs_id: fs_id, index: i, isdir: isdir});
		});
	}
	// generate hlinks for all files
	$scope.generateAll = function(){
		for(var i=0; i<$scope.links.length; i++){
			if(!$scope.links[i].hlink)$scope.generate(i);
		}
	}
	
	// previous page
	$scope.prev = function(){
		if($scope.page == 1){
			$scope.message = "Already the first page";
			return
		}
		$scope.page -= 1;
		$scope.run();
	}
	// next page
	$scope.next = function(){
		if($scope.links.length < 100){
			$scope.message = "Already the last page";
			return
		}
		$scope.page += 1;
		$scope.run();
	}

	// run
	$scope.run = function(){
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			var url = tabs[0].url;
			chrome.tabs.sendMessage(tabs[0].id, {page: $scope.page}, function(res){
				$scope.$apply(function(){$scope.message = "Ready."});
			})
		})
	}

	// create a hidden input for copy
	var body = angular.element(document.body);
	var textarea = angular.element('<textarea/>');
	textarea.css({
		position: 'fixed',
		opacity: '0'
	});
	body.append(textarea);
	
	// copy links to clipboard
	$scope.copy = function(i, type){
		if(type=='hlink')textarea.val($scope.links[i].hlink)
		else textarea.val($scope.links[i].glink)
		if(!textarea.val()){
			$scope.message = "This field is empty"
			return
		}
		textarea[0].select()
		if(document.execCommand("copy"))$scope.message = "Copy success";
		else $scope.message = "Copy failure"
	}
	$scope.copyAll = function(type){
		var text = "";
		for(var i=0; i<$scope.links.length; i++){
			if(type == 'glink'){
				if(!$scope.links[i].glink)continue
				text += $scope.links[i].glink+'\n';
			}
			else{
				if(!$scope.links[i].hlink)continue
				text += $scope.links[i].hlink+'\n';
			}
		}
		textarea.val(text);
		if(!textarea.val()){
			$scope.message = "No links";
			return;
		}
		textarea[0].select()
		if(document.execCommand("copy"))$scope.message = "Copy all success";
		else $scope.message = "Copy failure"
	}

	// do vcode verification
	$scope.verify = function(index, vcode_input){
		var vcode_str = $scope.vcodes[index].vcode_str;
		var indices = $scope.vcodes[index].indices;

		var x = $scope.links[indices[0]];
		var fs_id_list = indices.map(function(index){
			return $scope.links[index].fs_id;
		})
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, {vcode: {vcode_str: vcode_str, vcode_input: vcode_input}, indices: indices, fs_id_list: fs_id_list, isdir: x.isdir});
			$scope.$apply(function(){
				var vcodes = $scope.vcodes.filter(function(e){
					return e.vcode_str != vcode_str;
				})
				$scope.vcodes = vcodes;
			});
		});
	}

	$scope.clear = function(){
		chrome.storage.local.remove('data');
		$scope.message = "Cache is cleared";
		window.close();
	}

	$scope.download = function(index){

		localStorage.setItem('rpc_history', angular.toJson($scope.rpc_addr));		

		// whether hlink is generated
		if(!$scope.links[index].hlink){
			$scope.message = 'hlink is not generated';
			return;
		}

		// refer: https://github.com/binux/yaaw
		function request_auth(url) {
			return url.match(/^(?:(?![^:@]+:[^:@\/]*@)[^:\/?#.]+:)?(?:\/\/)?(?:([^:@]*(?::[^:@]*)?)?@)?/)[1];
		}
		function remove_auth(url) {
			return url.replace(/^((?![^:@]+:[^:@\/]*@)[^:\/?#.]+:)?(\/\/)?(?:(?:[^:@]*(?::[^:@]*)?)?@)?(.*)/, '$1$2$3');
		}

		rpc_interface = $scope.rpc_addr.url || location.protocol+"//"+(location.host.split(":")[0]||"localhost")+":6800"+"/jsonrpc";
		active_payload = {'jsonrpc': '2.0', 'method': 'aria2.tellActive', 'id': 'connect'}
		var auth_str = request_auth(rpc_interface);
		if (auth_str && auth_str.indexOf('token:') == 0) {
			active_payload['params']=[auth_str];		  
		  	rpc_interface = remove_auth(rpc_interface);
		}
		
		// try to connect to aria2 rpc
		$http.post(rpc_interface, active_payload)
		.then(function(res){
			get_all_hlinks(index, function(urls){
				var max_threads = 164;
				var threads = (max_threads > 16*urls.length)? 16*urls.length : max_threads;
				var url = new URL(urls[0]);

				// prepare json request
				options = {};
				options['split'] = threads+'';
				options['max-connection-per-server'] = '16';
				options['user-agent'] = navigator.userAgent;
				options['check-certificate'] = 'false';
				options['min-split-size'] = '1m';
				options['summary-interal'] = '0';
				options['out'] = url.searchParams.get('fin');
				params = [];
				if (auth_str && auth_str.length > 0) {
					params.push(auth_str);
				}
				params.push(urls);
				params.push(options);
				jsonreq = {};
				jsonreq['jsonrpc'] = '2.0';
				jsonreq['id'] = url.searchParams.get('fin');
				jsonreq['method'] = 'aria2.addUri';
				jsonreq['params'] = params;

				// send request to aria rpc
				$http.post(rpc_interface, jsonreq)

				// notification
				$scope.message = 'Added to ' + rpc_interface + '. The speed is ' + url.searchParams.get('csl');
			});
		}, function(res){
			if(res.status < 0){
				$scope.message = 'Warning: aria2c is not running on ' + rpc_interface;
				return;
			}else{
				$scope.message = 'Error: can\' connect to ' + rpc_interface;
			}
		})

	}
})
