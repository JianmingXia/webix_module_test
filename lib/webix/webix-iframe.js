var webix = require("./webix-text");

webix.protoUI({
    name:"iframe",
    $init:function(config){
        this._dataobj = this._contentobj;
        this._contentobj.innerHTML = "<iframe style='width:100%; height:100%' frameborder='0' onload='var t= $$(\""+config.id+"\"); if (t) t.callEvent(\"onAfterLoad\",[]);' src='about:blank'></iframe>";
    },
    load:function(value){
        this.src_setter(value);
    },
    src_setter:function(value){
        this.getIframe().src = value;
        this.callEvent("onBeforeLoad",[]);
        return value;
    },
    getIframe:function(){
        return this._contentobj.getElementsByTagName("iframe")[0];
    },
    getWindow:function(){
        return this.getIframe().contentWindow;
    }
}, webix.ui.view, webix.EventSystem);

module.exports = webix;