var webix = require("./webix-base");

webix.protoUI({
    name:"baselayout",
    $init:function(config){
        this.$ready.push(this._parse_cells);
        this._dataobj  = this._contentobj;
        this._layout_sizes = [];
        this._responsive = [];

        if (config.$topView && config.borderless != false){
            config.borderless = true;
            config._inner = { top:true, left:true, bottom:true, right:true };
        }

        if (config.isolate)
            webix.extend(this, webix.IdSpace);
    },
    rows_setter:function(value){
        this._vertical_orientation = 1;
        this._collection = value;
    },
    cols_setter:function(value){
        this._vertical_orientation = 0;
        this.$view.style.whiteSpace = "nowrap";
        this._collection = value;
    },
    _remove:function(view){
        webix.PowerArray.removeAt.call(this._cells, webix.PowerArray.find.call(this._cells, view));
        this.resizeChildren(true);
    },
    _replace:function(new_view,target_id){
        if (webix.isUndefined(target_id)){
            for (var i=0; i < this._cells.length; i++)
                this._cells[i].destructor();
            this._collection = new_view;
            this._parse_cells();
        } else {
            var source;
            if (typeof target_id == "number"){
                if (target_id<0 || target_id > this._cells.length)
                    target_id = this._cells.length;
                var prev_node = (this._cells[target_id]||{})._viewobj;
                webix.PowerArray.insertAt.call(this._cells, new_view, target_id);
                if (!new_view._settings.hidden)
                    webix.html.insertBefore(new_view._viewobj, prev_node, this._dataobj);
            } else {
                source = webix.$$(target_id);
                target_id = webix.PowerArray.find.call(this._cells, source);
                webix.assert(target_id!=-1, "Attempt to replace the non-existing view");
                var parent = source._viewobj.parentNode;
                if (parent && !new_view._settings.hidden)
                    parent.insertBefore(new_view._viewobj, source._viewobj);

                source.destructor();
                this._cells[target_id] = new_view;
            }

            if (!this._vertical_orientation)
                this._fix_vertical_layout(new_view);

            this._cells[target_id]._parent_cell = this;
        }
        this.resizeChildren(true);

        var form = this.elements ? this : this.getFormView();
        if (form) form._recollect_elements();

        webix.callEvent("onReconstruct",[this]);
    },
    _fix_vertical_layout:function(cell){
        cell._viewobj.style.display = "inline-block";
        cell._viewobj.style.verticalAlign = "top";
    },
    addView:function(view, index){
        if (webix.isUndefined(index))
            index = this._cells.length;
        var top = this.getTopParentView();
        top = (top && top.ui) ? top: webix;
        return top.ui(view, this, index)._settings.id;
    },
    removeView:function(id){
        var view;
        if (typeof id != "object")
            view = webix.$$(id);
        else
            view = id;

        var target = webix.PowerArray.find.call(this._cells, view);
        if (target >= 0){
            if (this._beforeRemoveView)
                this._beforeRemoveView(target, view);

            var form = this.elements ? this : this.getFormView();

            this._cells.splice(target, 1);
            if (form)
                webix.ui.each(view, function(sub){
                    if (sub.name)
                        delete form.getCleanValues()[sub.config.name];
                }, form, true);

            view.destructor();
            this.resizeChildren(true);

            if (form)
                form._recollect_elements();
        } else
            webix.assert(false, "Attemp to remove not existing view: "+id);

        webix.callEvent("onReconstruct",[this]);
    },
    reconstruct:function(){
        this._hiddencells = 0;
        this._replace(this._collection);
    },
    reconstructNewConfig:function(){
        this._hiddencells = 0;
        var length = this._collection.length;
        for (var i = 0; i < length; i++) {
            var id = this._collection[i].id;
            if(id && $$(id) ) {
                this._collection[i].skin = $$(id).config.skin;
            }
        }
        this._replace(this._collection);
    },
    _hide:function(obj, settings, silent){
        if (obj._settings.hidden) return;
        obj._settings.hidden = true;
        webix.html.remove(obj._viewobj);
        this._hiddencells++;
        if (!silent && !webix._ui_creation)
            this.resizeChildren(true);
    },
    _signal_hidden_cells:function(view){
        if (view.callEvent)
            view.callEvent("onViewShow",[]);
    },
    resizeChildren:function(){
        if (webix.ui.$freeze) return;

        if (this._layout_sizes){
            var parent = this.getParentView();
            if (parent){
                if (parent.resizeChildren)
                    return parent.resizeChildren();
                else
                    return parent.resize();
            }

            var sizes = this.$getSize(0,0);

            var x,y,nx,ny;
            nx = x = this._layout_sizes[0] || 0;
            ny = y = this._layout_sizes[1] || 0;

            if (!parent){
                //minWidth
                if (sizes[0]>x) nx = sizes[0];
                //minHeight
                if (sizes[2]>y) ny = sizes[2];

                //maxWidth rule
                if (x>sizes[1]) nx = sizes[1];
                //maxHeight rule
                if (y>sizes[3]) ny = sizes[3];

                this.$setSize(nx,ny);
            } else
                this._set_child_size(x,y);

            webix.callEvent("onResize",[]);
        }
    },
    getChildViews:function(){
        return this._cells;
    },
    index:function(obj){
        if (obj._settings)
            obj = obj._settings.id;
        for (var i=0; i < this._cells.length; i++)
            if (this._cells[i]._settings.id == obj)
                return i;
        return -1;
    },
    _show:function(obj, settings, silent){

        if (!obj._settings.hidden) return;
        obj._settings.hidden = false;

        //index of sibling cell, next to which new item will appear
        var index = this.index(obj)+1;
        //locate nearest visible cell
        while (this._cells[index] && this._cells[index]._settings.hidden) index++;
        var view = this._cells[index] ? this._cells[index]._viewobj : null;

        webix.html.insertBefore(obj._viewobj, view, (this._dataobj||this._viewobj));
        this._hiddencells--;

        if (!silent){
            this.resizeChildren(true);
            if (obj.refresh)
                obj.refresh();
        }

        if (obj.callEvent){
            obj.callEvent("onViewShow", []);
            webix.ui.each(obj, this._signal_hidden_cells);
        }
    },
    showBatch:function(name, mode){
        var preserve = typeof mode != "undefined";
        mode = mode !== false;

        if (!preserve){
            if (this._settings.visibleBatch == name ) return;
            this._settings.visibleBatch = name;
        } else
            this._settings.visibleBatch = "";

        var show = [];
        for (var i=0; i < this._cells.length; i++){
            if (!this._cells[i]._settings.batch)
                show.push(this._cells[i]);
            else if (this._cells[i]._settings.batch == name){
                if (mode)
                    show.push(this._cells[i]);
                else
                    this._hide(this._cells[i], null, true);
            } else if (!preserve)
                this._hide(this._cells[i], null, true);
        }

        for (var i=0; i < show.length; i++){
            this._show(show[i], null, true);
            show[i]._render_hidden_views();
        }

        this.resizeChildren(true);
    },
    _parse_cells:function(collection){
        this._cells=[];

        webix.assert(collection,this.name+" was incorrectly defined. <br><br> You have missed rows|cols|cells|elements collection");
        for (var i=0; i<collection.length; i++){
            webix._parent_cell = this;
            if (!collection[i]._inner)
                collection[i].borderless = true;

            this._cells[i]=webix.ui._view(collection[i], this);
            if (!this._vertical_orientation)
                this._fix_vertical_layout(this._cells[i]);

            if (this._settings.visibleBatch && this._settings.visibleBatch != this._cells[i]._settings.batch && this._cells[i]._settings.batch){
                this._cells[i]._settings.hidden = true;
                this._hiddencells++;
            }

            if (!this._cells[i]._settings.hidden){
                (this._dataobj||this._contentobj).appendChild(this._cells[i]._viewobj);
                if (this._cells[i].$nospace)
                    this._hiddencells++;
            }
        }

        if (this._parse_cells_ext_end)
            this._parse_cells_ext_end(collection);
    },
    _bubble_size:function(prop, size, vertical){
        if (this._vertical_orientation != vertical)
            for (var i=0; i<this._cells.length; i++){
                this._cells[i]._settings[prop] = size;
                if (this._cells[i]._bubble_size)
                    this._cells[i]._bubble_size(prop, size, vertical);
            }
    },
    $getSize:function(dx, dy){
        webix.debug_size_box_start(this, true);
        var minWidth = 0;
        var maxWidth = 100000;
        var maxHeight = 100000;
        var minHeight = 0;
        if (this._vertical_orientation) maxHeight=0; else maxWidth = 0;

        var fixed = 0;
        var fixed_count = 0;
        var gravity = 0;
        this._sizes=[];

        for (var i=0; i < this._cells.length; i++) {
            //ignore hidden cells
            if (this._cells[i]._settings.hidden)
                continue;

            var sizes = this._sizes[i] = this._cells[i].$getSize(0,0);

            if (this._cells[i].$nospace){
                fixed_count++;
                continue;
            }

            if (this._vertical_orientation){
                //take max minSize value
                if (sizes[0]>minWidth) minWidth = sizes[0];
                //take min maxSize value
                if (sizes[1]<maxWidth) maxWidth = sizes[1];

                minHeight += sizes[2];
                maxHeight += sizes[3];

                if (sizes[2] == sizes[3] && sizes[2] != -1){ fixed+=sizes[2]; fixed_count++; }
                else gravity += sizes[4];
            } else {
                //take max minSize value
                if (sizes[2]>minHeight) minHeight = sizes[2];
                //take min maxSize value
                if (sizes[3]<maxHeight) maxHeight = sizes[3];

                minWidth += sizes[0];
                maxWidth += sizes[1];

                if (sizes[0] == sizes[1] && sizes[0] != -1){ fixed+=sizes[0]; fixed_count++; }
                else gravity += sizes[4];
            }
        }

        if (minHeight>maxHeight)
            maxHeight = minHeight;
        if (minWidth>maxWidth)
            maxWidth = minWidth;

        this._master_size = [fixed, this._cells.length - fixed_count, gravity];
        this._desired_size = [minWidth+dx, minHeight+dy];

        //get layout sizes
        var self_size = webix.ui.baseview.prototype.$getSize.call(this, 0, 0);
        //use child settings if layout's one was not defined
        if (self_size[1] >= 100000) self_size[1]=0;
        if (self_size[3] >= 100000) self_size[3]=0;

        self_size[0] = (self_size[0] || minWidth ) +dx;
        self_size[1] = Math.max(self_size[0], (self_size[1] || maxWidth ) +dx);
        self_size[2] = (self_size[2] || minHeight) +dy;
        self_size[3] = Math.max(self_size[2], (self_size[3] || maxHeight) +dy);

        webix.debug_size_box_end(this, self_size);

        if (this._settings.responsive)
            self_size[0] = 0;

        return self_size;
    },
    $setSize:function(x,y){
        this._layout_sizes = [x,y];
        webix.debug_size_box_start(this);

        webix.ui.baseview.prototype.$setSize.call(this,x,y);
        this._set_child_size(x,y);

        webix.debug_size_box_end(this, [x,y]);
    },
    _set_child_size_a:function(sizes, min, max){
        min = sizes[min]; max = sizes[max];
        var height = min;

        if (min != max){
            var ps = this._set_size_delta * sizes[4]/this._set_size_gravity;
            if (ps < min){
                height = min;
                this._set_size_gravity -= sizes[4];
                this._set_size_delta -= height;
            } else  if (ps > max){
                height = max;
                this._set_size_gravity -= sizes[4];
                this._set_size_delta -= height;
            } else {
                return -1;
            }
        }

        return height;
    },
    _responsive_hide:function(cell, mode){
        var target =  webix.$$(mode);

        if (target === "hide" || !target){
            cell.hide();
            webix.delay(this.resize, this);
            cell._responsive_marker = "hide";
        } else{
            //for SideBar in Webix 1.9
            if (!target)
                target = webix.ui({ view:"popup", body:[{}]});

            cell._responsive_width = cell._settings.width;
            cell._responsive_height = cell._settings.height;
            cell._responsive_marker = target._settings.id;
            cell._settings.width = 0;
            if (!cell._settings.height)
                cell._settings.autoheight = true;

            webix.ui(cell, target, this._responsive.length);
        }

        this._responsive.push(cell);
    },
    _responsive_show:function(cell){
        var target = cell._responsive_marker;
        cell._responsive_marker = 0;

        if (target === "hide" || !target){
            cell.show();
            webix.delay(this.resize, this);
        } else {
            cell._settings.width = cell._responsive_width;
            cell._settings.height = cell._responsive_height;
            delete cell._settings.autoheight;

            webix.ui(cell, this, 0);
        }
        this._responsive.pop();
    },
    _responsive_cells:function(x,y){
        if (this._responsive_tinkery) return;
        this._responsive_tinkery = true;

        if (x < this._desired_size[0]){
            for (var i = 0; i < this._cells.length-1; i++){
                var cell = this._cells[i];
                if (!cell._responsive_marker){
                    this._responsive_hide(cell, this._settings.responsive);
                    break;
                }
            }
        } else  if (this._responsive.length){
            var cell = this._responsive[this._responsive.length-1];
            var dx = cell._responsive_marker == "hide" ? 0 : cell._responsive_width;
            var px = cell.$getSize(dx,0);
            if (px[0] + this._desired_size[0] + this._paddingX + 20 <= x )
                this._responsive_show(cell);
        }

        this._responsive_tinkery = false;
    },
    _set_child_size:function(x,y){
        webix._child_sizing_active = (webix._child_sizing_active||0)+1;

        if (this._settings.responsive)
            this._responsive_cells(x,y);

        this._set_size_delta = (this._vertical_orientation?y:x) - this._master_size[0];
        this._set_size_gravity = this._master_size[2];
        var width = x; var height = y;

        var auto = [];
        for (var i=0; i < this._cells.length; i++){
            //ignore hidden cells
            if (this._cells[i]._settings.hidden)
                continue;

            var sizes = this._sizes[i];

            if (this._vertical_orientation){
                var height = this._set_child_size_a(sizes,2,3);
                if (height < 0)	{ auto.push(i); continue; }
            } else {
                var width = this._set_child_size_a(sizes,0,1);
                if (width < 0)	{ auto.push(i); continue; }
            }
            this._cells[i].$setSize(width,height);
        }

        for (var i = 0; i < auto.length; i++){
            var index = auto[i];
            var sizes = this._sizes[index];
            var dx = Math.round(this._set_size_delta * sizes[4]/this._set_size_gravity);
            this._set_size_delta -= dx; this._set_size_gravity -= sizes[4];
            if (this._vertical_orientation)
                height = dx;
            else {
                width = dx;

            }

            this._cells[index].$setSize(width,height);
        }

        webix._child_sizing_active -= 1;
    },
    _next:function(obj, mode){
        var index = this.index(obj);
        if (index == -1) return null;
        return this._cells[index+mode];
    },
    _first:function(){
        return this._cells[0];
    }
}, webix.EventSystem, webix.ui.baseview);

module.exports = webix;