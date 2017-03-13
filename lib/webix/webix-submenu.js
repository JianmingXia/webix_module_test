require("./webix-popup");
var webix = require("./webix-menu");

webix.protoUI({
    name:"submenu",
    $init:function(){
        this._body_cell = webix.clone(this._dummy_cell_interface);
        this._body_cell._view = this;

        this.attachEvent('onMouseOut',function(){
            if (this.getTopMenu()._settings.openAction == "click")
                return;
            if (!this._child_menu_active && !this._show_on_mouse_out)
                this.hide();
        });

        this.attachEvent("onBlur", function(){
            if(this.getTopMenu()._settings.openAction == "click") {
                this._hidePrevSubmenu();
            }
        });

        //inform parent that focus is still in menu
        this.attachEvent('onMouseMoving',function(){
            if (this._parent_menu)
                webix.$$(this._parent_menu)._child_menu_active = true;
        });

    },
    _hidePrevSubmenu:function() {
        if(this.config && this.config.id) {
            var sub = webix.$$(this.config.id);
            if(sub.isVisible()){
                sub.hide();
            }
        }
    },
    $skin:function(){
        webix.ui.menu.prototype.$skin.call(this);
        webix.ui.popup.prototype.$skin.call(this);

        this.type.height = webix.skin.$active.menuHeight;
    },
    _dummy_cell_interface : {
        $getSize:function(dx, dy){
            //we saving height and width, as list can hardcode new values
            var h = this._view._settings.height*1;
            var w = this._view._settings.width*1;
            var size = webix.ui.menu.prototype.$getSize.call(this._view, dx, dy);
            //restoring
            this._view._settings.height = h;
            this._view._settings.width = w;
            return size;
        },
        $setSize:function(x,y){
            if (this._view._settings.scroll)
                this._view._bodyobj.style.height = y+"px";
        },
        destructor:function(){ this._view = null; }
    },
    //ignore body element
    body_setter:function(){
    },
    getChildViews:function(){ return []; },
    defaults:{
        width:150,
        subMenuPos:"right",
        layout:"y",
        autoheight:true
    },
    type:{
        height: webix.skin.menuHeight,
        subsign:true
    }
}, webix.ui.menu, webix.ui.popup);

module.exports = webix;