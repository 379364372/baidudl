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
    self.getYunData = function(cb){
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
    self.getGLinks = function(verify=false, vcode=undefined, input=undefined){
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
                    if(e.glink)new Extractor(e).getHLinks();
                });
            }
        });
    };
    // main logic in share page
    self.execute = function(){
        console.log('share page main logic starts');
        self.getExtra(function(){
            self.getYunData(function(){
                var fileList = self.yunData.file_list.list;

                // handle duplicate redirections
                if((fileList.length > 1 || fileList[0].isdir) && self.url.hash.substr(0, 5) != '#list')return;

                // handle different share page
                if(self.url.hash.indexOf('list') < 0 || getURLParameter(self.url, 'path') == '%2F'){
                    self.fileList = new FileList(fileList);
                    updatePopup();
                    self.getGLinks();
                }
                else{
                    self.listDir(self.getGLinks);
                }
            });
        });
    };

    self.init(url);
}

//function HomePage(url)
//{
//    var self = this;
//    self.url = url;
//    self.execute = function(){
//        console.log('home page');
//    };
//}
//
//function SearchPage(url)
//{
//    var self = this;
//    self.url = url;
//    self.execute = function(){
//        console.log('search page');
//    };
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
    self = this;
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
    // 2:   wrong parameters
    // 118: no download priviledge
    // -3:  not your file
    // 110: share to frequently
}