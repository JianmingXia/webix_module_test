import default_skin from "./webix-layout.scss";
import layout_head_skin from "./webix-layout_header.scss";

var webix = require("./webix-baselayout");

webix.protoUI({
    name:"layout",
    $init:function(config){
        this._hiddencells = 0;
        this._skin = config.skin;
    },
    defaults:{
        type:"line",
        margin_num: 1,
        padding_num: 1,
    },
    _parse_cells:function(){
        if(typeof this._settings.borderless != "undefined" && this._settings.borderless == false){
            this._margin = this._settings.margin_num;
            this._paddingX = this._paddingY = this._settings.padding_num;
        }

        if (this._parse_cells_ext)
            collection = this._parse_cells_ext(collection);

        if (!this._parse_once){
            var layout_class = "webix_layout_"+(this._settings.type||"");
            this._viewobj.className += " " + layout_class;

            this._viewobj.className += webix.getSkinCss(layout_class, this._skin);
            this._parse_once = 1;
        }

        if (this._settings.margin !== webix.undefined)
            this._margin = this._settings.margin;

        if (this._settings.padding != webix.undefined)
            this._paddingX = this._paddingY = this._settings.padding;
        if (this._settings.paddingX !== webix.undefined)
            this._paddingX = this._settings.paddingX;
        if (this._settings.paddingY !== webix.undefined)
            this._paddingY = this._settings.paddingY;

        if (this._paddingY || this._paddingX)
            this._padding = true;

        //if layout has paddings we need to set the visible border
        if (this._hasBorders() && !this._settings.borderless){
            this._contentobj.style.borderWidth="1px";
            //if layout has border - normal bordering rules are applied
            this._render_borders = true;
        }


        var collection = this._collection;
        this._settings._inner = { top:false, left:false, right:false, bottom:false};
        if (this._settings.borderless){
            this._settings._inner = { top:true, left:true, right:true, bottom:true};
        }

        this._beforeResetBorders(collection);
        webix.ui.baselayout.prototype._parse_cells.call(this, collection);
        this._afterResetBorders(collection);
    },
    $getSize:function(dx, dy){
        dx=dx||0; dy=dy||0;

        var correction = this._margin*(this._cells.length-this._hiddencells-1);
        if (this._render_borders || this._hasBorders()){
            var _borders = this._settings._inner;
            if (_borders){
                dx += (_borders.left?0:1)+(_borders.right?0:1);
                dy += (_borders.top?0:1)+(_borders.bottom?0:1);
            }
        }

        if (!this._settings.height)
            dy += (this._paddingY||0)*2 + (this._vertical_orientation ? correction : 0);

        if (!this._settings.width)
            dx += (this._paddingX||0)*2 + (this._vertical_orientation ? 0 : correction);

        return webix.ui.baselayout.prototype.$getSize.call(this, dx, dy);
    },
    $setSize:function(x,y){
        this._layout_sizes = [x,y];
        webix.debug_size_box_start(this);

        var result;
        if (this._hasBorders()||this._render_borders)
            result = webix.ui.view.prototype.$setSize.call(this,x,y);
        else
            result = webix.ui.baseview.prototype.$setSize.call(this,x,y);

        //form with scroll
        y = this._content_height;
        x = this._content_width;

        var config = this._settings;
        if (config.scroll){
            y = Math.max(y, this._desired_size[1]);
            x = Math.max(x, this._desired_size[0]);
        }

        this._set_child_size(x, y);

        webix.debug_size_box_end(this, [x,y]);
    },
    _set_child_size:function(x,y){
        var correction = this._margin*(this._cells.length-this._hiddencells-1);

        if (this._vertical_orientation){
            y-=correction+this._paddingY*2;
            x-=this._paddingX*2;
        }
        else {
            x-=correction+this._paddingX*2;
            y-=this._paddingY*2;
        }
        return webix.ui.baselayout.prototype._set_child_size.call(this, x, y);
    },
    resizeChildren:function(structure_changed){
        if (structure_changed){
            this._last_size = null; //forces children resize
            var config = [];
            for (var i = 0; i < this._cells.length; i++){
                var cell = this._cells[i];
                config[i] = cell._settings;
                var n = ((cell._layout_sizes && !cell._render_borders) || cell._settings.borderless)?"0px":"1px";

                cell._viewobj.style.borderTopWidth=cell._viewobj.style.borderBottomWidth=cell._viewobj.style.borderLeftWidth=cell._viewobj.style.borderRightWidth=n;
            }

            this._beforeResetBorders(config);
            for (var i=0; i<config.length; i++)
                if (config[i].borderless && this._cells[i]._set_inner)
                    this._cells[i]._set_inner(config[i]);
            this._afterResetBorders(this._cells);
        }

        webix.ui.baselayout.prototype.resizeChildren.call(this);
    },
    _hasBorders:function(){
        return this._padding && this._margin>0 && !this._cleanlayout;
    },
    _beforeResetBorders:function(collection){
        if (this._hasBorders() && (!this._settings.borderless || this._settings.type == "space")){
            for (var i=0; i < collection.length; i++){
                if (!collection[i]._inner || !collection[i].borderless)
                    collection[i]._inner={ top:false, left:false, right:false, bottom:false};
            }
        } else {
            for (var i=0; i < collection.length; i++)
                collection[i]._inner=webix.clone(this._settings._inner);
            var mode = false;
            if (this._cleanlayout)
                mode = true;

            var maxlength = collection.length;
            if (this._vertical_orientation){
                for (var i=1; i < maxlength-1; i++)
                    collection[i]._inner.top = collection[i]._inner.bottom = mode;
                if (maxlength>1){
                    if (this._settings.type!="head")
                        collection[0]._inner.bottom = mode;

                    while (collection[maxlength-1].hidden && maxlength>1)
                        maxlength--;
                    if (maxlength>0)
                        collection[maxlength-1]._inner.top = mode;
                }
            }
            else {
                for (var i=1; i < maxlength-1; i++)
                    collection[i]._inner.left = collection[i]._inner.right= mode;
                if (maxlength>1){
                    if (this._settings.type!="head")
                        collection[0]._inner.right= mode;
                    collection[maxlength-1]._inner.left = mode;

                    while (maxlength>1 && collection[maxlength-1].hidden)
                        maxlength--;
                    if (maxlength>0)
                        collection[maxlength-1]._inner.left = mode;
                }
            }

        }
    },
    _fix_container_borders:function(style, inner){
        if (inner.top)
            style.borderTopWidth="0px";
        if (inner.left)
            style.borderLeftWidth="0px";
        if (inner.right)
            style.borderRightWidth="0px";
        if (inner.bottom)
            style.borderBottomWidth="0px";
    },
    _afterResetBorders:function(collection){
        var start = 0;
        for (var i=0; i<collection.length; i++){
            var cell = this._cells[i];

            var s_inner = cell._settings._inner;
            if (cell._settings.hidden && this._cells[i+1]){
                var s_next = this._cells[i+1]._settings._inner;
                if (!s_inner.top)
                    s_next.top = false;
                if (!s_inner.left)
                    s_next.left = false;

                if (i==start) start++;
            }
            this._fix_container_borders(cell._viewobj.style, cell._settings._inner);
        }

        var style = this._vertical_orientation?"marginLeft":"marginTop";
        var contrstyle = this._vertical_orientation?"marginTop":"marginLeft";
        var padding = this._vertical_orientation?this._paddingX:this._paddingY;
        var contrpadding = this._vertical_orientation?this._paddingY:this._paddingX;

        //add top offset to all
        for (var i=0; i<collection.length; i++)
            this._cells[i]._viewobj.style[style] = (padding||0) + "px";

        //add left offset to first cell
        if (this._cells.length)
            this._cells[start]._viewobj.style[contrstyle] = (contrpadding||0)+"px";

        //add offset between cells
        for (var index=start+1; index<collection.length; index++)
            this._cells[index]._viewobj.style[contrstyle]=this._margin+"px";

    },
    type_setter:function(value){
        this._margin = (typeof this._margin_set[value] != "undefined"? this._margin_set[value]: this._margin_set["line"]);
        this._paddingX = this._paddingY = (typeof this._margin_set[value] != "undefined"? this._padding_set[value]: this._padding_set["line"]);

        this._cleanlayout = (value=="material" || value=="clean");
        if (value == "material")
            this._settings.borderless = true;

        return value;
    },
    $skin:function(){
        var skin = webix.skin.$active;
        this._margin_set = skin.layoutMargin;
        this._padding_set = skin.layoutPadding;
    }
}, webix.ui.baselayout);

webix.ui.layout.call(webix);

module.exports = webix;