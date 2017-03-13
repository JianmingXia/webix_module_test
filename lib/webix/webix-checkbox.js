import default_skin from "./webix-checkbox.scss";

var webix = require("./webix-text");

webix.protoUI({
    name:"checkbox",
    defaults:{
        checkValue:1,
        uncheckValue:0,
        template:function(config, common) {
            var id = "x"+webix.uid();
            var rightlabel = "";
            if (config.labelRight){
                rightlabel = "<label class='webix_label_right'>"+config.labelRight+"</label>";
                //user clearly attempts to hide the label, help him
                if (config.labelWidth)
                    config.label = config.label || "&nbsp;";
            }
            var checked = (config.checkValue == config.value);
            var margin = Math.floor((common._settings.aheight-16)/2);
            var ch = common._baseInputHTML("input")+"style='margin-top:"+margin+"px;"+(config.customCheckbox?"display:none":"")+"' id='"+id+"' type='checkbox' "+(checked?"checked='1'":"")+"/>";
            var className = "webix_inp_checkbox_border webix_el_group webix_checkbox_"+(checked?"1":"0");
            var html = "<div style='line-height:"+common._settings.cheight+"px' class='"+className+"'>"+ch+(config.customCheckbox||"")+rightlabel+"</div>";
            return common.$renderInput(config, html, id);
        }
    },
    customCheckbox_setter: function(value){
        if( value === true && webix.skin.$active.customCheckbox){
            value = "<a onclick='javascript:void(0)'><button type='button' class='webix_custom_checkbox";
            value += this._addSkinCss("webix_custom_checkbox") + "'></button></a>";
        }
        return value;
    },
    focus: function(){
        var input = this.$view.getElementsByTagName(this._settings.customCheckbox?"button":"input")[0];
        if(input)
            input.focus();
    },
    blur: function(){
        var input = this.$view.getElementsByTagName(this._settings.customCheckbox?"button":"input")[0];
        if(input)
            input.blur();
    },
    _init_onchange: function(){},
    $setValue:function(value){
        var isChecked = (value == this._settings.checkValue);
        var parentNode = this.getInputNode()?this.getInputNode().parentNode:null;
        if(parentNode){
            parentNode.className = parentNode.className.replace(/(webix_checkbox_)\d/,"$1"+(isChecked?1:0));
        }
        this.getInputNode().checked = isChecked;
    },
    toggle:function(){
        var value = (this.getValue() != this._settings.checkValue)?this._settings.checkValue:this._settings.uncheckValue;
        this.setValue(value);
    },
    getValue:function(){
        var value = this._settings.value;
        return  (value == this._settings.checkValue)?this._settings.checkValue:this._settings.uncheckValue;
    },
    $skin:function(){
        if(webix.skin.$active.customCheckbox)
            this.defaults.customCheckbox = true;
    }
}, webix.ui.text);

module.exports = webix;