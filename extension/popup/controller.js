var app = angular.module('app', []);
app.controller('control', function($scope, $http){

	// init
	$scope.init = function(background){
		var page = background.page;
		console.log('initializing popup');
		$scope.message = 'Loading...';
		$scope.fileList = page.fileList.fileList;
		$scope.fsidList = page.fileList.fsidList;
		$scope.page = page.pageno;
		$scope.vcode = page.vcode;
		$scope.background = background;
		$scope.message = 'Ready.';
		$scope.textarea = angular.element(document.getElementById('copy'));
	};
	$scope.clear = function(){};
	$scope.generate = function(){};
	$scope.generateAll = function(){};
	$scope.copy = function(idx, type){
		if(type == 'hlink')$scope.textarea.val($scope.fileList[idx].hlink);
		else $scope.textarea.val($scope.fileList[idx].glink);
		if(!$scope.textarea.val()){
			$scope.message = "This field is empty";
			return;
		}
		$scope.textarea[0].select();
		if(document.execCommand("copy"))$scope.message = "Copy success";
		else $scope.message = "Copy failure";
		$scope.textarea.val('');
	};
	$scope.copyAll = function(type){
		var links = [];
		for(var i=0; i<$scope.fileList.length; i++){
			if(type == 'glink'){
				if(!$scope.fileList[i].glink)continue;
				links.push($scope.fileList[i].glink);
			}
			else{
				if(!$scope.fileList[i].hlink)continue;
				links.push($scope.fileList[i].hlink);
			}
		}
		$scope.textarea.val(links.join('\n'));
		if(!$scope.textarea.val()){
			$scope.message = "No links";
			return;
		}
		$scope.textarea[0].select();
		if(document.execCommand("copy"))$scope.message = "Copy all success";
		else $scope.message = "Copy failure";
		$scope.textarea.val('');
	};
	$scope.rpcdownload = function(){};

	$scope.refresh = function(){
		new $scope.background.Error(-20).handle();
	};
	$scope.verify = function(input){
		$scope.background.page.getGlink(true, $scope.vcode, input);
	};
	$scope.init(chrome.extension.getBackgroundPage());
});