require("./webix-layout");
var webix = require("./webix-suggest");

webix.editors.multiselect = webix.extend({
    popupType:"multiselect"
}, webix.editors.richselect);

webix.type(webix.ui.list, {
    name:"multilist",
    templateStart:webix.template('<div webix_l_id="#!id#" class="{common.classname()}" style="width:{common.widthSize()}; height:{common.heightSize()}; overflow:hidden;">')
}, "default");

webix.type(webix.ui.list, {
    name:"checklist",
    templateStart:webix.template('<div webix_l_id="#!id#" class="{common.classname()}" style="width:{common.widthSize()}; height:{common.heightSize()}; overflow:hidden; white-space:nowrap;">{common.checkbox()}'),
    checkbox: function(obj){
        var icon = obj.$checked?"icon-check-square":"icon-square-o";
        return "<span class='webix_icon iconfont "+icon+"'></span>";
    },
    template: webix.template("#value#")
}, "default");

webix.protoUI({
    name:"multisuggest",
    defaults:{
        separator:",",
        type:"layout",
        button:true,
        width:0,
        filter:function(item,value){
            var itemText = this.getItemText(item.id);
            if(typeof item.acc != 'undefined' && item.acc.indexOf(value) >= 0){
                return true;
            }
            return (itemText.toString().toLowerCase().indexOf(value.toLowerCase())>-1);
        },
        body:{
            rows:[
                { view:"list", type:"multilist", borderless:true,  autoheight:true, yCount:5, multiselect:"touch", select:true,
                    on:{
                        onItemClick: function(id){
                            var popup = this.getParentView().getParentView();
                            webix.delay(function(){
                                popup._toggleOption(id);
                            });
                        }
                    }},
                { view:"button", click:function(){
                    var suggest = this.getParentView().getParentView();
                    suggest.setMasterValue({ id:suggest.getValue() });
                    suggest.hide();
                }}
            ]
        }
    },

    _toggleOption: function(id){
        var value = this.getValue();
        var values = webix.toArray(value?this.getValue().split(this._settings.separator):[]);

        if(values.find(id)<0){
            values.push(id);
        }
        else
            values.remove(id);
        var master = webix.$$(this._settings.master);
        if(master){
            master.setValue(values.join(this._settings.separator));
        }
        else
            this.setValue(values);
    },
    _get_extendable_cell:function(obj){
        return obj.rows[0];
    },
    _set_on_popup_click:function(){
        var button = this.getButton();
        var text = (this._settings.button?(this._settings.buttonText || webix.i18n.controls.select):0);
        if(button){
            if(text){
                button._settings.value = text;
                button.refresh();
            }
            else
                button.hide();
        }
    },
    getButton:function(){
        return this.getBody().getChildViews()[1];
    },
    getList:function(){
        return this.getBody().getChildViews()[0];
    },
    setValue:function(value){
        var text = [];
        var list = this.getList();
        list.unselect();

        if (value){
            if (typeof value == "string")
                value = value.split(this.config.separator);

            if (value[0]){
                for (var i = 0; i < value.length; i++){
                    if (list.getItem(value[i])){
                        if(list.exists(value[i]))
                            list.select(value[i], true);
                        text.push(this.getItemText(value[i]));
                    }
                }
            }
        }

        this._settings.value = value?value.join(this.config.separator):"";
        return text;
    },
    getValue:function(){
        return this._settings.value;
    }
}, webix.ui.suggest);

module.exports = webix;