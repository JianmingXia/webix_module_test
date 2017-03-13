import default_skin from "./webix-search.scss";
var webix = require("./webix-text");

webix.protoUI({
    name:"search",
    $skin:function(){
        this.defaults.inputPadding = webix.skin.$active.inputPadding;
    },
    on_click:{
        "webix_input_icon":function(e){
            return this.callEvent("onSearchIconClick", [e]);
        }
    },
    defaults:{
        type:"text",
        icon:"search"
    }
}, webix.ui.text);

module.exports = webix;