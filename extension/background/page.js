/*
Models
*/

function SharePage(url)
{
	var self = this;
	// init
	self.init = function(url){
		console.log('initializing share page...');
		self.url = url;
		self.pageno = 1;
		self.vcode = false;
		self.extra = '';
		self.yunData = [];
		self.fileList = [];
		chrome.cookies.get({url: 'https://pan.baidu.com/', name: 'BDUSS'}, function(cookie){
			self.bduss = cookie? cookie.value:'';
		});
	};

	// get verification parameter extra
	self.getExtra = function(cb){
		console.log('getting parameter extra...');
		chrome.cookies.get({url: 'https://pan.baidu.com/', name: 'BDCLND'}, function(cookie){
			if(cookie){
				var tmp = decodeURIComponent(cookie.value);
				self.extra = encodeURIComponent(JSON.stringify({sekey:tmp}));
			}
			cb();
		});
	};

	// get yunData in share page
	self.getShareYunData = function(cb){
		console.log('getting yunData in share page...');
		$.ajax({
			url: self.url.href,
			success: function(html){
				var code = html.match(/yunData\.setData\(.*\)/);
				var data = code[0].substring(16, code[0].length-1);
				var yunData = JSON.parse(data);
				self.yunData = yunData;
				cb();
			},
			error: function(res0, res1, res2){
				console.log(res0);
				console.log(res1);
				console.log(res2);
			}
		});
	};

	// list dir
	self.listDir = function(cb){
		console.log('listing dir...');
		$.ajax({
			url: 'https://pan.baidu.com/share/list?uk='+self.yunData.uk+"&shareid="+self.yunData.shareid+'&dir='+getURLParameter(self.url, 'path')+"&bdstoken="+self.yunData.bdstoken+"&num=100&order=time&desc=1&clienttype=0&showempty=0&web=1&page="+self.pageno,
			success: function(res){
				// if error is encountered
				if(res.errno != 0 ){
					new Error(res.errno).handle();
					return;
				}
				console.log("List dir succeeds");
				// good, we make it
				if(res.list.length == 0){
					return;
				}
				self.fileList = new FileList(res.list);
				updatePopup();
				cb();
			}
		});
	};

	// get glink
	self.getGLinks = function(cb, verify=false, vcode=undefined, input=undefined){
		console.log('getting glink list...');
		var url = "http://pan.baidu.com/api/sharedownload?sign="+self.yunData.sign+"&timestamp="+self.yunData.timestamp;
		var data = "encrypt=0&product=share&uk="+self.yunData.uk+"&primaryid="+self.yunData.shareid;
		data += '&fid_list='+JSON.stringify(self.fileList.fsidList);
		data += "&extra="+self.extra;
		if(verify){
			if(!vcode || !input){
				console.log('GLink verification error.');
				return;
			}
			data += "&vcode_str="+vcode+"&vcode_input="+input;
		}
		$.ajax({
			type: "POST",
			url: url,
			data: data,
			dataType: "json",
			success: function(res){
				if(res.errno != 0){
					new Error(res.errno).handle();
					return;
				}
				self.fileList.updateGLinks(res.list);
				if(verify)self.vcode = false;
				updatePopup();

				// TODO: maybe we can get hlink list for once to reduce overhead. need further testing.
				// Or maybe there should be an option to toggle the modes.
				self.fileList.fileList.forEach(function(e){
					if(e.glink)new Extractor(e).getHLinks(cb);
				});
			}
		});
	};
	// main logic in share page
	self.execute = function(cb){
		console.log('share page main logic starts');
		self.getExtra(function(){
			self.getShareYunData(function(){
				var fileList = self.yunData.file_list.list;

				// handle duplicate redirections
				if((fileList.length > 1 || fileList[0].isdir) && self.url.hash.substr(0, 5) != '#list')return;

				// handle different share page
				if(self.url.hash.indexOf('list') < 0 || getURLParameter(self.url, 'path') == '%2F'){
					self.fileList = new FileList(fileList);
					updatePopup();
					self.getGLinks(cb);
				}
				else{
					self.listDir(self.getGLinks);
				}
			});
		});
	};

	self.init(url);
}

function HomePage(url)
{
	var self = this;

	// init
	self.init = function(url){
		console.log('initializing home page');
		self.shorturl = '';
		self.shareid = '';
		self.url = url;
		self.pageno = 1;
		self.yunData = [];
		self.fileList = [];
		self.sharePage = undefined;
	};

	// get yunData in home page
	self.getUserYunData = function(cb){
		console.log('getting yunData in home page...');
		$.ajax({
			url: self.url.href,
			success: function(html){
				var code = html.match(/var context={.*};/);
				code = code[0].substr(12, code[0].length-13);
				var yunData = JSON.parse(code);
				self.yunData = yunData;
				cb();
			},
			error: function(res0, res1, res2){
				console.log(res0);
				console.log(res1);
				console.log(res2);
			}
		});
	};

	// list dir
	self.listDir = function(cb){
		console.log('listing dir...');
		$.ajax({
			url: 'https://pan.baidu.com/api/list?dir='+getURLParameter(self.url, 'path')+'&bdstoken='+self.yunData.bdstoken+'&num=100&order=name&desc=1&clienttype=0&showempty=0&web=1&page='+self.pageno+'&channel=chunlei&web=1&app_id=250528',
			success: function(res){
				// if error is encountered
				if(res.errno != 0 ){
					new Error(res.errno).handle();
					return;
				}
				console.log("List dir succeeds");
				// good, we make it
				if(res.list.length == 0){
					return;
				}
				self.fileList = new FileList(res.list);
				updatePopup();
				cb();
			}
		});
	};

	// share file by fsidList
	self.share = function(fsidList, cb){
		$.ajax({
			type: "POST",
			url: "https://pan.baidu.com/share/set?web=1&channel=chunlei&web=1&bdstoken="+self.yunData.bdstoken+"&clienttype=0",
			data: "fid_list="+JSON.stringify(fsidList)+"&schannel=0&channel_list=%5B%5D&period=0",
			dataType: "json",
			success: function(res){
				if(res.errno != 0){
					new Error(res.errno).handle();
					return;
				}
				console.log("Share success");
				self.shorturl = new URL(res.shorturl);
				self.shareid = res.shareid;
				cb();
			}
		});
	};

	// unshare a file by its shareid
	self.unshare = function(){
		$.ajax({
			type: "POST",
			url: "https://pan.baidu.com/share/cancel?bdstoken="+self.yunData.bdstoken+"&channel=chunlei&web=1&clienttype=0",
			data: "shareid_list=%5B"+self.shareid+"%5D",
			dataType: "json",
			success: function(res){
			if(res.errno != 0){
					new Error(res.errno).handle();
					return;
				}
				console.log("Unshare success");
			}
		});
	};

	self.execute = function(){
		self.getUserYunData(function(){
			self.listDir(function(){});
		});
	};

	self.init(url);
}

//function SearchPage(url)
//{
//	  var self = this;
//	  self.url = url;
//	  self.execute = function(){
//		  console.log('search page');
//	  };
//}

function File(path, fid, isdir, md5=undefined, glink=undefined, hlinks=undefined)
{
	var self = this;
	self.path = path;
	self.fid = fid;
	self.isdir = isdir;
	self.md5 = md5;
	self.glink = glink;
	self.hlinks = hlinks;
	var tmp = path.split('/');
	self.name = tmp[tmp.length-1];
}

function FileList(fileList)
{
	var self = this;
	self.init = function(fileList){
		self.fileList = [];
		self.fsidList = [];
		fileList.forEach(function(e){
			var file = new File(e.path, e.fs_id, e.isdir);
			self.fileList.push(file);
			self.fsidList.push(e.fs_id);
		});
	};
	self.updateGLinks = function(fileList){
		console.log('updating glink list');
		fileList.forEach(function(e){
			var idx = self.fsidList.indexOf(e.fs_id);
			self.fileList[idx].glink = e.dlink;
			self.fileList[idx].md5 = e.md5;
		});
	};
	self.updateHLinks = function(file, hlinks){
		console.log('updating hlink list');
		var fsid = file.fid;
		var idx = self.fsidList.indexOf(fsid);
		self.fileList[idx].hlinks = hlinks;
	};
	self.merge = function(fileList){
		fileList.fsidList.forEach(function(e, i){
			var idx = self.fsidList.indexOf(e);
			if(fileList.fileList[i].glink)self.fileList[idx].glink = fileList.fileList[i].glink;
			if(fileList.fileList[i].hlinks)self.fileList[idx].hlinks = fileList.fileList[i].hlinks;
			if(fileList.fileList[i].md5)self.fileList[idx].md5 = fileList.fileList[i].md5;
		});
	};
	self.init(fileList);
}

function Error(errno)
{
	var self = this;
	self.errno = errno;
	self.handle = function(){
		console.log('errno: '+self.errno);
		if(self.errno == -20){
			$.ajax({
				url: 'https://pan.baidu.com/api/getvcode?prod=pan',
				success: function(res){
					page.vcode = res.vcode;
					updatePopup();
				}
			});
		}
	};
	// 2:	wrong parameters
	// 118: no download priviledge
	// -3:	not your file
	// 110: share to frequently
}
