import default_skin from "./webix-spacer.scss";

var webix = require("./webix-base");

webix.protoUI({
    name:"spacer",
    defaults:{
        borderless:true
    },
    $init:function(){
        this._viewobj.className += " webix_spacer";
    }
}, webix.ui.view);

module.exports = webix;