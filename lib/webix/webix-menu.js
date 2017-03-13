import default_skin from "./webix-menu.scss";

var webix = require("./webix-list");

webix.protoUI({
    name:"menu",
    _listClassName:"webix_menu",
    $init:function(config){
        if (config.autowidth){
            this._autowidth_submenu = true;
            delete config.autowidth;
        }

        this.data.attachEvent('onStoreUpdated', webix.bind(function(){
            this._hide_sub_menu();
        },this));
        this.attachEvent('onMouseMove', this._mouse_move_menu);
        this.attachEvent('onMouseOut',function(){
            if (this._menu_was_activated() && this._settings.openAction == "click") return;
            if (!this._child_menu_active)
                this._hide_sub_menu();
        });
        this.attachEvent('onItemClick', function(id, e, trg){
            if (this._menu_was_activated() && this._settings.openAction == "click") {
                this._hide_sub_menu(true);
                return ;
            }

            var item = this.getItem(id);
            if (item){
                if (item.$template) return;

                var parent = this.getTopMenu();

                //ignore disabled items
                if (!this.data.getMark(id, "webix_disabled")){
                    if (!parent.callEvent("onMenuItemClick", [id, e, trg])){
                        e.showpopup = true;
                        return;
                    }

                    if (this != parent)
                        parent._call_onclick(id,e,trg);

                    //click on group - do not close submenus
                    if (!item.submenu){
                        parent._hide_sub_menu(true);
                        if (parent._hide_on_item_click)
                            parent.hide();
                    } else {
                        if ((this === parent || webix.env.touch ) && parent._settings.openAction == "click"){
                            this._mouse_move_activation(id, trg);
                        }

                        //do not close popups when clicking on menu folder
                        e.showpopup = true;
                    }
                }
            }
        });

        this.data.attachEvent("onClearAll", function(){
            this._hidden_items = [];
        });
        this.data._hidden_items = [];
    },
    sizeToContent:function(){
        if (this._settings.layout == "y"){
            var texts = [];
            this.data.each(function(obj){
                texts.push(this._toHTML(obj));
            }, this);

            this.config.width = webix.html.getTextSize(texts, this.$view.className).width+20;
            this.resize();
        } else webix.assert(false, "sizeToContent will work for vertical menu only");
    },
    getTopMenu:function(){
        var parent = this;
        while (parent._parent_menu)
            parent = webix.$$(parent._parent_menu);
        return parent;
    },
    _auto_height_calc:function(count){
        if (this._settings.autoheight) count = this.count();

        var height = 0;
        for (var i=0; i<count; i++){
            var item = this.data.pull[this.data.order[i]];
            if (item && item.$template == "Separator")
                height+=4;
            else
                height+=this.type.height;
        }
        return height;
    },
    on_mouse_move:{},
    type:{
        css:"menu",
        width:"auto",
        templateStart:function(obj, common, mark){
            if (obj.$template === "Separator" || obj.$template === "Spacer"){
                return '<div webix_l_id="#id#" class="webix_context_'+obj.$template.toLowerCase()+'">';
            }

            var menu_button = "";
            var config = arguments[3];
            if(config){
                menu_button = (config.menu_type?"<span class='webix_icon iconfont icon-" + config.menu_type_icon + 
                    webix.getSkinCss("webix_icon", config.skin) + "'></span>":"");
            }

            var link = (obj.href?" href='"+obj.href+"' ":"")+(obj.target?" target='"+obj.target+"' ":"");
            var result = webix.ui.list.prototype.type.templateStart(obj,common,mark,arguments[3]).replace(/^<div/,"<a "+link) +
            menu_button + ((obj.submenu && common.subsign)?"<div class='webix_submenu_icon" + 
                webix.getSkinCss("webix_submenu_icon", config.skin) + " iconfont'></div>":"");
            return result;
        },
        templateEnd: function(obj, common, mark){
            return (obj.$template === "Separator" || obj.$template === "Spacer")?"</div>":"</a>";
        },
        templateSeparator:webix.template("<div class='sep_line'></div>"),
        templateSpacer:webix.template("<div></div>")
    },
    getMenu: function(id){
        if (!this.data.pull[id]){
            for (var subid in this.data.pull){
                var obj = this.getItem(subid);
                if (obj.submenu){
                    var search = this._get_submenu(obj).getMenu(id);
                    if (search) return search;
                }
            }
        } else return this;
    },
    getSubMenu:function(id){
        var menu = this.getMenu(id);
        var obj = menu.getItem(id);
        return (obj.submenu?menu._get_submenu(obj):null);
    },
    getMenuItem:function(id){
        return this.getMenu(id).getItem(id);
    },
    _get_submenu:function(data){
        var sub  = webix.$$(data.submenu);
        if (!sub){
            data.submenu = this._create_sub_menu(data);
            sub = webix.$$(data.submenu);
        }
        return sub;
    },
    _mouse_move_menu:function(id, e, target){
        if (!this._menu_was_activated())
            return;

        this._mouse_move_activation(id, target);
    },
    _menu_was_activated:function(){
        var top = this.getTopMenu();
        if (top._settings.openAction == "click"){
            if (webix.env.touch) return false;
            var sub = top._open_sub_menu;
            if (sub && webix.$$(sub).isVisible())
                return true;
            return false;
        }
        return true;
    },
    _mouse_move_activation:function(id, target){
        var data = this.getItem(id);
        if (!data) return;

        //clear flag of submenu usage
        this._child_menu_active = null;

        //hide previously opened sub-menu
        if (this._open_sub_menu && data.submenu != this._open_sub_menu)
            this._hide_sub_menu(true);

        //show submenu
        if (data.submenu&&!this.config.hidden){

            var sub  = this._get_submenu(data);
            if(this.data.getMark(id,"webix_disabled"))
                return;

            if (this.getTopMenu()._autowidth_submenu && sub.sizeToContent && !sub.isVisible())
                sub.sizeToContent();
            sub.show(target,{ pos:this._settings.subMenuPos });

            sub._parent_menu = this._settings.id;

            this._open_sub_menu = data.submenu;
        }
    },
    disableItem:function(id){
        this.getMenu(id).addCss(id, "webix_disabled");
    },
    enableItem:function(id){
        this.getMenu(id).removeCss(id, "webix_disabled");
    },
    _set_item_hidden:function(id, state){
        var menu = this.data;
        if (menu._hidden_items[id] != state){
            menu._hidden_items[id] = state;
            menu.filter(function(obj){
                return !menu._hidden_items[obj.id];
            });
            this.resize();
        }
    },
    hideItem:function(id){
        var menu = this.getMenu(id);
        if (menu) menu._set_item_hidden(id, true);
    },
    showItem:function(id){
        var menu = this.getMenu(id);
        if (menu){
            menu._set_item_hidden(id, false);
            return webix.ui.list.prototype.showItem.call(menu, id);
        }
    },
    _hide_sub_menu : function(mode){
        if (this._open_sub_menu){
            //recursive sub-closing
            var sub = webix.$$(this._open_sub_menu);
            if (sub._hide_sub_menu)	//custom context may not have submenu
                sub._hide_sub_menu(mode);
            if (mode || !sub._show_on_mouse_out){
                sub.hide();
                this._open_sub_menu = null;
            }
        }
    },
    _create_sub_menu : function(data){
        var listConfig = {
            view:"submenu",
            data:data.submenu
        };

        var settings = this.getTopMenu()._settings.submenuConfig;
        if (settings)
            webix.extend(listConfig, settings, true);

        var parentData = this.getMenuItem(data.id);
        if(parentData && parentData.config)
            webix.extend(listConfig, parentData.config, true);

        var menu = webix.ui(listConfig);
        menu._parent_menu = this;
        return menu._settings.id;
    },
    $skin:function(){
        webix.ui.list.prototype.$skin.call(this);
        this.type.height = webix.skin.$active.menuHeight;
    },
    defaults:{
        scroll:"",
        layout:"x",
        mouseEventDelay:100,
        subMenuPos:"bottom"
    }
}, webix.ui.list);

module.exports = webix;