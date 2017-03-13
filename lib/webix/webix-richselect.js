import default_skin from "./webix-richselect.scss";

require("./webix-suggest")
var webix = require("./webix-text");

webix.protoUI({
    name:"richselect",
    defaults:{
        template:function(obj,common){
            return common._render_div_block(obj, common);
        },
        popupWidth:200,
        icon: "angle-down"
    },
    suggest_setter:function(value){
        return this.options_setter(value);
    },
    options_setter:function(value){
        this._text_overflow_type = this._settings.text_overflow_type;
        this._skin = this._settings.skin;
        value = this._suggest_config ? this._suggest_config(value) : value;
        var suggest = (this._settings.popup = this._settings.suggest = webix.ui.text.prototype.suggest_setter.call(this, value));
        var list = webix.$$(suggest).getList();
        if (list)
            list.attachEvent("onAfterLoad", webix.bind(this._reset_value, this));

        return suggest;
    },
    getList: function(){
        var suggest = webix.$$(this._settings.suggest);
        webix.assert(suggest, "Input doesn't have a list");
        return suggest.getList();
    },
    _reset_value:function(){
        var value = this._settings.value;
        if(!webix.isUndefined(value) && !this.getPopup().isVisible() && !this._settings.text)
            this.$setValue(value);
    },

    $skin:function(){
        this.defaults.inputPadding = webix.skin.$active.inputPadding;
    },

    $render:function(obj){
        if (webix.isUndefined(obj.value)) return;
        this.$setValue(obj.value);
    },
    getInputNode: function(){
        return this._dataobj.getElementsByTagName("DIV")[1];
    },
    getPopup: function(){
        return webix.$$(this._settings.popup);
    },
    getText:function(){
        var node = this.getInputNode();
        return typeof node.value == "undefined" ? node.innerHTML : node.value;
    },
    $setValue:function(value){
        if (!this._rendered_input) return;

        var text = value;
        var popup = this.getPopup();

        if (popup)
            var text = this.getPopup().getItemText(value);

        if (!text && value && value.id){
            this.getPopup().getList().add(value);
            text = this.getPopup().getItemText(value.id);
            this._settings.value = value.id;
        }

        this._settings.text = text;

        var node = this.getInputNode();

        if (webix.isUndefined(node.value))
            node.innerHTML = text || this._get_div_placeholder();
        else
            node.value = text.replace(/<[^>]*>/g,"");
    },
    getValue:function(){
        return this._settings.value||"";
    }
}, webix.ui.text);

module.exports = webix;