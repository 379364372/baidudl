var app = angular.module('app', []);
app.controller('control', function($scope, $http){

	// init
	$scope.fileList = [];
	$scope.fsidList = [];
	$scope.page = 1;
	$scope.vcode = false;
	$scope.message = 'Loading...';
	$scope.background = chrome.extension.getBackgroundPage();

	$scope.clear = function(){};
	$scope.generate = function(){};
	$scope.generateAll = function(){};
	$scope.copy = function(){};
	$scope.copyAll = function(){};
	$scope.download = function(){};

	$scope.refresh = function(){
		new $scope.background.Error(-20).handle();
	};
	$scope.verify = function(input){
		$scope.background.page.getGlink(true, $scope.vcode, input);
	};
	$scope.init = function(page){
		console.log('initializing popup');
		$scope.message = 'Loading...';
		$scope.fileList = page.fileList.fileList;
		$scope.fsidList = page.fileList.fsidList;
		$scope.page = page.page;
		$scope.vcode = page.vcode;
		$scope.message = 'Ready.';
	};
	$scope.init($scope.background.page);
});