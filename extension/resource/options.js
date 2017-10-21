$(function(){
    var config =(function(){
        return {
            init:function(){
                var self =this;
                var rpc_list=JSON.parse(localStorage.getItem("rpc_list")||'[{"name":"Aria2","url":"http://localhost:6800/jsonrpc"}]');
                for(var i in rpc_list){
                    var addBtn=0==i?'<button class="btn" id="add-rpc">Add RPC</button>':'';
                    var row='<div class="control-group rpc_list"><label class="control-label">JSON-RPC</label><div class="controls"><input type="text" class="input-small" value="'+rpc_list[i]['name']+'" placeholder="RPC Name"><input type="text" class="input-xlarge rpc-path" value="'+rpc_list[i]['url']+'" placeholder="RPC Path">'+addBtn+'</div></div>';
                    if($(".rpc_list").length>0){
                        $(row).insertAfter($(".rpc_list").eq(i-1));
                    }else{
                        $(row).insertAfter($("fieldset legend"));
                    }
                }

                $("#add-rpc").on("click",function(){
                    var rpc_form='<div class="control-group rpc_list">'+
                        '<label class="control-label">JSON-RPC</label>'+
                        '<div class="controls">'+
                          '<input type="text" class="input-small"  placeholder="RPC Name">'+
                          '<input type="text" class="input-xlarge rpc-path"  placeholder="RPC Path"></div></div>';
                    $(rpc_form).insertAfter($(".rpc_list")[0]);
                });
                $("#save").on("click",function(){
                    self.save();
                });
                $("#reset").on("click",function(){
                    localStorage.clear();
                    location.reload();
                });
            },
            save:function(){
                var rpc_list=[];
                for(var i=0;i<$(".rpc_list").length;i++){
                    var child=$(".rpc_list").eq(i).children().eq(1).children();
                    if(child.eq(0).val()!= ""&&child.eq(1).val()!= ""){
                        rpc_list.push({"name":child.eq(0).val(),"url":child.eq(1).val()});
                    }
                }
                localStorage.setItem("rpc_list", JSON.stringify(rpc_list));
            }
        };
    })();  
    config.init();
});

