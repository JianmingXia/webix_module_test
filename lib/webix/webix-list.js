import default_skin from "./webix-list.scss";

require("./webix-proto");
var webix = require("./webix-template");

webix.protoUI({
    name:"list",
    _listClassName : "webix_list",
    $init:function(config){
        var listClassName = this._listClassName + (((config.layout||this.defaults.layout) == "x")?"-x":"");
        listClassName += webix.getSkinCss(listClassName, config.skin);

        webix.html.addCss(this._viewobj, listClassName);
        this.data.provideApi(this,true);

        this._auto_resize = webix.bind(this._auto_resize, this);
        this.data.attachEvent("onStoreUpdated", this._auto_resize);
        this.data.attachEvent("onSyncApply", this._auto_resize);
        this.attachEvent("onAfterRender", this._correct_width_scroll);
    },
    $dragHTML:function(obj, e){
        if (this._settings.layout == "y" && this.type.width == "auto"){
            this.type.width = this._content_width;
            var node = this._toHTML(obj);
            this.type.width = "auto";
            return node;
        }
        return this._toHTML(obj);
    },
    defaults:{
        select:false,
        scroll:true,
        layout:"y"
    },
    _id:"webix_l_id",
    on_click:{
        webix_list_item:function(e,id){
            if (this._settings.select){
                this._no_animation = true;
                if (this._settings.select=="multiselect"  || this._settings.multiselect)
                    this.select(id, false, (e.ctrlKey || e.metaKey || (this._settings.multiselect == "touch")), e.shiftKey); 	//multiselection
                else
                    this.select(id);
                this._no_animation = false;
            }
        },
        webix_list_group:function(e,id){
            return;
        }
    },
    on_dblclick:{
    },
    getVisibleCount:function(){
        return Math.floor(this._content_height / this.type.height);
    },
    _auto_resize:function(){
        if (this._settings.autoheight || this._settings.autowidth)
            this.resize();
    },
    _auto_height_calc:function(count){
        var value = this.data.$pagesize||this.count();

        this._onoff_scroll(count && count < value);
        if (this._settings.autoheight && value < (count||Infinity) )
            count = value;
        return Math.max(this.type.height * count,this._settings.minHeight||0);
    },
    _auto_width_calc:function(count){
        var value = this.data.$pagesize||this.count();

        this._onoff_scroll(count && count < value);
        if (this._settings.autowidth && value < (count||Infinity) )
            count = value;

        return (this.type.width * count);
    },
    _correct_width_scroll:function(){
        if (this._settings.layout == "x")
            this._dataobj.style.width = (this.type.width != "auto") ? (this.type.width * this.count() + "px") : "auto";
    },
    $getSize:function(dx,dy){
        if (this._settings.layout == "y"){
            if (this.type.width!="auto")
                this._settings.width = this.type.width + (this._scroll_y?webix.ui.scrollSize:0);
            if (this._settings.yCount || this._settings.autoheight)
                this._settings.height = this._auto_height_calc(this._settings.yCount)||1;
        }
        else {
            if (this.type.height!="auto")
                this._settings.height = this.type.height + (this._scroll_x?webix.ui.scrollSize:0);
            if (this._settings.xCount || this._settings.autowidth)
                this._settings.width = this._auto_width_calc(this._settings.xCount)||1;
        }
        return webix.ui.view.prototype.$getSize.call(this, dx, dy);
    },
    $setSize:function(){
        webix.ui.view.prototype.$setSize.apply(this, arguments);
    },
    type:{
        css:"",
        widthSize:function(obj, common){
            return common.width+(common.width>-1?"px":"");
        },
        heightSize:function(obj, common, marks, config){
            if(config){
                var height_size = config.height_size;
                if(height_size > 0) {
                    return height_size + "px";
                }
            }

            return common.height+(common.height>-1?"px":"");
        },
        classname:function(obj, common, marks, config){
            if(config){
                var skin = config.skin;
            }
            var css = "webix_list_item";
            if(typeof obj.is_group !== "undefined" && obj.is_group) {
                css = "webix_list_group";
            }

            css += webix.getSkinCss(css, skin);

            css += webix.getCursorCss(config.cursor_type);
            css += webix.getTextOverflowCss(config.text_overflow_type);

            if (obj.$css){
                if (typeof obj.$css == "object")
                    obj.$css = webix.html.createCss(obj.$css);
                css += " "+obj.$css;
            }
            if (marks && marks.$css)
                css += " "+marks.$css;

            return css;
        },
        template:function(obj, common, marks, config){
            var result = "";
            if(config && config.menu_type == "button"){
                result = "<div class='webix_menu_button";
                if(config.skin) {
                    result += webix.getSkinCss("webix_menu_button", config.skin);
                }
                result += "'>" + obj.value + "</div>";
            } else {
                result = (obj.icon?("<span class='webix_icon icon-"+obj.icon+"'></span> "):"") + obj.value;
            }

            if(obj.badge){
                result += "<div class='webix_badge";
                if(config && config.skin){
                    result += webix.getSkinCss("webix_badge", config.skin);
                }
                result += "'>" + obj.badge + "</div>";
            }

            return result;
        },
        width:"auto",
        templateStart:webix.template('<div webix_l_id="#id#" class="{common.classname()}" style="width:{common.widthSize()}; height:{common.heightSize()}; overflow:hidden;">'),
        templateGroupStart:webix.template('<div webix_group_id="#id#" class="{common.classname()}" style="width:{common.widthSize()}; height:{common.heightSize()}; overflow:hidden;">'),
        templateEnd:webix.template("</div>")
    },
    $skin:function(){
        this.type.height = webix.skin.$active.listItemHeight;
    }
}, webix.KeysNavigation, webix.DataMove, webix.DragItem, webix.MouseEvents, webix.SelectionModel, webix.Scrollable, webix.ui.proto, webix.CopyPaste);

module.exports = webix;
