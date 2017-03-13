import default_skin from "./webix-combo.scss";

var webix = require("./webix-richselect");

webix.protoUI({
    name:"combo",
    $init:function(){
        this.attachEvent("onBlur", webix.bind(function(e){
            if (this._settings.text == this.getText())
                return;
            var data = this.getPopup().getSuggestion();
            if (data && !(this.getInputNode().value==="" && webix.$$(this._settings.suggest).getItemText(data)!=="")){
                this.setValue(data);
            } else if(!this._settings.editable){
                var value = this.getValue();
                this.$setValue(webix.isUndefined(value)?"":value);
            }

        },this));
    },
    getInputNode:function(){
        return this._dataobj.getElementsByTagName('input')[0];
    },
    $render:function(obj){
        if (webix.isUndefined(obj.value)) return;
        this.$setValue(obj.value);
    },
    _applyChanges:function(){
        var input = this.getInputNode();
        var newvalue = "";
        if (input.value)
            newvalue = webix.$$(this._settings.suggest).getSuggestion() || this._settings.value;
        if (newvalue != this._settings.value)
            this.setValue(newvalue, true);
        else
            this.$setValue(newvalue);
    },
    defaults:{
        template:function(config, common){
            return common.$renderInput(config);
        },
        icon: "angle-down"
    }
}, webix.ui.richselect);

module.exports = webix;