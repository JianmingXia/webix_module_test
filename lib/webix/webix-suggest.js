require("./webix-list")
var webix = require("./webix-popup");

webix.protoUI({
    name:"suggest",
    defaults:{
        autofocus:false,
        type:"list",
        keyPressTimeout:1,
        body:{
            yCount:20,
            autoheight:true,
            body:true,
            select:true,
            borderless:true,
            navigation:true
        },
        filter:function(item,value){
            if (item.value.toString().toLowerCase().indexOf(value.toLowerCase())===0) return true;
            return false;
        }
    },
    template_setter:webix.template,
    filter_setter:function(value){
        return webix.toFunctor(value, this.$scope);
    },
    $init:function(obj){
        var temp = {};
        webix.extend(temp, webix.copy(this.defaults.body));
        temp.view = obj.type || this.defaults.type;

        var etemp = this._get_extendable_cell(temp);
        if (obj.body)
            webix.extend(etemp, obj.body, true);

        if (obj.data)
            etemp.data = obj.data;
        if (obj.url)
            etemp.url = obj.url;
        if (obj.datatype)
            etemp.datatype = obj.datatype;

        if (obj.id)
            temp.id = temp.id || (obj.id+"_"+temp.view);

        obj.body = temp;
        this.$ready.push(this._set_on_popup_click);

        this.attachEvent("onShow", this._show_selection);
        this._old_text = {};
    },
    _get_extendable_cell:function(obj){
        return obj;
    },
    _preselectMasterOption: function(data){
        if (data){
            var master, node, text;
            if (this._settings.master){
                master = webix.$$(this._settings.master);
                if (master.options_setter && (node = master.getInputNode())){
                    text = this.getItemText(data.id);
                    if (webix.isUndefined(node.value))
                        node.innerHTML = text;
                    else
                        node.value = text.replace(/<[^>]*>/g,"");
                }
            }
        }
    },
    setMasterValue:function(data, refresh){
        var text = data.id ? this.getItemText(data.id) : (data.text||data.value);

        if (this._settings.master){
            var master = webix.$$(this._settings.master);
            if (refresh && data.id)
                master.refresh();
            else if (master.options_setter)
                master.setValue(data.$empty?"":data.id);
            else if(master.setValueHere)
                master.setValueHere(text);
            else
                master.setValue(text);
        } else if (this._last_input_target){
            this._last_input_target.value = text;
        }

        if (!refresh){
            this.hide(true);
            if (this._last_input_target)
                this._last_input_target.focus();
        }
        this.callEvent("onValueSuggest", [data, text]);
        webix.delay(function(){
            webix.callEvent("onEditEnd",[]);
        });
    },
    getMasterValue:function(){
        if (this._settings.master)
            return webix.$$(this._settings.master).getValue();
        return null;
    },
    getItemText:function(id){
        var item = this.getList().getItem(id);

        if (!item)
            return this._old_text[id] || "";

        if (this._settings.template)
            return this._settings.template.call(this, item, this.type);

        if (this._settings.textValue)
            return item[this._settings.textValue];

        var type = this.getList().type;
        var text = type.template.call(type, item, type);

        return (this._old_text[id] = text);
    },
    getSuggestion:function(){
        var id,
            list = this.getList(),
            order = list.data.order;

        if (list.getSelectedId)
            id = list.getSelectedId();

        if (order.length && (!id || order.find(id) <0) )
            id = order[0];

        //complex id in datatable
        if (id && typeof id == "object") id = id+"";
        return id;
    },
    getList:function(){
        return this._body_cell;
    },
    _set_on_popup_click:function(){
        var list = this.getList();
        var type = this._settings.type;
        if (list.count){
            list.attachEvent("onItemClick", webix.bind(function(item){
                this.setMasterValue(list.getItem(item));
            }, this));
            list.data.attachEvent("onstoreupdated",webix.bind(function(id, obj, mode){
                if (mode == "delete" && id == this.getMasterValue())
                    this.setMasterValue({ id:"", text:"" }, 1);
                else if (mode == "update" && id == this.getMasterValue()){
                    this.setMasterValue(obj, 1);
                }
            }, this));
            list.data.attachEvent("onAfterFilter", webix.bind(this._suggest_after_filter, this));
            list.data.attachEvent("onStoreLoad", webix.bind(this._suggest_after_filter, this));
            if (webix.isUndefined(this._settings.fitMaster))
                this._settings.fitMaster = true;
        } else if (type == "calendar"){
            list.attachEvent("onDateSelect", function(date){
                this.getParentView().setMasterValue({ value:date});
            });
            list.attachEvent("onTodaySet", function(date){
                this.getParentView().setMasterValue({ value:date});
            });
            list.attachEvent("onDateClear", function(date){
                this.getParentView().setMasterValue({ value:date});
            });
        } else if (type == "colorboard"){
            list.attachEvent("onSelect", function(value){
                this.getParentView().setMasterValue({ value:value });
            });
        }
    },
    input_setter: function(value) {
        this.linkInput(value);
        return 0;
    },
    linkInput: function(input){
        var node;
        if (input.getInputNode){
            node = input.getInputNode();
            node.webix_master_id = input._settings.id;
        } else
            node = webix.toNode(input);

        webix.event(node,"input",function(e){
            if (node != document.body || this.isVisible())
                this._suggestions(e);
        },{bind:this, id: "webix_suggest_keydown_"+node.webix_master_id});

        this._non_ui_mode = true;
    },
    _suggestions: function(e){
        e = (e||event);
        var list = this.getList();
        var trg = e.target||e.srcElement;

        this._last_input_target = trg;
        this._settings.master = trg.webix_master_id;

        window.clearTimeout(this._key_timer);

        var code = e.keyCode;
        //shift and ctrl
        if (code == 16 || code == 17) return;

        // tab - hide popup and do nothing
        if (code == 9)
            return this._tab_key(this,list);

        // escape - hide popup
        if (code == 27)
            return this._escape_key(this,list);

        // enter
        if (code == 13)
            return this._enter_key(this,list);

        // up/down are used for navigation
        if (this._navigate(e)) {
            webix.html.preventEvent(e);
            return false;
        }

        if (webix.isUndefined(trg.value)) return;

        clearTimeout(this._last_delay);
        this._last_delay = webix.delay(function(){
            //focus moved to the different control, suggest is not necessary
            if (!this._non_ui_mode &&
                webix.UIManager.getFocus() != webix.$$(this._settings.master)) return;

            this._resolve_popup = true;
            //for multicombo
            var val = trg.value;
            // used to prevent showing popup when it was initialized
            if (list.config.dataFeed)
                list.filter("value", val);
            else if (list.filter){
                list.filter(webix.bind(function(item){
                    return this._settings.filter.call(this,item,val);
                }, this));
            }
        },this, [], this._settings.keyPressTimeout);
    },
    _suggest_after_filter: function() {
        if (!this._resolve_popup) return true;
        this._resolve_popup = false;

        var list = this.getList();

        // filtering is complete
        // if there are as min 1 variant it must be shown, hidden otherwise
        if (list.count() >0){
            this.adjust();
            if(!this.isVisible())
                this._dont_unfilter = true;
            this.show(this._last_input_target,null,true);
            this._dont_unfilter = false;
        } else {
            this.hide(true);
            this._last_input_target = null;
        }
    },

    show:function(node){
        if (!this.isVisible()){
            var list = this.getList();
            if (list.filter && !this._dont_unfilter){
                list.filter("");
                this._show_selection(list);
            }

            if(this.$customWidth){
                this.$customWidth(node);
            }
            if (node.tagName && this._settings.fitMaster){
                this._settings.width = node.offsetWidth -2 ; //2 - borders
            }
            if (list._zoom_level)
                list.render();

            this.adjust();
        }
        webix.ui.popup.prototype.show.apply(this, arguments);
    },
    _show_selection:function(list){
        list = list||this.getList();
        if( list.select && list.showItem ){
            var value = this.getMasterValue();
            if (value && list.exists && list.exists(value)){
                list.select(value);
                list.showItem(value);
            }
            else{
                list.unselect();
                list.showItem(list.getFirstId());
            }
        }
    },
    _enter_key: function(popup,list) {
        if (list.count && list.count()){
            if (popup.isVisible()) {
                var value = list.getSelectedId(false, true);

                if(list.count()==1 && list.getFirstId()!=value){
                    value = list.getFirstId();
                }
                if (value)
                    this.setMasterValue(list.getItem(value));

                popup.hide(true);
            } else {
                popup.show(this._last_input_target);
            }
        } else {
            if (popup.isVisible())
                popup.hide(true);

        }
    },
    _escape_key: function(popup, list) {
        return popup.hide(true);
    },
    _tab_key: function(popup, list) {
        return popup.hide(true);
    },


    /*! suggestions navigation: up/down buttons move selection
     *	@param e
     *		event object
     **/
    _navigate: function(e) {
        var list = this.getList();
        var code = e.keyCode;

        if(list.count && list.moveSelection) {
            // up arrow
            if (code === 38 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {

                list.moveSelection("up");
                this._preselectMasterOption(list.getSelectedItem());
                return true;
            }

            // down arrow
            if (code === 40 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
                var visible = this.isVisible();
                if (!visible){
                    if (list.count())
                        this.show(this._last_input_target);
                    else return false;
                }


                var selected = list.getSelectedId();
                if (!selected && list.count)
                    list.select(list.getFirstId());
                else if (visible)
                    list.moveSelection("down");
                this._preselectMasterOption(list.getSelectedItem());
                return true;
            }
        }
        return false;
    },
    getValue:function(){
        var value = this.getList().getSelectedId() || "";
        return value.id || value;

    },
    setValue:function(value){
        var list = this.getList();
        if(value){
            if(list.exists(value)){
                list.select(value);
                list.showItem(value);
            }
        }else{
            list.unselect();
            list.showItem(list.getFirstId());
        }
    }
}, webix.ui.popup);

module.exports = webix;

