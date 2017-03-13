import default_skin from "./webix-resizer.scss";

var webix = require("./webix-resizearea");

webix.protoUI({
    name:"resizer",
    defaults:{
        width:7, height:7
    },
    $init:function(config){
        this._skin = config.skin;
        
        webix.assert(this.getParentView(), "Resizer can't be initialized outside a layout");
        this._viewobj.className += " webix_resizer";
        var space = this.getParentView()._margin;

        webix.event(this._viewobj, webix.env.mouse.down, this._rsDown, {bind:this});
        webix.event(document.body, webix.env.mouse.up, this._rsUp, {bind:this});

        var dir = this._getResizeDir();

        this._rs_started = false;
        this._resizer_dir = dir;

        this._resizer_dim = (dir=="x"?"width":"height");

        if (dir=="x")
            config.height = 0;
        else
            config.width = 0;

        if (space>0){
            this._viewobj.className += " webix_resizer_v"+dir;
            this._viewobj.style.marginRight = "-"+space+"px";
            if (dir == "x")
                config.width = space;
            else
                config.height = space;
            this.$nospace = true;
        } else{
            var resizer_class = "webix_resizer_"+dir
            this._viewobj.className += " " + resizer_class;
            this._viewobj.className += this._addSkinCss(resizer_class);
        }

        this._viewobj.innerHTML = "<div class='webix_resizer_content'></div>";
        if (dir == "y" && space>0) this._viewobj.style.marginBottom = "-"+(config.height||this.defaults.height)+"px";
    },
    _rsDown:function(e){
        var cells = this._getResizerCells();
        //some sibling can block resize
        if(cells && !this._settings.disabled){
            e = e||event;
            this._rs_started = true;
            this._rs_process = webix.html.pos(e);
            this._rsLimit = [];
            this._rsStart(e, cells[0]);
        }
    },
    _rsUp:function(){
        this._rs_started = false;
        this._rs_process = false;
    },
    _rsStart:function(e, cell){
        var dir,offset, pos,posParent,start;
        e = e||event;
        dir = this._resizer_dir;

        /*layout position:relative to place absolutely positioned elements in it*/
        this.getParentView()._viewobj.style.position = "relative";
        pos = webix.html.offset(this._viewobj);
        posParent = webix.html.offset(this.getParentView()._viewobj);
        start = pos[dir]-posParent[dir];
        offset = webix.html.offset(cell.$view)[dir]- webix.html.offset(this.getParentView().$view)[dir];

        this._rs_progress = [dir,cell, start, offset];
        /*resizer stick (resizerea ext)*/

        this._resizeStick = new webix.ui.resizearea({
            container:this.getParentView()._viewobj,
            dir:dir,
            eventPos:this._rs_process[dir],
            start:start-1,
            height: this.$height,
            width: this.$width,
            border: 1,
            margin: this.getParentView()["_padding"+dir.toUpperCase()]
        });

        /*stops resizing on stick mouseup*/
        this._resizeStick.attachEvent("onResizeEnd", webix.bind(this._rsEnd, this));
        /*needed to stop stick moving when the limit for dimension is reached*/
        this._resizeStick.attachEvent("onResize", webix.bind(this._rsResizeHandler, this));

        webix.html.addCss(document.body,"webix_noselect",1);
    },
    _getResizeDir: function(){
        return this.getParentView()._vertical_orientation?"y":"x";
    },
    _rsResizeHandler:function(){
        var cells,config,cDiff,diff,dir,i,limits,limitSizes,sizes,totalSize;
        if(this._rs_progress){
            cells = this._getResizerCells();
            dir = this._rs_progress[0];
            /*vector distance between resizer and stick*/
            diff = this._resizeStick._last_result -this._rs_progress[2];
            /*new sizes for the resized cells, taking into account the stick position*/
            sizes = this._rsGetDiffCellSizes(cells,dir,diff);
            /*sum of cells dimensions*/
            totalSize = cells[0]["$"+this._resizer_dim]+cells[1]["$"+this._resizer_dim];
            /*max and min limits if they're set*/
            limits = (dir=="y"?["minHeight","maxHeight"]:["minWidth","maxWidth"]);
            for(i=0;i<2;i++){
                config = cells[i]._settings;
                cDiff = (i?-diff:diff);/*if cDiff is positive, the size of i cell is increased*/
                /*if size is bigger than max limit or size is smaller than min limit*/
                var min = config[limits[0]];
                var max = config[limits[1]];

                if(cDiff>0&&max&&max<=sizes[i] || cDiff<0&&(min||3)>=sizes[i]){
                    this._rsLimit[i] = (cDiff>0?max:(min||3));
                    /*new sizes, taking into account max and min limits*/
                    limitSizes = this._rsGetLimitCellSizes(cells,dir);
                    /*stick position*/
                    this._resizeStick._dragobj.style[(dir=="y"?"top":"left")] = this._rs_progress[3] + limitSizes[0]+"px";
                    return;
                }else if(sizes[i]<3){/*cells size can not be less than 1*/
                    this._resizeStick._dragobj.style[(dir=="y"?"top":"left")] = this._rs_progress[3] + i*totalSize+1+"px";
                }else{
                    this._rsLimit[i] = null;
                }
            }
        }
    },
    _getResizerCells:function(){
        var cells,i;
        cells = this.getParentView()._cells;
        for(i=0; i< cells.length;i++){
            if(cells[i]==this){
                if (!cells[i-1] || cells[i-1]._settings.$noresize) return null;
                if (!cells[i+1] || cells[i+1]._settings.$noresize) return null;
                return [cells[i-1],cells[i+1]];
            }
        }
    },
    _rsEnd:function(result){
        if (typeof result == "undefined") return;

        var cells,dir,diff,i,size;
        var vertical = this.getParentView()._vertical_orientation;
        this._resizerStick = null;
        if (this._rs_progress){
            dir = this._rs_progress[0];
            diff = result-this._rs_progress[2];
            cells = this._getResizerCells();
            if(cells[0]&&cells[1]){
                /*new cell sizes*/
                size = this._rsGetCellSizes(cells,dir,diff);

                for (var i=0; i<2; i++){
                    //cell has not fixed size, of fully fixed layout
                    var cell_size = cells[i].$getSize(0,0);
                    if (vertical?(cell_size[2] == cell_size[3]):(Math.abs(cell_size[1]-cell_size[0])<3)){
                        /*set fixed sizes for both cells*/
                        cells[i]._settings[this._resizer_dim]=size[i];
                        if (cells[i]._bubble_size)
                            cells[i]._bubble_size(this._resizer_dim, size[i], vertical);
                    } else {
                        var actualSize = cells[i].$view[vertical?"offsetHeight":"offsetWidth"];//cells[i]["$"+this._resizer_dim];
                        cells[i]._settings.gravity = size[i]/actualSize*cells[i]._settings.gravity;
                    }
                }

                cells[0].resize();

                for (var i = 0; i < 2; i++)
                    if (cells[i].callEvent)
                        cells[i].callEvent("onViewResize",[]);
                webix.callEvent("onLayoutResize", [cells]);
            }
            this._rs_progress = false;
        }
        this._rs_progress = false;
        this._rs_started = false;
        this._rsLimit = null;
        webix.html.removeCss(document.body,"webix_noselect");
    },
    _rsGetLimitCellSizes: function(cells){
        var size1,size2,totalSize;
        totalSize = cells[0]["$"+this._resizer_dim]+cells[1]["$"+this._resizer_dim];
        if(this._rsLimit[0]){
            size1 = this._rsLimit[0];
            size2 = totalSize-size1;
        }
        else if(this._rsLimit[1]){
            size2 = this._rsLimit[1];
            size1 = totalSize-size2;
        }
        return [size1,size2];
    },
    _rsGetDiffCellSizes:function(cells,dir,diff){
        var sizes =[];
        var styleDim = this._resizer_dim=="height"?"offsetHeight":"offsetWidth";
        for(var i=0;i<2;i++)
            sizes[i] = cells[i].$view[styleDim]+(i?-1:1)*diff;
        return sizes;
    },
    _rsGetCellSizes:function(cells,dir,diff){
        var i,sizes,totalSize;
        /*if max or min dimentsions are set*/
        if(this._rsLimit[0]||this._rsLimit[1]){
            sizes = this._rsGetLimitCellSizes(cells,dir);
        }
        else{
            sizes = this._rsGetDiffCellSizes(cells,dir,diff);
            for(i =0; i<2;i++ ){
                /*if stick moving is stopped outsize cells borders*/
                if(sizes[i]<0){
                    totalSize = sizes[0]+sizes[1];
                    sizes[i] =1;
                    sizes[1-i] = totalSize-1;
                }
            }

        }
        return sizes;
    }
}, webix.MouseEvents, webix.ui.view);

module.exports = webix;