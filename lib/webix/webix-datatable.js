import default_skin from "./webix-datatable.scss";

var webix = require("./webix-vscroll");

webix.protoUI({
    name:"datatable",
    defaults:{
        leftSplit:0,
        rightSplit:0,
        columnWidth:100,
        minColumnWidth:20,
        minColumnHeight:26,
        prerender:false,
        autoheight:false,
        autowidth:false,
        header:true,
        fixedRowHeight:true,
        scrollAlignY:true,
        scrollX:true,
        scrollY:true,
        datafetch:50,
        hover: true,
        rowLineHeight: 34,
        dragDisplayColumns: "",
        headerRowHeight: 0,
        rowHeight: 34
    },

    $skin:function(){
        var height = webix.skin.$active.rowHeight;
        var defaults = this.defaults;
        defaults.rowHeight = height;
        defaults.headerRowHeight = webix.skin.$active.barHeight;
    },
    on_click:{
        webix_richfilter:function(){
            return false;
        },
        webix_table_checkbox:function(e, id){
            id = this.locate(e);

            var item = this.getItem(id.row);
            var col = this.getColumnConfig(id.column);
            var trg = e.target|| e.srcElement;

            //read actual value from HTML tag when possible
            //as it can be affected by dbl-clicks
            var check = (trg.type == "checkbox")?trg.checked:(item[id.column] != col.checkValue);
            var value =  check ? col.checkValue : col.uncheckValue;

            item[id.column] = value;

            this.callEvent("onCheck", [id.row, id.column, value]);
            this.data.callEvent("onDataUpdate", [id, item]);
            this.data.callEvent("onStoreUpdated", [id.row, item, (this._settings.checkboxRefresh?"update":"save")]);
            return false;
        },
        webix_table_radio:function(e){
            var id = this.locate(e);

            var item = this.getItem(id.row);
            var col = this.getColumnConfig(id.column);

            var checked = 0;
            this.eachRow(function(rowid){
                var item = this.data.pull[rowid];
                if (item && item[id.column] == col.checkValue)
                    item[id.column] = col.uncheckValue;
            });

            item[id.column] = col.checkValue;

            this.callEvent("onCheck", [id.row, id.column, true]);
            this.refresh();
            return false;
        }
    },
    on_dblclick:{
        webix_table_checkbox: function(){
            return this.on_click.webix_table_checkbox.apply(this,arguments);
        }
    },
    on_context:{
    },
    $init:function(config){
        this._skin = config.skin;
        this._text_overflow_type = config.text_overflow_type;
        
        this.on_click = webix.extend({}, this.on_click);
        var html  = "<div class='webix_ss_header";
        html += this._addSkinCss("webix_ss_header");
      
        html +="'><div class='webix_hs_left'></div><div class='webix_hs_center'></div><div class='webix_hs_right'></div></div><div class='webix_ss_body'><div class='webix_ss_left'><div class='webix_ss_center_scroll'></div></div>";
        html += "<div class='webix_ss_center'><div class='webix_ss_center_scroll'></div></div>";
        html += "<div class='webix_ss_right' ><div class='webix_ss_center_scroll'></div></div></div>";
        html += "<div class='webix_ss_hscroll'></div><div class='webix_ss_footer'><div class='webix_hs_left'></div><div class='webix_hs_center'></div><div class='webix_hs_right'></div></div><div class='webix_ss_vscroll_header";
        
        html += this._addSkinCss("webix_ss_vscroll_header");
        html += "'></div><div class='webix_ss_vscroll'></div><div class='webix_ss_vscroll_footer'></div>";

        this._contentobj.innerHTML = html;
        this._top_id = this._contentobj.id = this.name+webix.uid();
        this._contentobj.className +=" webix_dtable";

        this._dataobj = this._contentobj;

        this._header = this._contentobj.firstChild;
        this._body = this._header.nextSibling;
        this._footer = this._body.nextSibling.nextSibling;

        this.data.provideApi(this, true);
        this.data.attachEvent("onParse", webix.bind(this._call_onparse, this));

        this.$ready.push(this._first_render);

        this._columns = [];
        this._headers = [];
        this._footers = [];
        this._rows_cache = [];
        this._active_headers = {};
        this._filter_elements = {};
        this._header_height = this._footer_height = 0;

        //component can create new view
        this._destroy_with_me = [];

        this.data.attachEvent("onServerConfig", webix.bind(this._config_table_from_file, this));
        this.data.attachEvent("onServerOptions", webix.bind(this._config_options_from_file, this));
        this.attachEvent("onViewShow", this._restore_scroll_state);

        webix.callEvent("onDataTable", [this, config]);
    },
    _render_initial:function(){
        this._scrollSizeX = this._scrollSizeY = webix.ui.scrollSize;

        webix.html.addStyle("#"+this._top_id +" .webix_cell { height:"+this._settings.rowHeight+"px; line-height:"+(this._settings.rowLineHeight || this._settings.rowHeight)+"px;" +(this._settings.fixedRowHeight?"":"white-space:normal;")+" }");
        webix.html.addStyle("#"+this._top_id +" .webix_hcell { height:"+this._settings.headerRowHeight+"px; line-height:"+this._settings.headerRowHeight+"px;}");
        this._render_initial = function(){};
    },
    _first_render:function(){
        this.data.attachEvent("onStoreLoad", webix.bind(this._refresh_any_header_content, this));
        this.data.attachEvent("onSyncApply", webix.bind(this._refresh_any_header_content, this));
        this.data.attachEvent("onStoreUpdated", webix.bind(function(){ return this.render.apply(this, arguments); }, this));
        this.data.attachEvent("onStoreUpdated", webix.bind(this._refresh_tracking_header_content, this));
        this.render();
    },
    refresh:function(){
        this.render();
    },
    render:function(id, data, mode){
        //pure data saving call
        if (mode == "save") return;
        //during dnd we must not repaint anything in mobile webkit
        if (mode == "move"){
            var context = webix.DragControl.getContext();
            if (context && context.fragile) return;
        }

        if (!this._columns.length){
            var cols = this._settings.columns;
            if (!cols || !cols.length) {
                if (this._settings.autoConfig && this.data.order.length){
                    this._dtable_fully_ready = 0;
                    this._autoDetectConfig();
                } else
                    return;
            }
            this._define_structure();
        }

        if (!this.isVisible(this._settings.id) || this.$blockRender)
            return this._render_initial(); //Chrome 34, Custom Font loading bug

        //replace multiple atomic updates by single big repaint
        if (id && data != -1 && (mode == "paint" || mode == "update")){
            if (this._render_timer)
                clearTimeout(this._render_timer);

            if (!this._render_timer || this._render_timer_id == id){
                this._render_timer_id = id;
                this._render_timer = webix.delay(function(){
                    //if only one call - repaint single item
                    this.render(id, -1, mode);
                }, this);
            } else {
                this._render_timer_id = null;
                this._render_timer = webix.delay(function(){
                    //if ther was a serie of calls - replace them with single full repaint
                    this.render();
                }, this);
            }
            return;
        } else if (this._render_timer){
            clearTimeout(this._render_timer);
            this._render_timer = 0;
        }

        if (this.callEvent("onBeforeRender",[this.data])){

            this._render_initial();
            if (!this._dtable_fully_ready)
                this._apply_headers();

            if (this._content_width){
                if (this["_settings"].experimental && (mode == "paint" || mode == "update") && id)
                    this._repaint_single_row(id);
                else
                    this._check_rendered_cols(true, true);
            }

            if (!id || mode!="update"){
                this._dtable_height = this._get_total_height();
                this._set_split_sizes_y();
            }

            this.callEvent("onAfterRender",[this.data]);
            return true;
        }
    },
    getColumnConfig:function(id){
        return this._columns_pull[id] || this._hidden_column_hash[id];
    },
    _config_options_from_file:function(colls){
        for (var key in colls){
            var column = this.getColumnConfig(key);
            webix.assert(column, "Orphan collection: "+key);
            var temp = new webix.DataCollection({
                data:colls[key]
            });
            this._destroy_with_me.push(temp);
            this._bind_collection(temp, column);
        }
    },
    //xml has different configuration structure, fixing
    _config_table_from_file:function(config){
        if (config.columns && this._dtable_fully_ready)
            this.refreshColumns(null, true);
    },
    _define_structure:function(){
        if (this._settings.columns){
            this._columns = this._settings.columns;
            this._columns_pull = {};

            for (var i = 0; i < this._columns.length; i++){
                var col = this._columns[i];
                this._columns_pull[col.id] = col;

                var format = col.cssFormat;
                if (format)
                    col.cssFormat = webix.toFunctor(format, this.$scope);

                col.width = col.width||this._settings.columnWidth;
                if (typeof col.format == "string")
                    col.format = webix.i18n[col.format]||window[col.format];

                //default settings for checkboxes and radios
                if (webix.isUndefined(col.checkValue)) col.checkValue = 1;
                if (webix.isUndefined(col.uncheckValue)) col.uncheckValue = 0;

                if (col.css && typeof col.css == "object")
                    col.css = webix.html.createCss(col.css);

                var template = col.template;
                if (template){
                    if (typeof template == "string")
                        template = template.replace(/#\$value#/g,"#"+col.id+"#");
                    col.template = webix.template(template);
                }
            }
            this._normalize_headers("header", this._headers);
            this._normalize_headers("footer", this._footers);

            this.callEvent("onStructureLoad",[]);
        }
    },
    _define_structure_and_render:function(){
        this._apply_headers();
    },
    _apply_headers:function(){
        this._rightSplit = this._columns.length-this._settings.rightSplit;
        this._dtable_width = 0;

        for (var i = 0; i < this._columns.length; i++){
            if (!this._columns[i].node){

                var temp = webix.html.create("DIV");
                temp.style.width = this._columns[i].width + "px";
                this._columns[i].node = temp;
            }
            if (i>=this._settings.leftSplit && i<this._rightSplit)
                this._dtable_width += this._columns[i].width;
        }

        var marks = [];

        if (this._settings.rightSplit){
            var nr = this._columns.length-this._settings.rightSplit;
            marks[nr]  =" webix_first";
            marks[nr-1]=" webix_last" + this._addSkinCss("webix_last");
        }
        if (this._settings.leftSplit){
            var nl = this._settings.leftSplit;
            marks[nl]  =" webix_first";
            marks[nl-1]=" webix_last" + this._addSkinCss("webix_last");
        }
        marks[0]  = (marks[0]||"")+" webix_first";
        var last_index = this._columns.length-1;
        marks[last_index] = (marks[last_index]||"")+" webix_last" + this._addSkinCss("webix_last");


        for (var i=0; i<this._columns.length; i++){
            var node = this._columns[i].node;
            node.setAttribute("column", i);
            node.className = "webix_column "+(this._columns[i].css||"")+(marks[i]||'');

            if(this._skin && this._skin['webix_column']){
                node.className += ' ' + this._skin['webix_column'];
            }
        }

        this._create_scrolls();

        this._set_columns_positions();
        this._set_split_sizes_x();
        this._render_header_and_footer();

        this._dtable_fully_ready = true;
    },
    _set_columns_positions:function(){
        var left = 0;
        for (var i = 0; i < this._columns.length; i++){
            var column = this._columns[i];
            if (i == this._settings.leftSplit || i == this._rightSplit)
                left = 0;

            if (column.node){
                column.node.style.left = left+"px";
                if (this._settings.leftSplit || this._settings.rightSplit){
                    webix.html.remove(column.node);
                    column.attached = false;
                }
            }
            left += column.width;
        }
    },
    _render_header_and_footer:function(){
        if (!this._header_fix_width)
            this._header_fix_width = 0;

        this._header_height = this._footer_height = 0;
        if (this._settings.header) {
            this._refreshHeaderContent(this._header, 0, 1);
            this._normalize_headers("header", this._headers);
            this._header_height = this._headers._summ;
            this._render_header_section(this._header, "header", this._headers);
        }
        if (this._settings.footer){
            this._refreshHeaderContent(this._footer, 0, 1);
            this._normalize_headers("footer", this._footers);
            this._footer_height = this._footers._summ;
            this._render_header_section(this._footer, "footer", this._footers);
        }

        this.refreshHeaderContent(false, false);
        this._size_header_footer_fix();

        if (this._last_sorted)
            this.markSorting(this._last_sorted, this._last_order);
    },
    _normalize_headers:function(collection, heights){
        var rows = 0;

        for (var i=0; i<this._columns.length; i++){
            var data = this._columns[i][collection];
            if (!data || typeof data != "object" || !data.length){
                if (webix.isUndefined(data)){
                    if (collection == "header")
                        data = this._columns[i].id;
                    else
                        data = "";
                }
                data = [data];
            }
            for (var j = 0; j < data.length; j++){
                if (typeof data[j] != "object")
                    data[j] = { text:data[j] };
                if (data[j] && data[j].height) heights[j] = data[j].height;
            }
            rows = Math.max(rows, data.length);
            this._columns[i][collection] = data;
        }


        heights._summ = rows;
        for (var i = rows-1; i >= 0; i--){
            heights[i] = heights[i] || this._settings.headerRowHeight;
            heights._summ += heights[i]*1;
        }

        //set null to cells included in col|row spans
        for (var i=0; i<this._columns.length; i++){
            var col = this._columns[i][collection];
            for (var j=0; j<col.length; j++){
                if (col[j] && col[j].rowspan)
                    for (var z=1; z<col[j].rowspan; z++)
                        col[j+z] = null;
                if (col[j] && col[j].colspan)
                    for (var z=1; z<col[j].colspan; z++)
                        this._columns[i+z][collection][j] = null;
            }
        }

        //auto-rowspan cells, which has not enough header lines
        for (var i=0; i<this._columns.length; i++){
            var data = this._columns[i][collection];
            if (data.length < rows){
                var end = data.length-1;
                data[end].rowspan = rows - data.length + 1;
                for (var j=end+1; j<rows; j++)
                    data[j]=null;
            }
        }
        return rows;
    },
    _find_header_content:function(sec, id){
        var alltd = sec.getElementsByTagName("TD");
        for (var i = 0; i < alltd.length; i++)
            if (alltd[i].getAttribute("active_id") == id)
                return alltd[i];
    },
    getHeaderContent:function(id){
        var obj = this._find_header_content(this._header, id);
        if (!obj)
            obj = this._find_header_content(this._footer, id);

        if (obj){
            var config = this._active_headers[id];
            var type = webix.ui.datafilter[config.content];

            if (type.getHelper) return type.getHelper(obj, config);
            return {
                type: type,
                getValue:function(){ return type.getValue(obj); },
                setValue:function(value){ return type.setValue(obj, value); }
            };
        }
    },
    _summ_next:function(heights, start, i){
        var summ = i ? -1 : 0;

        i += start;
        for (start; start<i; start++)
            summ+=heights[start] + 1;

        return summ;
    },
    _render_subheader:function(start, end, width, name, heights){
        if (start == end) return "";

        var html = "<table style='width:"+width+"px' cellspacing='0' cellpadding='0'>";
        for (var i = start; i < end; i++){
            html += "<tr>";
            for (var i = start; i < end; i++)
                html += "<th  style='width:"+this._columns[i].width+"px'></th>";
            html += "</tr>";
        }

        var count = this._columns[0][name].length;
        var block_evs = [];

        for (var j = 0; j < count; j++){
            html += "<tr section='"+name+"'>";
            for (var i = start; i < end; i++){
                var header = this._columns[i][name][j];
                if (header === null) continue;

                if (header.content){
                    header.contentId = header.contentId||webix.uid();
                    header.columnId = this._columns[i].id;
                    header.format = this._columns[i].format;

                    webix.assert(webix.ui.datafilter, "Filtering extension was not included");
                    webix.assert(webix.ui.datafilter[header.content], "Unknown content type: "+header.content);

                    header.text = webix.ui.datafilter[header.content].render(this, header);
                    this._active_headers[header.contentId] = header;
                    this._has_active_headers = true;
                }

                html += "<td column='"+(header.colspan?(header.colspan-1+i):i)+"'";

                var hcss = '';
                if (i==start)
                    hcss+="webix_first";
                var column_pos = i + (header.colspan?header.colspan-1:0);
                if (column_pos>=end-1)
                    hcss+=" webix_last" + this._addSkinCss("webix_last");
                if (hcss)
                    html+=' class="'+hcss+'"';

                var cell_height = heights[j];
                var sheight="";
                if (header.contentId)
                    html+=" active_id='"+header.contentId+"'";
                if (header.colspan)
                    html+=" colspan='"+header.colspan+"'";
                if (header.rowspan){
                    html+=" rowspan='"+header.rowspan+"'";
                    cell_height = this._summ_next(this._headers, j, header.rowspan);
                }

                if (cell_height != this._settings.headerRowHeight)
                    sheight =" style='line-height:"+cell_height+"px; height:"+cell_height+"px;'";

                var css ="webix_hcell";
                css += this._addSkinCss("webix_hcell");
                var header_css = header.css;
                if (header_css){
                    if (typeof header_css == "object")
                        header.css = header_css = webix.html.createCss(header_css);
                    css+=" "+header_css;
                }
                if (this._columns[i].$selected)
                    css += " webix_sel_hcell";
                var align ="";
                if (this._columns[i].align)
                    align = " style='text-align:"+this._columns[i].align+";'";

                html+="><div class='"+css+"'"+sheight+align+">";

                var text = (header.text===""?"&nbsp;":header.text);
                if (header.rotate)
                    text = "<div class='webix_rotate' style='width:"+(cell_height-10)+"px; transform-origin:center "+(cell_height-15)/2+"px;-webkit-transform-origin:center "+(cell_height-15)/2+"px;'>"+text+"</div>";

                html += text + "</div></td>";
            }
            html += "</tr>";
        }
        html+="</tr></table>";

        return html;
    },
    showItemByIndex:function(row_ind, column_ind){
        var pager = this._settings.pager;
        if (pager){
            var target = Math.floor(row_ind/pager.size);
            if (target != pager.page)
                webix.$$(pager.id).select(target);
        }

        //parameter will be set to -1, to mark that scroll need not to be adjusted
        if (row_ind != -1){
            var state = this._get_y_range();
            if (row_ind < state[0]+1 || row_ind >= state[1]-1 ){
                //not visible currently
                var summ = this._getHeightByIndexSumm((pager?this.data.$min:0),row_ind);
                if (row_ind < state[0]+1){
                    //scroll top - show row at top of screen
                    summ = Math.max(0, summ-1);
                } else {
                    //scroll bottom - show row at bottom of screen
                    summ += this._getHeightByIndex(row_ind) - this._dtable_offset_height;
                    //because of row rounding we neet to scroll some extra
                    //TODO: create a better heuristic
                    if (row_ind>0)
                        summ += this._getHeightByIndex(row_ind-1)-1;
                }
                this._y_scroll.scrollTo(summ);
            }
        }
        if (column_ind != -1){
            //ignore split columns - they are always visible
            if (column_ind < this._settings.leftSplit) return;
            if (column_ind >= this._rightSplit) return;

            //very similar to y-logic above
            var state = this._get_x_range();
            if (column_ind < state[0]+1 || column_ind >= state[1]-1 ){
                //not visible currently
                var summ = 0;
                for (var i=this._settings.leftSplit; i<column_ind; i++)
                    summ += this._columns[i].width;

                /*jsl:ignore*/
                if (column_ind < state[0]+1){
                    //scroll to left border
                } else {
                    //scroll to right border
                    summ += this._columns[column_ind].width - this._center_width;
                }
                /*jsl:end*/
                this._x_scroll.scrollTo(summ);
            }
        }
    },
    showCell:function(row, column){
        if (!column || !row){
            //if column or row not provided - take from current selection
            var t=this.getSelectedId(true);
            if (t.length == 1){
                column = column || t[0].column;
                row = row || t[0].row;
            }
        }
        //convert id to index
        column = column?this.getColumnIndex(column):-1;
        row = row?this.getIndexById(row):-1;
        this.showItemByIndex(row, column);

    },
    scrollTo:function(x,y){
        if (!this._x_scroll) return;
        if (this._scrollTo_touch)
            return this._scrollTo_touch(x,y);

        if (x !== null)
            this._x_scroll.scrollTo(x);
        if (y !== null)
            this._y_scroll.scrollTo(y);
    },
    getScrollState:function(){
        if (this._getScrollState_touch)
            return this._getScrollState_touch();

        var diff =  this._render_scroll_shift?0:(this._render_scroll_diff||0);
        return {x:(this._scrollLeft||0), y:(this._scrollTop + diff)};
    },
    showItem:function(id){
        this.showItemByIndex(this.getIndexById(id), -1);
    },
    _render_header_section:function(sec, name, heights){
        sec.childNodes[0].innerHTML = this._render_subheader(0, this._settings.leftSplit, this._left_width, name, heights);
        sec.childNodes[1].innerHTML = this._render_subheader(this._settings.leftSplit, this._rightSplit, this._dtable_width, name, heights);
        sec.childNodes[1].onscroll = webix.bind(this._scroll_with_header, this);
        sec.childNodes[2].innerHTML = this._render_subheader(this._rightSplit, this._columns.length, this._right_width, name, heights);
    },
    _scroll_with_header:function(){
        var active = this.getScrollState().x;
        var header = this._header.childNodes[1].scrollLeft;
        if (header != active)
            this.scrollTo(header, null);
    },
    _refresh_tracking_header_content:function(){
        this.refreshHeaderContent(true, true);
    },
    _refresh_any_header_content:function(){
        this.refreshHeaderContent(false, true);
    },
    //[DEPRECATE] - v3.0, move to private
    refreshHeaderContent:function(trackedOnly, preserve, id){
        if (this._settings.header){
            if (preserve) this._refreshHeaderContent(this._header, trackedOnly, 1, id);
            this._refreshHeaderContent(this._header, trackedOnly, 0, id);
        }
        if (this._settings.footer){
            if (preserve) this._refreshHeaderContent(this._footer, trackedOnly, 1, id);
            this._refreshHeaderContent(this._footer, trackedOnly, 0, id);
        }
    },
    refreshFilter:function(id){
        if (id && !this._active_headers[id]) return;
        this.refreshHeaderContent(false, true, id);
    },
    _refreshHeaderContent:function(sec, cellTrackOnly, getOnly, byId){
        if (this._has_active_headers && sec){
            var alltd = sec.getElementsByTagName("TD");

            for (var i = 0; i < alltd.length; i++){
                if (alltd[i].getAttribute("active_id")){
                    var obj = this._active_headers[alltd[i].getAttribute("active_id")];
                    if (byId && byId != obj.columnId) continue;


                    var content = webix.ui.datafilter[obj.content];

                    if (getOnly){
                        if (content.getValue)
                            obj.value = content.getValue(alltd[i]);
                    } else if (!cellTrackOnly || content.trackCells){
                        content.refresh(this, alltd[i], obj);
                    }
                }
            }
        }
    },
    headerContent:[],
    _set_size_scroll_area:function(obj, height, hdx){
        if (this._scrollSizeY){

            obj.style.height = Math.max(height,1)-1+"px";
            obj.style.width = (this._rightSplit?0:hdx)+this._scrollSizeY-1+"px";

            // temp. fix: Chrome [DIRTY]
            if (webix.env.isWebKit)
                var w = obj.offsetWidth;
        } else
            obj.style.display = "none";
    },
    _size_header_footer_fix:function(){
        if (this._settings.header)
            this._set_size_scroll_area(this._header_scroll, this._header_height, this._header_fix_width);
        if (this._settings.footer)
            this._set_size_scroll_area(this._footer_scroll, this._footer_height, this._header_fix_width);
    },
    _update_scroll:function(x,y){
        var hasX = !(this._settings.autowidth || this._settings.scrollX === false);
        this._scrollSizeX =  hasX ? webix.ui.scrollSize : 0;
        var hasY = !(this._settings.autoheight || this._settings.scrollY === false);
        this._scrollSizeY = hasY ? webix.ui.scrollSize : 0;
        if (this._x_scroll){
            this._x_scroll._settings.scrollSize = this._scrollSizeX;
            this._x_scroll._settings.scrollVisible = hasX;
        }
        if (this._y_scroll){
            this._y_scroll._settings.scrollSize = this._scrollSizeY;
            this._y_scroll._settings.scrollVisible = hasY;
        }
    },
    _create_scrolls:function(){

        this._scrollTop = 0;
        this._scrollLeft = 0;
        var scrx, scry; scrx = scry = 1;

        if (this._settings.autoheight || this._settings.scrollY === false)
            scry = this._scrollSizeY = 0;
        if (this._settings.autowidth || this._settings.scrollX === false)
            scrx = this._scrollSizeX = 0;

        if (webix.env.touch) scrx = scry = 0;

        if (!this._x_scroll){
            this._x_scroll = new webix.ui.vscroll({
                container:this._footer.previousSibling,
                scrollWidth:this._dtable_width,
                scrollSize:this._scrollSizeX,
                scrollVisible:scrx
            });

            //fix for scroll space on Mac
            if (scrx && !this._scrollSizeX && !webix.env.$customScroll)
                this._x_scroll._viewobj.style.position="absolute";

            this._x_scroll.attachEvent("onScroll", webix.bind(this._onscroll_x, this));
        }

        if (!this._y_scroll){
            this._header_scroll = this._footer.nextSibling;
            var vscroll_view = this._header_scroll.nextSibling;
            this._footer_scroll = vscroll_view.nextSibling;

            this._y_scroll = new webix.ui.vscroll({
                container:vscroll_view,
                scrollHeight:100,
                scroll:"y",
                scrollSize:this._scrollSizeY,
                scrollVisible:scry
            });

            this._y_scroll.activeArea(this._body);
            this._x_scroll.activeArea(this._body, true);
            this._y_scroll.attachEvent("onScroll", webix.bind(this._onscroll_y, this));
        }

        if (this._content_width)
            this.callEvent("onResize",[this._content_width, this._content_height]);

        if (webix.env.$customScroll)
            webix.CustomScroll.enable(this);

        this._create_scrolls = function(){};
    },
    columnId:function(index){
        return this._columns[index].id;
    },
    getColumnIndex:function(id){
        for (var i = 0; i < this._columns.length; i++)
            if (this._columns[i].id == id)
                return i;
        return -1;
    },
    _getNodeBox:function(rid, cid){
        var xs=0, xe=0, ye=0, ys=0;
        var i; var zone = 0;
        for (i = 0; i < this._columns.length; i++){
            if (this._rightSplit == i || this._settings.leftSplit == i){
                xs=0; zone++;
            }
            if (this._columns[i].id == cid)
                break;
            xs+=this._columns[i].width;
        }
        xe+=this._columns[i].width;

        for (i = 0; i < this.data.order.length; i++){
            if (this.data.order[i] ==rid)
                break;
            ys+=this._getHeightByIndex(i);
        }
        ye+=this._getHeightByIndex(i);
        return [xs,xe,ys-this._scrollTop,ye, this._body.childNodes[zone]];
    },
    _id_to_string:function(){ return this.row; },
    locate:function(node, idOnly){
        if (this._settings.subview && this != webix.$$(node)) return null;

        node = node.target||node.srcElement||node;
        while (node && node.getAttribute){
            if (node.getAttribute("view_id"))
                break;
            var cs = node.className.toString();

            var pos = null;
            if (cs.indexOf("webix_cell")!=-1){
                pos = this._locate(node);
                if (pos)
                    pos.row = this.data.order[pos.rind];
            }
            if (cs.indexOf("webix_hcell")!=-1){
                pos = this._locate(node);
                if (pos)
                    pos.header = true;
            }

            if (pos){
                if (idOnly) return pos.header ? null : pos.row;
                pos.column = this._columns[pos.cind].id;
                pos.toString = this._id_to_string;
                return pos;
            }

            node = node.parentNode;
        }
        return null;
    },
    _locate:function(node){
        var cdiv = node.parentNode;
        if (!cdiv) return null;
        var column = (node.getAttribute("column") || cdiv.getAttribute("column"))*1;
        var row = node.getAttribute("row") || 0;
        if (!row)
            for (var i = 0; i < cdiv.childNodes.length; i++)
                if (cdiv.childNodes[i] == node)
                    row = i+this._columns[column]._yr0;

        return { rind:row, cind:column };
    },
    _updateColsSizeSettings:function(silent){
        if (!this._dtable_fully_ready) return;

        this._set_columns_positions();
        this._set_split_sizes_x();
        this._render_header_and_footer();

        if (!silent)
            this._check_rendered_cols(false, false);
    },
    setColumnWidth:function(col, width, skip_update){
        return this._setColumnWidth( this.getColumnIndex(col), width, skip_update);
    },
    _setColumnWidth:function(col, width, skip_update, by_user){
        if (isNaN(width)) return;
        var column = this._columns[col];

        if (column.minWidth && width < column.minWidth)
            width = column.minWidth;
        else if (width<this._settings.minColumnWidth)
            width = this._settings.minColumnWidth;

        var old = column.width;
        if (old !=width){
            if (col>=this._settings.leftSplit && col<this._rightSplit)
                this._dtable_width += width-old;

            column.width = width;
            if (column.node) //method can be called from onStructLoad
                column.node.style.width = width+"px";
            else
                return false;

            if(!skip_update)
                this._updateColsSizeSettings();

            this.callEvent("onColumnResize", [column.id, width, old, !!by_user]);
            return true;
        }
        return false;
    },
    _getRowHeight:function(row){
        return (row.$height || this._settings.rowHeight)+(row.$subopen?row.$subHeight:0);
    },
    _getHeightByIndex:function(index){
        var id = this.data.order[index];
        if (!id) return this._settings.rowHeight;
        return this._getRowHeight(this.data.pull[id]);
    },
    _getHeightByIndexSumm:function(index1, index2){
        if (this._settings.fixedRowHeight)
            return (index2-index1)*this._settings.rowHeight;
        else {
            var summ = 0;
            for (; index1<index2; index1++)
                summ += this._getHeightByIndex(index1);
            return summ;
        }
    },
    _cellPosition:function(row, column){
        if (arguments.length == 1){
            column = row.column; row = row.row;
        }
        var item = this.getItem(row);
        var config = this.getColumnConfig(column);
        var left = 0;
        var parent = 0;

        for (var index=0; index < this._columns.length; index++){
            if (index == this._settings.leftSplit || index == this._rightSplit)
                left = 0;
            var leftcolumn = this._columns[index];
            if (leftcolumn.id == column){
                var split_column = index<this._settings.leftSplit ? 0 :( index >= this._rightSplit ? 2 : 1);
                parent = this._body.childNodes[split_column].firstChild;
                break;
            }

            left += leftcolumn.width;
        }

        var max = this.data.order.length;
        var top = this._getHeightByIndexSumm((this._render_scroll_top||0),  this.getIndexById(row));

        return {
            parent: parent,
            top:	top + (this._render_scroll_shift||0),
            left:	left,
            width:	config.width,
            height:	(item.$height || this._settings.rowHeight)
        };
    },
    _get_total_height:function(){
        var pager  = this._settings.pager;
        var start = 0;
        var max = this.data.order.length;

        if (pager){
            start = pager.size * pager.page;
            max = Math.min(max, start + pager.size);
            if (pager.level){
                start = this.data.$min;
                max = this.data.$max;
            }
        }

        return this._getHeightByIndexSumm(start, max);
    },
    setRowHeight:function(rowId, height){
        if (isNaN(height)) return;
        if (height<this._settings.minColumnHeight)
            height = this._settings.minColumnHeight;

        var item = this.getItem(rowId);
        var old_height = item.$height||this._settings.rowHeight;

        if (old_height != height){
            item.$height = height;
            this.config.fixedRowHeight = false;
            this.render();
            this.callEvent("onRowResize", [rowId, height, old_height]);
        }
    },
    _onscroll_y:function(value){
        this._scrollTop = value;
        if (!this._settings.prerender){
            this._check_rendered_cols();
        }
        else {
            var conts = this._body.childNodes;
            for (var i = 0; i < conts.length; i++){
                conts[i].scrollTop = value;
            }
        }

        if (webix.env.$customScroll) webix.CustomScroll._update_scroll(this._body);
        this.callEvent("onScrollY",[]);
        this.callEvent("onAfterScroll",[]);
    },
    _onscroll_x:function(value){
        this._body.childNodes[1].scrollLeft = this._scrollLeft = value;
        if (this._settings.header)
            this._header.childNodes[1].scrollLeft = value;
        if (this._settings.footer)
            this._footer.childNodes[1].scrollLeft = value;
        if (this._settings.prerender===false)
            this._check_rendered_cols(this._minimize_dom_changes?false:true);

        if (webix.env.$customScroll) webix.CustomScroll._update_scroll(this._body);
        this.callEvent("onScrollX",[]);
        this.callEvent("onAfterScroll",[]);
    },
    _get_x_range:function(full){
        if (full) return [0,this._columns.length];

        var t = this._scrollLeft;

        var xind = this._settings.leftSplit;
        while (t>0){
            t-=this._columns[xind].width;
            xind++;
        }
        var xend = xind;
        if (t) xind--;

        t+=this._center_width;
        while (t>0 && xend<this._rightSplit){
            t-=this._columns[xend].width;
            xend++;
        }

        return [xind, xend];
    },
    getVisibleCount:function(){
        return Math.floor((this._dtable_offset_height) / this.config.rowHeight);
    },
    //returns info about y-scroll position
    _get_y_range:function(full){
        var t = this._scrollTop;
        var start = 0;
        var end = this.count();

        //apply pager, if defined
        var pager = this._settings.pager;
        if (pager){
            var start = pager.page*pager.size;
            var end = Math.min(end, start+pager.size);
            if (pager.level){
                start = this.data.$min;
                end = this.data.$max;
            }
        }

        //in case of autoheight - request full rendering
        if (this._settings.autoheight)
            return [start, end, 0];




        if (full) return [start, end, 0];
        var xind = start;
        var rowHeight = this._settings.fixedRowHeight?this._settings.rowHeight:0;
        if (rowHeight){
            var dep = Math.ceil(t/rowHeight);
            t -= dep*rowHeight;
            xind += dep;
        } else
            while (t>0){
                t-=this._getHeightByIndex(xind);
                xind++;
            }

        //how much of the first cell is scrolled out
        var xdef = (xind>0 && t)?-(this._getHeightByIndex(xind-1)+t):0;
        var xend = xind;
        if (t) xind--;

        t+=(this._dtable_offset_height||this._content_height);

        if (rowHeight){
            var dep = Math.ceil(t/rowHeight);
            t-=dep*rowHeight;
            xend+=dep;

            if (xend>end)
                xend = end;
        } else
            while (t>0 && xend<end){
                t-=this._getHeightByIndex(xend);
                xend++;
            }

        return [xind, xend, xdef];
    },
    _repaint_single_row:function(id){
        var item = this.getItem(id);
        var rowindex = this.getIndexById(id);

        var state = this._get_y_range();
        //row not visible
        if (rowindex < state[0] || rowindex >= state[1]) return;

        //get visible column
        var x_range = this._get_x_range();
        for (var i=0; i<this._columns.length; i++){
            var column = this._columns[i];

            //column not visible
            if (i < this._rightSplit && i >= this._settings.leftSplit && ( i<x_range[0] || i > x_range[1]))
                column._yr0 = -999; //ensure that column will not be reused

            if (column.attached && column.node){
                var node =  column.node.childNodes[rowindex-state[0]];
                var value = this._getValue(item, this._columns[i], 0);

                node.innerHTML = value;
                node.className = this._getCss(this._columns[i], value, item, id);
            }
        }
    },
    _check_rendered_cols:function(x_scroll, force){
        if (!this._columns.length) return;

        if (force)
            this._clearColumnCache();

        if (webix.debug_render)
            webix.log("Render: "+this.name+"@"+this._settings.id);


        var xr = this._get_x_range(this._settings.prerender);
        var yr = this._get_y_range(this._settings.prerender === true);

        if (x_scroll){
            for (var i=this._settings.leftSplit; i<xr[0]; i++)
                this._hideColumn(i, force);
            for (var i=xr[1]; i<this._rightSplit; i++)
                this._hideColumn(i, force);
        }

        this._render_full_rows = [];
        var rendered = 0;

        for (var i=0; i<this._settings.leftSplit; i++)
            rendered += this._renderColumn(i,yr,force);
        for (var i=xr[0]; i<xr[1]; i++)
            rendered += this._renderColumn(i,yr,force, i == xr[0]);
        for (var i=this._rightSplit; i<this._columns.length; i++)
            rendered += this._renderColumn(i,yr,force);

        this._check_and_render_full_rows(yr[0], yr[1], force);
        this._check_load_next(yr);
    },
    _delete_full_rows:function(start, end){
        this._rows_cache_start = start;
        this._rows_cache_end = end;

        webix.html.remove(this._rows_cache);
        this._rows_cache=[];
    },
    _check_and_render_full_rows:function(start, end, force){
        if (this._rows_body)
            this._rows_body.style.top = this._render_scroll_shift+"px";

        if (!force && start == this._rows_cache_start && end == this._rows_cache_end)
            return;

        this._delete_full_rows(start, end);

        if (this._render_full_row_some)
            this._render_full_row_some = false;
        else return;

        for (var i=0; i<this._render_full_rows.length; i++){
            var info = this._render_full_rows[i];
            var item = this.getItem(info.id);

            var value;
            if (typeof item.$row == "function"){
                value = item.$row.call(this, item, this.type);
            } else {
                value = this._getValue(item, this.getColumnConfig(item.$row), i);
            }

            var row = this._rows_cache[i] = webix.html.create("DIV", null , value);
            row.className = "webix_cell "+(item.$sub ? ("webix_dtable_sub"+(this._settings.subview?"view":"row")) : "webix_dtable_colrow");
            row.setAttribute("column", 0);
            row.setAttribute("row", info.index);

            var height = (item.$height || this._settings.rowHeight);
            if (item.$subopen)
                row.style.height = item.$subHeight+"px";
            else
                row.style.height = height +"px";

            row.style.paddingRight = webix.ui.scrollSize+"px";
            row.style.top =  info.top + (item.$subopen ? height-1 : -1) + "px";

            if (!this._rows_body){
                this._rows_body = webix.html.create("DIV");
                this._rows_body.style.position = "relative";
                this._rows_body.style.top = this._render_scroll_shift+"px";
                this._body.appendChild(this._rows_body);
            }
            this._rows_body.appendChild(row);
            this.attachEvent("onSyncScroll", function(x,y,t){
                webix.Touch._set_matrix(this._rows_body,0,y,t);
            });
            if (this._settings.subview)
                this.callEvent("onSubViewRender", [item, row]);
        }
    },
    _check_load_next:function(yr){
        var paging = this._settings.pager;
        var fetch = this._settings.datafetch;

        var direction = (!this._last_valid_render_pos || yr[0] >= this._last_valid_render_pos);
        this._last_valid_render_pos = yr[0];

        if (this._data_request_flag){
            if (paging && (!fetch || fetch >= paging.size))
                if (this._check_rows([0,paging.size*paging.page], Math.max(fetch, paging.size), true))
                    return (this._data_request_flag = null);

            this._run_load_next(this._data_request_flag, direction);
            this._data_request_flag = null;
        } else {
            if (this._settings.loadahead)
                var check = this._check_rows(yr, this._settings.loadahead, direction);
        }
    },
    _check_rows:function(view, count, dir){
        var start = view[1];
        var end = start+count;
        if (!dir){
            start = view[0]-count;
            end = view[0];
        }

        if (start<0) start = 0;
        end = Math.min(end, this.data.order.length-1);

        var result = false;
        for (var i=start; i<end; i++)
            if (!this.data.order[i]){
                if (!result)
                    result = { start:i, count:(end-start) };
                else {
                    result.last = i;
                    result.count = (i-start);
                }
            }
        if (result){
            this._run_load_next(result, dir);
            return true;
        }
    },
    _run_load_next:function(conf, direction){
        var count = Math.max(conf.count, (this._settings.datafetch||this._settings.loadahead||0));
        var start = direction?conf.start:(conf.last - count+1);

        if (this._maybe_loading_already(conf.count, conf.start)) return;
        this.loadNext(count, start);
    },
    // necessary for safari only
    _preserveScrollTarget: function(columnNode){
        if (webix.env.isSafari){
            var i, node, newNode, scroll,
                dir = ["x","y"];

            for(i = 0; i < 2; i++){
                scroll = this["_"+dir[i]+"_scroll"];
                if(scroll && scroll._scroll_trg && scroll._scroll_trg.parentNode == columnNode){
                    node = scroll._scroll_trg;
                }
            }

            if(node){
                if(this._scrollWheelTrg)
                    webix.html.remove(this._scrollWheelTrg);
                this._scrollWheelTrg = node;
                newNode  = node.cloneNode(true); // required for _hideColumn
                node.parentNode.insertBefore(newNode, node);
                this._scrollWheelTrg.style.display = "none";
                this._body.appendChild(this._scrollWheelTrg);
            }
        }
    },
    _hideColumn:function(index){
        var col = this._columns[index];

        // preserve target node for Safari wheel event
        this._preserveScrollTarget(col.node);
        webix.html.remove(col.node);
        col.attached = false;
    },
    _clearColumnCache:function(){
        for (var i = 0; i < this._columns.length; i++)
            this._columns[i]._yr0 = -1;

        if (this._rows_cache.length){
            webix.html.remove(this._rows_cache);
            this._rows_cache = [];
        }
    },
    getText:function(row_id, column_id){
        return this._getValue(this.getItem(row_id), this.getColumnConfig(column_id), 0);
    },
    _getCss:function(config, value, item, id){
        var css = "webix_cell";
        css += this._addSkinCss("webix_cell");
        css += this._addTextOverflowCss();

        if (config.cssFormat){
            var per_css = config.cssFormat(value, item, id, config.id);
            if (per_css){
                if (typeof per_css == "object")
                    css+= " "+webix.html.createCss(per_css);
                else
                    css+=" "+per_css;
            }
        }

        var row_css = item.$css;
        if (row_css){
            if (typeof row_css == "object")
                item.$css = row_css = webix.html.createCss(row_css);
            css+=" "+row_css;
        }

        var mark = this.data._marks[id];
        if (mark){
            if (mark.$css)
                css+=" "+mark.$css;
            if (mark.$cellCss){
                var mark_marker = mark.$cellCss[config.id];
                if (mark_marker)
                    css+=" "+mark_marker;
            }
        }

        if (item.$cellCss){
            var css_marker = item.$cellCss[config.id];
            if (css_marker){
                if (typeof css_marker == "object")
                    css_marker = webix.html.createCss(css_marker);
                css += " "+css_marker;
            }
        }

        //cell-selection
        var selected = this.data.getMark(item.id,"webix_selected");
        if ((selected && (selected.$row || selected[config.id]))||config.$selected) {
            css += " " + this._select_css;
            css += this._addSkinCss(this._select_css)
        }

        return css;
    },
    _getValue:function(item, config, i){
        if (!item)
            return "";

        var value;

        value = item[config.id];
        if (value === webix.undefined || value === null)
            value = "";
        else if (config.format)
            value = config.format(value);
        if (config.template)
            value = config.template(item, this.type, value, config, i);

        return value;
    },
    //we don't use render-stack, but still need a place for common helpers
    //so creating a simple "type" holder
    type:{
        checkbox:function(obj, common, value, config){
            var checked = (value == config.checkValue) ? 'checked="true"' : '';
            return "<input class='webix_table_checkbox' type='checkbox' "+checked+">";
        },
        radio:function(obj, common, value, config){
            var checked = (value == config.checkValue) ? 'checked="true"' : '';
            return "<input class='webix_table_radio' type='radio' "+checked+">";
        },
        editIcon:function(){
            return "<span class='webix_icon icon-pencil'></span>";
        },
        trashIcon:function(){
            return "<span class='webix_icon icon-trash'></span>";
        }
    },
    type_setter:function(value){
        if(!this.types || !this.types[value])
            webix.type(this, value);
        else {
            this.type = webix.clone(this.types[value]);
            if (this.type.css)
                this._contentobj.className+=" "+this.type.css;
        }
        if (this.type.on_click)
            webix.extend(this.on_click, this.type.on_click);

        return value;
    },
    _renderColumn:function(index,yr,force, single){
        var col = this._columns[index];
        if (!col.attached){
            var split_column = index<this._settings.leftSplit ? 0 :( index >= this._rightSplit ? 2 : 1);
            this._body.childNodes[split_column].firstChild.appendChild(col.node);
            col.attached = true;
            col.split = split_column;
        }

        this._render_scroll_top = yr[0];
        this._render_scroll_shift = 0;
        this._render_scroll_diff = yr[2];

        //if columns not aligned during scroll - set correct scroll top value for each column
        var total = 0;
        if (this._settings.scrollAlignY){
            if ((yr[1] == this.data.order.length) || (this.data.$pagesize && yr[1] % this.data.$pagesize === 0 )){
                col.node.style.top = (this._render_scroll_shift = yr[2])+"px";
            } else if (col._yr2)
                col.node.style.top = "0px";
        } else {
            this._render_scroll_shift = yr[2];
            if (yr[2] != col._yr2){
                col.node.style.top = yr[2]+"px";
            }
        }

        if (!force && (col._yr0 == yr[0] && col._yr1 == yr[1])) return 0;

        var html="";
        var config = this._settings.columns[index];
        var rowHeight = this._settings.rowHeight;


        for (var i = yr[0]; i < yr[1]; i++){
            var id = this.data.order[i];
            var item = this.data.getItem(id);
            var value;
            if (item){
                if (single && item.$row){
                    this._render_full_row_some = true;
                    this._render_full_rows.push({ top:total, id:item.id, index:i});
                    if (!item.$sub){
                        html+="<div class='webix_cell'></div>";
                        total += rowHeight;
                        continue;
                    }
                }
                var value = this._getValue(item, config, i);
                var css = this._getCss(config, value, item, id);

                var margin = item.$subopen ? "margin-bottom:"+item.$subHeight+"px;" : "";
                if (item.$height){
                    html+="<div class='"+css+"' style='height:"+item.$height+"px;"+(config.align?"text-align:"+config.align+";":"")+margin+"'>"+value+"</div>";
                    total += item.$height - rowHeight;
                } else {
                    html+="<div class='"+css+"' style='"+(config.align?"text-align:"+config.align+";":"")+margin+"'>"+value+"</div>";
                }

                if (margin)
                    total += item.$subHeight;

            } else {
                html+="<div class='webix_cell'></div>";
                if (!this._data_request_flag)
                    this._data_request_flag = {start:i, count:yr[1]-i};
                else
                    this._data_request_flag.last = i;
            }
            total += rowHeight;
        }

        // preserve target node for Safari wheel event
        this._preserveScrollTarget(col.node);

        col.node.innerHTML = html;
        col._yr0=yr[0];
        col._yr1=yr[1];
        col._yr2=yr[2];
        return 1;
    },
    _set_split_sizes_y:function(){
        if (!this._columns.length || isNaN(this._content_height*1)) return;
        webix.debug_size_box(this, ["y-sizing"], true);

        var wanted_height = this._dtable_height+(this._scrollSizeX?this._scrollSizeX:0);
        if ((this._settings.autoheight || this._settings.yCount) && this.resize())
            return;

        this._y_scroll.sizeTo(this._content_height, this._header_height, this._footer_height);
        this._y_scroll.define("scrollHeight", wanted_height);

        this._dtable_offset_height =  Math.max(0,this._content_height-this._scrollSizeX-this._header_height-this._footer_height);
        for (var i = 0; i < 3; i++){

            this._body.childNodes[i].style.height = this._dtable_offset_height+"px";
            if (this._settings.prerender)
                this._body.childNodes[i].firstChild.style.height = this._dtable_height+"px";
            else
                this._body.childNodes[i].firstChild.style.height = this._dtable_offset_height+"px";
        }
        //prevent float overflow, when we have split and very small
        this._header.style.height = this._header_height+"px";
    },
    _set_split_sizes_x:function(){
        if (!this._columns.length) return;
        if (webix.debug_size) webix.log("  - "+this.name+"@"+this._settings.id+" X sizing");

        var index = 0;
        this._left_width = 0;
        this._right_width = 0;
        this._center_width = 0;

        while (index<this._settings.leftSplit){
            this._left_width += this._columns[index].width;
            index++;
        }

        index = this._columns.length-1;

        while (index>=this._rightSplit){
            this._right_width += this._columns[index].width;
            index--;
        }

        if (!this._content_width) return;

        if (this._settings.autowidth && this.resize())
            return;

        this._center_width = this._content_width - this._right_width - this._left_width - this._scrollSizeY;

        this._body.childNodes[1].firstChild.style.width = this._dtable_width+"px";

        this._body.childNodes[0].style.width = this._left_width+"px";
        this._body.childNodes[1].style.width = this._center_width+"px";
        this._body.childNodes[2].style.width = this._right_width+"px";
        this._header.childNodes[0].style.width = this._left_width+"px";
        this._header.childNodes[1].style.width = this._center_width+"px";
        this._header.childNodes[2].style.width = this._right_width+"px";
        this._footer.childNodes[0].style.width = this._left_width+"px";
        this._footer.childNodes[1].style.width = this._center_width+"px";
        this._footer.childNodes[2].style.width = this._right_width+"px";

        var delta = this._center_width - this._dtable_width;
        if (delta<0) delta=0; //negative header space has not sense

        if (delta != this._header_fix_width){
            this._header_fix_width = delta;
            this._size_header_footer_fix();
        }

        // temp. fix: Chrome [DIRTY]
        if (webix.env.isWebKit){
            var w = this._body.childNodes[0].offsetWidth;
            w = this._body.childNodes[1].offsetWidth;
            w = this._body.childNodes[1].firstChild.offsetWidth;
            w = this._body.childNodes[2].offsetWidth;
        }

        this._x_scroll.sizeTo(this._content_width-this._scrollSizeY);
        this._x_scroll.define("scrollWidth", this._dtable_width+this._left_width+this._right_width);
    },
    $getSize:function(dx, dy){
        if ((this._settings.autoheight || this._settings.yCount) && this._settings.columns){
            //if limit set - use it
            var desired = ((this._settings.yCount || 0) * this._settings.rowHeight);
            //else try to use actual rendered size
            //if component invisible - this is not valid, so fallback to all rows
            if (!desired) desired =  this.isVisible() ? this._dtable_height : (this.count() * this._settings.rowHeight);
            //add scroll and check minHeight limit
            this._settings.height = Math.max(desired+(this._scrollSizeX?this._scrollSizeX:0)-1, (this._settings.minHeight||0))+this._header_height+this._footer_height;
        }
        if (this._settings.autowidth && this._settings.columns)
            this._settings.width = Math.max(this._dtable_width+this._left_width+this._right_width+this._scrollSizeY,(this._settings.minWidth||0));


        var minwidth = this._left_width+this._right_width+this._scrollSizeY;
        var sizes = webix.ui.view.prototype.$getSize.call(this, dx, dy);


        sizes[0] = Math.max(sizes[0]||minwidth);
        return sizes;
    },
    _restore_scroll_state:function(){
        if (this._x_scroll){
            var state = this.getScrollState();
            this._x_scroll._last_scroll_pos = this._y_scroll._last_scroll_pos = -1;
            this.scrollTo(state.x, state.y);
        }
    },
    $setSize:function(x,y){
        var oldw = this._content_width;
        var oldh = this._content_height;

        if (webix.ui.view.prototype.$setSize.apply(this, arguments)){
            if (this._dtable_fully_ready){
                this.callEvent("onResize",[this._content_width, this._content_height, oldw, oldh]);
                this._set_split_sizes_x();
                this._set_split_sizes_y();
            }
            this.render();
        }
    },
    _on_header_click:function(column){
        var col = this.getColumnConfig(column);
        if (!col.sort) return;

        var order = 'asc';
        if (col.id == this._last_sorted)
            order = this._last_order == "asc" ? "desc" : "asc";

        this._sort(col.id, order, col.sort);
    },
    markSorting:function(column, order){
        if (!this._sort_sign)
            this._sort_sign = webix.html.create("DIV");
        webix.html.remove(this._sort_sign);

        if (order){
            var cell = this._get_header_cell(this.getColumnIndex(column));
            if (cell){
                this._sort_sign.className = "webix_ss_sort_"+order;
                cell.style.position = "relative";
                cell.appendChild(this._sort_sign);
            }

            this._last_sorted = column;
            this._last_order = order;
        } else {
            this._last_sorted = this._last_order = null;
        }
    },
    scroll_setter:function(mode){
        if (typeof mode == "string"){
            this._settings.scrollX = (mode.indexOf("x") != -1);
            this._settings.scrollY = (mode.indexOf("y") != -1);
            return mode;
        } else
            return (this._settings.scrollX = this._settings.scrollY = mode);
    },
    _get_header_cell:function(column){
        var cells = this._header.getElementsByTagName("TD");
        var maybe = null;
        for (var i = 0; i<cells.length; i++)
            if (cells[i].getAttribute("column") == column && !cells[i].getAttribute("active_id")){
                maybe = cells[i].firstChild;
                if ((cells[i].colSpan||0) < 2) return maybe;
            }
        return maybe;
    },
    _sort:function(col_id, direction, type){
        direction = direction || "asc";
        this.markSorting(col_id, direction);

        if (type == "server"){
            this.loadNext(0, 0, {
                "before":function(){
                    var url = this.data.url;
                    this.clearAll();
                    this.data.url = url;
                }
            }, 0, 1);
        } else {
            if (type == "text"){
                this.data.each(function(obj){ obj.$text = this.getText(obj.id, col_id); }, this);
                type="string"; col_id = "$text";
            }

            if (typeof type == "function")
                this.data.sort(type, direction);
            else
                this.data.sort(col_id, direction, type || "string");
        }
    },
    _mouseEventCall: function( css_call, e, id, trg ) {
        var functor, i, res;
        if (css_call.length){
            for ( i = 0; i < css_call.length; i++) {
                functor = webix.toFunctor(css_call[i], this.$scope);
                res = functor.call(this,e,id,trg);
                if (res===false) return false;
            }
        }
    },
    //because we using non-standard rendering model, custom logic for mouse detection need to be used
    _mouseEvent:function(e,hash,name,pair){
        e=e||event;
        var trg=e.target||e.srcElement;
        if (this._settings.subview && this != webix.$$(trg)) return;

        //define some vars, which will be used below
        var css = '',
            css_call = [],
            found = false,
            id = null,
            res,
            trg=e.target||e.srcElement;

        //loop through all parents
        while (trg && trg.parentNode && this._viewobj && trg != this._viewobj.parentNode){
            if ((css = trg.className)) {
                css = css.toString().split(" ");

                for (var i = css.length - 1; i >= 0; i--)
                    if (hash[css[i]])
                        css_call.push(hash[css[i]]);
            }

            if (trg.parentNode.getAttribute && !id){
                var column = trg.parentNode.getAttribute("column") || trg.getAttribute("column");
                if (column){ //we need to ignore TD - which is header|footer
                    var  isBody = trg.parentNode.tagName == "DIV";

                    //column already hidden or removed
                    if(!this._columns[column]) return;

                    found = true;
                    if (isBody){
                        var index = trg.parentNode.getAttribute("row") || trg.getAttribute("row") || ( webix.html.index(trg) + this._columns[column]._yr0 );
                        this._item_clicked = id = { row:this.data.order[index], column:this._columns[column].id};
                        id.toString = this._id_to_string;
                    } else
                        this._item_clicked = id = { column:this._columns[column].id };

                    //some custom css handlers was found
                    res = this._mouseEventCall(css_call, e, id, trg);
                    if (res===false) return;

                    //call inner handler
                    if (isBody ){
                        if(this.callEvent("on"+name,[id,e,trg])&&pair){
                            this.callEvent("on"+pair,[id,e,trg]);
                        }
                    }
                    else if (name == "ItemClick"){
                        var isHeader = (trg.parentNode.parentNode.getAttribute("section") == "header");
                        if (isHeader && this.callEvent("onHeaderClick", [id, e, trg]))
                            this._on_header_click(id.column);
                    }
                    css_call = [];
                }
            }

            trg=trg.parentNode;
        }
        this._mouseEventCall(css_call, e, id, this.$view);
        return found;	//returns true if item was located and event was triggered
    },




    showOverlay:function(message){
        if (!this._datatable_overlay){
            var t = webix.html.create("DIV", { "class":"webix_overlay" }, "");
            this._body.appendChild(t);
            this._datatable_overlay = t;
        }
        this._datatable_overlay.innerHTML = message;
    },
    hideOverlay:function(){
        if (this._datatable_overlay){
            webix.html.remove(this._datatable_overlay);
            this._datatable_overlay = null;
        }
    },
    mapCells: function(startrow, startcol, numrows, numcols, callback, getOnly) {
        if (startrow === null && this.data.order.length > 0) startrow = this.data.order[0];
        if (startcol === null) startcol = this.columnId(0);
        if (numrows === null) numrows = this.data.order.length;
        if (numcols === null) numcols = this._settings.columns.length;

        if (!this.exists(startrow)) return;
        startrow = this.getIndexById(startrow);
        startcol = this.getColumnIndex(startcol);
        if (startcol === null) return;

        for (var i = 0; i < numrows && (startrow + i) < this.data.order.length; i++) {
            var row_ind = startrow + i;
            var row_id = this.data.order[row_ind];
            var item = this.getItem(row_id);
            for (var j = 0; j < numcols && (startcol + j) < this._settings.columns.length; j++) {
                var col_ind = startcol + j;
                var col_id = this.columnId(col_ind);
                var result = callback(item[col_id], row_id, col_id, i, j);
                if (!getOnly)
                    item[col_id] = result;
            }
        }
    },
    _call_onparse: function(driver, data){
        if (!this._settings.columns && driver.getConfig)
            this.define("columns", driver.getConfig(data));
    },
    _autoDetectConfig:function(){
        var test = this.getItem(this.getFirstId());
        var res = this._settings.columns = [];
        for (var key in test)
            if (key != "id")
                res.push({ id:key, header:key[0].toUpperCase()+key.substr(1), sort:"string", editor:"text" });
        if (res.length)
            res[0].fillspace = true;
        if (typeof this._settings.select == "undefined")
            this.define("select", "row");
    }
},webix.AutoTooltip, webix.Group, webix.DataMarks, webix.DataLoader,  webix.MouseEvents, webix.MapCollection, webix.ui.view, webix.EventSystem, webix.Settings);


webix.extend(webix.ui.datatable,{
    filterByAll:function(){
        //we need to use dynamic function creating
        //jshint -W083:true
        var server = false;
        this.data.silent(function(){
            this.filter();
            var first = false;
            for (var key in this._filter_elements){
                webix.assert(key, "empty column id for column with filtering");

                var record = this._filter_elements[key];
                var originvalue = record[2].getValue(record[0]);

                //saving last filter value, for usage in getState
                var inputvalue = originvalue;
                if (record[1].prepare)
                    inputvalue = record[1].prepare.call(record[2], inputvalue, record[1], this);

                //preserve original value
                record[1].value = originvalue;
                var compare = record[1].compare;

                if (!this.callEvent("onBeforeFilter",[key, inputvalue, record[1]])) continue;
                if(record[2].$server){
                    server = true;
                    return this._runServerFilter();
                } else {
                    if (inputvalue === "") continue;

                    if (compare){
                        compare = this._multi_compare(key, compare);
                        this.filter(webix.bind(function(obj, value){
                            if (!obj) return false;
                            return compare(obj[key], value, obj);
                        },this), inputvalue, first);
                    }
                    else
                        this.filter(key, inputvalue, first);
                }
                first = true;
            }
        }, this);

        if (!server){
            this.refresh();
            this.callEvent("onAfterFilter",[]);
        }
    },
    _multi_compare: function(key, compare){
        var separator = this.getColumnConfig(key).optionslist;
        //default mode
        if (!separator) 
            return compare;

        if(typeof separator != "string")
            separator = ",";

        return function(itemValue, inputValue, obj){
            if(!itemValue)
                return true;
            var ids = itemValue.split(separator);
            for (var i = 0; i < ids.length; i++) {
                if (compare(ids[i], inputValue, obj))
                    return true;
            }
        };
    },
    filterMode_setter:function(mode){
        return webix.extend(this.data._filterMode, mode, true);
    },
    getFilter:function(columnId){
        var filter = this._filter_elements[columnId];
        webix.assert(filter, "Filter doesn't exists for column in question");

        if (filter && filter[2].getInputNode)
            return filter[2].getInputNode(filter[0]);
        return null;
    },
    registerFilter:function(node, config, obj){
        this._filter_elements[config.columnId] = [node, config, obj];
    },
    collectValues:function(id){
        var values = [];
        var checks = { "" : true };

        var obj = this.getColumnConfig(id);
        var options = obj.options||obj.collection;

        if (options){
            if (typeof options == "object" && !options.loadNext){
                //raw object
                if (webix.isArray(options))
                    for (var i=0; i<options.length; i++) 
                        values.push({ id:options[i], value:options[i] });
                else
                    for (var key in options) 
                        values.push({ id:key, value:options[key] });
                return values;
            } else {
                //view
                if (typeof options === "string")
                    options = webix.$$(options);
                if (options.getBody)
                    options = options.getBody();

                this._collectValues.call(options, "id", "value", values, checks);
            }
        } else
            this._collectValues(obj.id, obj.id, values, checks);

        var obj  = { values: values };
        this.callEvent("onCollectValues", [id, obj]);
        return obj.values;
    },
    _collectValues:function(id, value,  values, checks){
        this.data.each(function(obj){
            var test = obj ? obj[value] : "";
            if (test !== webix.undefined && !checks[test]){
                checks[test] = true;
                values.push({ id:obj[id], value:test });
            }
        }, this, true);
        values.sort(function(a,b){ return a.value > b.value ? 1 : -1;  });
    },
    _runServerFilter: function(name){
        this.loadNext(0,0,{
            before:function(){
                var url = this.data.url;
                if (this.editStop) this.editStop();
                this.clearAll();
                this.data.url = url;
            },
            success:function(){
                this.callEvent("onAfterFilter",[]);
            }
        },0,1);
    }
});

webix.extend(webix.ui.datatable, {
    hover_setter:function(value){
        if (value && !this._hover_initialized){
            this._enable_mouse_move();
            this.config.experimental = true;

            this.attachEvent("onMouseMoving", function(e){
                
                var row = this.locate(arguments[0]);
                row = row ? row.row : null;

                if (this._last_hover != row){
                    if (this._last_hover)
                        this.removeRowCss(this._last_hover, "webix_row_hover");
                    
                    this._delayed_hover_set();
                    this._last_hover = row;
                }
            });

            this.attachEvent("onMouseOut", function(){
                if (this._last_hover){
                    this.removeRowCss(this._last_hover, "webix_row_hover");
                    this._last_hover = null;
                }
            });

            this._hover_initialized = 1;
        }
        return value;
    },
    _delayed_hover_set:function(){
        if(typeof this._settings.hover == "undefined" || this._settings.hover !== false){
            webix.delay(function(){ 
                if (this._last_hover)
                    this.addRowCss( this._last_hover, "webix_row_hover" );
            }, this, [],  5);
        }
    },
    select_setter:function(value){
        if (!this.select && value){
            webix.extend(this, this._selections._commonselect, true);
            if (value === true)
                value = "row";
            else if (value == "multiselect"){
                value = "row";
                this._settings.multiselect = true;
            }
            webix.assert(this._selections[value], "Unknown selection mode: "+value);
            webix.extend(this, this._selections[value], true);
        }
        return value;
    },
    getSelectedId:function(mode){
        return  mode?[]:""; //dummy placeholder
    },
    getSelectedItem:function(mode){
        return webix.SelectionModel.getSelectedItem.call(this, mode);
    },
    _selections:{
        //shared methods for all selection models
        _commonselect:{
            _select_css:'webix_cell_select',
            $init:function(){
                this._reinit_selection();

                this.on_click.webix_cell = webix.bind(this._click_before_select, this);

                //temporary stab, actual handlers need to be created
                this._data_cleared = this._data_filtered = function(){
                    this.unselect();
                };

                this.data.attachEvent("onStoreUpdated",webix.bind(this._data_updated,this));
                this.data.attachEvent("onClearAll", webix.bind(this._data_cleared,this));
                this.data.attachEvent("onAfterFilter", webix.bind(this._data_filtered,this));
                this.data.attachEvent("onIdChange", webix.bind(this._id_changed,this));

                this.$ready.push(webix.SelectionModel._set_noselect);
            },
            _id_changed:function(oldid, newid){
                for (var i=0; i<this._selected_rows.length; i++)
                    if (this._selected_rows[i] == oldid)
                        this._selected_rows[i] = newid;

                for (var i=0; i<this._selected_areas.length; i++){
                    var item = this._selected_areas[i];
                    if (item.row == oldid){
                        oldid = this._select_key(item);
                        item.row = newid;
                        newid = this._select_key(item);
                        item.id = newid;

                        delete this._selected_pull[oldid];
                        this._selected_pull[newid] = true;
                    }
                }
            },
            _data_updated:function(id, obj, type){
                if (type == "delete") 
                    this.unselect(id);
            },
            _reinit_selection:function(){
                //list of selected areas
                this._selected_areas=[];
                //key-value hash of selected areas, for fast search
                this._selected_pull={};
                //used to track selected cell objects
                this._selected_rows = [];
            },
            isSelected:function(id, column){
                var key;
                if (!webix.isUndefined(column))
                    key = this._select_key({ row:id, column: column});
                else 
                    key = typeof id === "object"? this._select_key(id) : id;

                return this._selected_pull[key];
            },
            getSelectedId:function(asArray, plain){
                var result;

                //if multiple selections was created - return array
                //in case of single selection, return value or array, when asArray parameter provided
                if (this._selected_areas.length > 1 || asArray){
                    result = [].concat(this._selected_areas);
                    if (plain)
                        for (var i = 0; i < result.length; i++)
                            result[i]=result[i].id;
                } else {
                    result = this._selected_areas[0];
                    if (plain && result)
                        return result.id;
                }

                return result;
            },
            _id_to_string:function(){
                return this.row;
            },
            _select:function(data, preserve){
                var key = this._select_key(data);
                //don't allow selection on unnamed columns
                if (key === null) return;

                if (preserve === -1)
                    return this._unselect(data);

                data.id = key;
                data.toString = this._id_to_string;

                if (!this.callEvent("onBeforeSelect",[data, preserve])) return false;

                //ignore area, if it was already selected and
                // - we are preserving existing selection
                // - this is the only selected area
                // otherwise we need to clear other selected areas
                if (this._selected_pull[key] && (preserve || this._selected_areas.length == 1)) return;

                if (!preserve)
                    this._clear_selection();

                this._selected_areas.push(data);
                this._selected_pull[key] = true;

                this.callEvent("onAfterSelect",[data, preserve]);

                
                this._finalize_select(this._post_select(data));
                return true;
            },
            _clear_selection:function(){
                if (!this._selected_areas.length) return false; 

                for (var i=0; i<this._selected_rows.length; i++){
                    var item = this.getItem(this._selected_rows[i]);
                    if (item)
                        this.data.removeMark(item.id, "webix_selected", 0, 1);
                }
                var cols = this._settings.columns;
                if (cols)
                    for (var i = 0; i < cols.length; i++) {
                        cols[i].$selected = null;
                    }
                    
                this._reinit_selection();
                return true;
            },
            unselectAll:function(){
                this.clearSelection();
            },
            selectAll:function(){
                this.selectRange();
            },
            clearSelection:function(){
                if (this._clear_selection()){
                    this.callEvent("onSelectChange",[]);
                    this.render();
                }
            },
            _unselect:function(data){
                var key = this._select_key(data);
                if (!key && this._selected_areas.length){
                    this.clearSelection();
                    this.callEvent("onSelectChange", []);
                }

                //ignore area, if it was already selected
                if (!this._selected_pull[key]) return;

                if (!this.callEvent("onBeforeUnSelect",[data])) return false;

                for (var i = 0; i < this._selected_areas.length; i++){
                    if (this._selected_areas[i].id == key){
                        this._selected_areas.splice(i,1);
                        break;
                    }
                }
                
                delete this._selected_pull[key];

                this.callEvent("onAfterUnSelect",[data]);
                this._finalize_select(0, this._post_unselect(data));
            },
            _add_item_select:function(id){
                var item = this.getItem(id);
                return this.data.addMark(item.id, "webix_selected", 0, { $count : 0 }, true);

            },
            _finalize_select:function(id){
                if (id)
                    this._selected_rows.push(id);
                if (!this._silent_selection){
                    this.render();
                    this.callEvent("onSelectChange",[]);    
                }
            },
            _click_before_select:function(e, id){
                var preserve = e.ctrlKey || e.metaKey || (this._settings.multiselect == "touch");
                var range = e.shiftKey;

                if (!this._settings.multiselect && this._settings.select != "multiselect")
                    preserve = range = false;

                if (range && this._selected_areas.length){
                    var last = this._selected_areas[this._selected_areas.length-1];
                    this._selectRange(id, last);
                } else {
                    if (preserve && this._selected_pull[this._select_key(id)])
                        this._unselect(id);
                    else
                        this._select({ row: id.row, column:id.column }, preserve);
                }
            },
            _mapSelection:function(callback, column, row){
                var cols = this._settings.columns;
                //selected columns only
                if (column){
                    var temp = [];
                    for (var i=0; i<cols.length; i++)
                        if (cols[i].$selected)
                            temp.push(cols[i]);
                    cols = temp;
                }

                var rows = this.data.order;
                var row_ind = 0;

                for (var i=0; i<rows.length; i++){
                    var item = this.getItem(rows[i]);
                    if (!item) continue; //dyn loading, row is not available
                    var selection = this.data.getMark(item.id, "webix_selected");
                    if (selection || column){
                        var col_ind = 0;
                        for (var j = 0; j < cols.length; j++){
                            var id = cols[j].id;
                            if (row || column || selection[id]){
                                if (callback)
                                    item[id] = callback(item[id], rows[i], id, row_ind, col_ind);
                                else
                                    return {row:rows[i], column:id};
                                col_ind++;
                            }
                        }
                        //use separate row counter, to count only selected rows
                        row_ind++;
                    }
                }
            }
        }, 

        row : {
            _select_css:'webix_row_select',
            _select_key:function(data){ return data.row; },
            select:function(row_id, preserve){
                //when we are using id from mouse events
                if (row_id) row_id = row_id.toString();

                webix.assert(this.data.exists(row_id), "Incorrect id in select command: "+row_id);
                this._select({ row:row_id }, preserve);
            },
            _post_select:function(data){
                this._add_item_select(data.row).$row = true;
                return data.row;
            },
            unselect:function(row_id){
                this._unselect({row : row_id});
            },
            _post_unselect:function(data){
                this.data.removeMark(data.row, "webix_selected", 0, 1);
                return data.row;
            },
            mapSelection:function(callback){
                return this._mapSelection(callback, false, true);
            },
            _selectRange:function(a,b){
                return this.selectRange(a.row, b.row);
            },
            selectRange:function(row_id, end_row_id, preserve){
                if (webix.isUndefined(preserve)) preserve = true;

                var row_start_ind = row_id ? this.getIndexById(row_id) : 0;
                var row_end_ind = end_row_id ? this.getIndexById(end_row_id) : this.data.order.length-1;

                if (row_start_ind>row_end_ind){
                    var temp = row_start_ind;
                    row_start_ind = row_end_ind;
                    row_end_ind = temp;
                }
                
                this._silent_selection = true;
                for (var i=row_start_ind; i<=row_end_ind; i++)
                    this.select(this.getIdByIndex(i), preserve);
                this._silent_selection = false;
                this._finalize_select();
            }
        },

        cell:{
            _select_key:function(data){
                if (!data.column) return null;
                return data.row+"_"+data.column; 
            },
            select:function(row_id, column_id, preserve){
                webix.assert(this.data.exists(row_id), "Incorrect id in select command: "+row_id);
                this._select({row:row_id, column:column_id}, preserve);
            },
            _post_select:function(data){
                    var sel = this._add_item_select(data.row);
                    sel.$count++;
                    sel[data.column]=true;
                    return data.row;
            },
            unselect:function(row_id, column_id){
                this._unselect({row:row_id, column:column_id});
            },
            _post_unselect:function(data){
                var sel = this._add_item_select(data.row);
                    sel.$count-- ;
                    sel[data.column] = false;
                    if (sel.$count<=0)
                        this.data.removeMark(data.row,"webix_selected");
                    return data.row;
            },
            mapSelection:function(callback){
                return this._mapSelection(callback, false, false);
            },
            _selectRange:function(a,b){
                return this.selectRange(a.row, a.column, b.row, b.column);
            },

            selectRange:function(row_id, column_id, end_row_id, end_column_id, preserve){
                if (webix.isUndefined(preserve)) preserve = true;

                var row_start_ind = row_id ? this.getIndexById(row_id) : 0;
                var row_end_ind = end_row_id ? this.getIndexById(end_row_id) : this.data.order.length-1;

                var col_start_ind = column_id ? this.getColumnIndex(column_id) : 0;
                var col_end_ind = end_column_id ? this.getColumnIndex(end_column_id) : this._columns.length-1;

                if (row_start_ind>row_end_ind){
                    var temp = row_start_ind;
                    row_start_ind = row_end_ind;
                    row_end_ind = temp;
                }
                
                if (col_start_ind>col_end_ind){
                    var temp = col_start_ind;
                    col_start_ind = col_end_ind;
                    col_end_ind = temp;
                }

                this._silent_selection = true;
                for (var i=row_start_ind; i<=row_end_ind; i++)
                    for (var j=col_start_ind; j<=col_end_ind; j++)
                        this.select(this.getIdByIndex(i), this.columnId(j), preserve);
                this._silent_selection = false;
                this._finalize_select();
            }
        },

        column:{
            _select_css:'webix_column_select',
            _select_key:function(data){ return data.column; },
            _id_to_string:function(){
                return this.column;
            },
            //returns box-like area, with ordered selection cells
            select:function(column_id, preserve){
                this._select({ column:column_id }, preserve);
            },
            _post_select:function(data){
                this._settings.columns[this.getColumnIndex(data.column)].$selected = true;
                if (!this._silent_selection)
                    this._render_header_and_footer();
            },
            unselect:function(column_id){
                this._unselect({column : column_id});
            },
            _post_unselect:function(data){
                this._settings.columns[this.getColumnIndex(data.column)].$selected = null;
                this._render_header_and_footer();
            },
            mapSelection:function(callback){
                return this._mapSelection(callback, true, false);
            },
            _selectRange:function(a,b){
                return this.selectRange(a.column, b.column);
            },
            selectRange:function(column_id, end_column_id, preserve){
                if (webix.isUndefined(preserve)) preserve = true;

                var column_start_ind = column_id ? this.getColumnIndex(column_id) : 0;
                var column_end_ind = end_column_id ? this.getColumnIndex(end_column_id) : this._columns.length-1;

                if (column_start_ind>column_end_ind){
                    var temp = column_start_ind;
                    column_start_ind = column_end_ind;
                    column_end_ind = temp;
                }
                
                this._silent_selection = true;
                for (var i=column_start_ind; i<=column_end_ind; i++)
                    this.select(this.columnId(i), preserve);

                this._silent_selection = false;

                this._render_header_and_footer();
                this._finalize_select();
            }
        },
        area: {
            _select_key:function(data){
                return data.row+"_"+data.column;
            },
            getSelectedId: function(asArray){
                var area = this.getSelectArea();
                var result = [];
                if(area){
                    if(asArray && ( area.start.row != area.end.row || area.start.column != area.end.column )){
                        var row_start_ind = this.getIndexById(area.start.row);
                        var row_end_ind = this.getIndexById(area.end.row);

                        var col_start_ind = this.getColumnIndex(area.start.column);
                        var col_end_ind = this.getColumnIndex(area.end.column);

                        for (var i=row_start_ind; i<=row_end_ind; i++)
                            for (var j=col_start_ind; j<=col_end_ind; j++){
                                result.push({row:this.getIdByIndex(i), column:this.columnId(j)});
                            }

                    }
                    else{
                        result.push(area.end);
                    }
                }

                return asArray?result:result[0];
            },
            unselect:function(row_id){
                this.removeSelectArea();
            },
            _unselect: function() {
                this.removeSelectArea();
            },
            mapSelection:function(callback){
                var select  = this.getSelectArea();
                if (select){
                    var sind = this.getColumnIndex(select.start.column);
                    var eind = this.getColumnIndex(select.end.column);
                    var srow = this.getIndexById(select.start.row);
                    var erow = this.getIndexById(select.end.row);

                    for (var i = srow; i <= erow; i++) {
                        var rid = this.data.order[i];
                        var item = this.getItem(rid);
                        for (var j = sind; j <= eind; j++) {
                            var cid = this._columns[j].id;
                            if (callback)
                                callback((item[cid] || ""), rid, cid, i-srow, j-sind);
                            else
                                return { row:rid, column:cid };
                        }
                    }

                }
            },
            _selectRange:function(id,last){
                this._extendAreaRange(id, last);
            },
            _select: function(cell, preserve){
                //ctrl-selection is not supported yet, so ignoring the preserve flag
                this.addSelectArea(cell,cell,false);
                return true;
            }
        }
    }
});





webix.extend(webix.ui.datatable, {      
    blockselect_setter:function(value){
        if (value && this._block_sel_flag){
            webix.event(this._viewobj, webix.env.mouse.move, this._bs_move, {bind:this});
            webix.event(this._viewobj, webix.env.mouse.down, this._bs_down, {bind:this});
            webix.event(document.body, webix.env.mouse.up, this._bs_up, {bind:this});
            this._block_sel_flag = this._bs_ready = this._bs_progress = false;  
        }
        return value;
    },
    _block_sel_flag:true,
    _childOf:function(e, tag){
        var src = e.target||e.srcElement;
        while (src){
            if (src.getAttribute && src.getAttribute("webixignore")) return false;
            if (src == tag)
                return true;
            src = src.parentNode;
        }
        return false;
    },
    _bs_down:function(e){
        if (this._childOf(e, this._body)){
            //disable block selection when we have an active editor
            if (e.target && e.target.tagName == "INPUT" || this._rs_process) return;

            webix.html.addCss(document.body,"webix_noselect");
            this._bs_position = webix.html.offset(this._body);

            var pos = webix.html.pos(e);

            this._bs_ready = [pos.x - this._bs_position.x, pos.y - this._bs_position.y];
        }
    },
    _bs_up:function(e){
        if (this._block_panel){
            this._bs_select("select", true, e);
            this._block_panel = webix.html.remove(this._block_panel);
        }
        webix.html.removeCss(document.body,"webix_noselect");
        this._bs_ready = this._bs_progress = false; 
    },
    _bs_select:function(mode, theend, e){
        var start = this._locate_cell_xy.apply(this, this._bs_ready);
        var end = this._locate_cell_xy.apply(this, this._bs_progress);

        if (!this.callEvent("onBeforeBlockSelect", [start, end, theend, e]))
            return;

        if ((!this._bs_do_select || this._bs_do_select(start, end, theend, e) !== false) && (start.row && end.row)){
            if (mode === "select"){
                this._clear_selection();

                this._selectRange(start, end);
            } else {
                var x1 = this._bs_ready;
                var startx, starty, endx, endy;

                if (mode === "box"){
                    startx = Math.min(this._bs_ready[0],this._bs_progress[0]);
                    endx = Math.max(this._bs_ready[0],this._bs_progress[0]);

                    starty = Math.min(this._bs_ready[1],this._bs_progress[1]);
                    endy = Math.max(this._bs_ready[1],this._bs_progress[1]);
                } else {
                    var startn = this._cellPosition(start.row, start.column);
                    var endn = this._cellPosition(end.row, end.column);
                    var scroll = this.getScrollState();

                    var startWidth = startn.width;
                    var endWidth = endn.width;

                    if (this._right_width && this._bs_ready[0] > this._left_width+this._center_width){
                        startn.left += this._left_width+this._center_width;
                    } else if (this._left_width){

                        if (this._bs_ready[0] > this._left_width){
                            if(startn.left < scroll.x){
                                startWidth -= scroll.x-startn.left;
                                startn.left = this._left_width;
                            }
                            else
                                startn.left+=this._left_width-scroll.x;

                        }

                    } else startn.left -= scroll.x;



                    if (this._right_width && this._bs_progress[0] > this._left_width+this._center_width){
                        endn.left += this._left_width+this._center_width;
                    } else if (this._left_width){
                        if (this._bs_progress[0] > this._left_width){
                            if(endn.left < scroll.x){
                                endWidth -= scroll.x-endn.left;
                                endn.left = this._left_width;
                            }

                            else
                                endn.left+=this._left_width-scroll.x;
                        }
                    } else endn.left -= scroll.x;

                    if(this._settings.prerender){
                        startn.top -= this._scrollTop;
                        endn.top -= this._scrollTop;
                    }

                    startx = Math.min(startn.left, endn.left);
                    endx = Math.max(startn.left+startWidth, endn.left+endWidth);

                    starty = Math.min(startn.top, endn.top);
                    endy = Math.max(startn.top+startn.height, endn.top+endn.height);
                }
  

                var style = this._block_panel.style;
                style.left = startx+"px";
                style.top = starty+"px";
                style.width = (endx-startx)+"px";
                style.height = (endy-starty)+"px";

            }
        }

        if (theend)
            this.callEvent("onAfterBlockSelect", [start, end]);
    },
    _bs_start:function(e){
        this._block_panel = webix.html.create("div", {"class":"webix_block_selection"},"");

        this._body.appendChild(this._block_panel);
    },
    _bs_move:function(e){
        if (this._bs_ready !== false){
            var pos = webix.html.pos(e);
            var progress = [pos.x - this._bs_position.x, pos.y - this._bs_position.y];

            //prevent unnecessary block selection while dbl-clicking
            if (Math.abs(this._bs_ready[0] - progress[0]) < 5 && Math.abs(this._bs_ready[1] - progress[1]) < 5)
                return;

            if (this._bs_progress === false)
                this._bs_start(e);

            this._bs_progress = progress;
            this._bs_select(this.config.blockselect, false, e);
        }
    },
    _locate_cell_xy:function(x,y){
        if (this._right_width && x>this._left_width + this._center_width)
            x+= this._x_scroll.getSize()-this._center_width-this._left_width-this._right_width; 
        else if (!this._left_width || x>this._left_width)
            x+= this._x_scroll.getScroll();


        y += this.getScrollState().y;

        var row = null;
        var column = null;

        if (x<0) x=0;
        if (y<0) y=0;

        var cols = this._settings.columns;
        var rows = this.data.order;

        var summ = 0; 
        for (var i=0; i<cols.length; i++){
            summ+=cols[i].width;
            if (summ>=x){
                column = cols[i].id;
                break;
            }
        }
        if (!column)
            column = cols[cols.length-1].id;

        summ = 0;
        if (this._settings.fixedRowHeight){
            row = rows[Math.floor(y/this._settings.rowHeight)];
        } else for (var i=0; i<rows.length; i++){
            summ+=this._getHeightByIndex(i);
            if (summ>=y){
                row = rows[i];
                break;
            }
        }
        if (!row)
            row = rows[rows.length-1];

        return {row:row, column:column};
    }
});

webix.extend(webix.ui.datatable, {

    resizeRow_setter:function(value){
        this._settings.scrollAlignY = false;
        this._settings.fixedRowHeight = false;
        return this.resizeColumn_setter(value);
    },
    resizeColumn_setter:function(value){
        if (value && this._rs_init_flag){
            webix.event(this._viewobj, "mousemove", this._rs_move, {bind:this});
            webix.event(this._viewobj, "mousedown", this._rs_down, {bind:this});
            webix.event(this._viewobj, "mouseup", this._rs_up, {bind:this});
            this._rs_init_flag = false;
        }
        return value;
    },
    _rs_init_flag:true,
    _rs_down:function(e){
        //if mouse was near border
        if (!this._rs_ready) return;
        this._rs_process = [webix.html.pos(e),this._rs_ready[2]];
        webix.html.addCss(document.body,"webix_noselect");
        webix.html.denySelect();
    },
    _rs_up:function(){
        this._rs_process = false;
        webix.html.removeCss(document.body,"webix_noselect");
        webix.html.allowSelect();
    },
    _rs_start:function(e){
        e = e||event;
        if(this._rs_progress)
            return;
        var dir  = this._rs_ready[0];
        var node = this._rs_process[1];
        var obj  = this._locate(node);
        if (!obj) return;

        var eventPos = this._rs_process[0];
        var start;

        if (dir == "x"){
            start = webix.html.offset(node).x+this._rs_ready[1] - webix.html.offset(this._body).x;
            eventPos = eventPos.x;
            if (!this._rs_ready[1]) obj.cind-=(node.parentNode.colSpan||1);
        } else {
            start = webix.html.offset(node).y+this._rs_ready[1] - webix.html.offset(this._body).y+this._header_height;
            eventPos = eventPos.y;
            if (!this._rs_ready[1]) obj.rind--;
        }
        if (obj.cind>=0 && obj.rind>=0){
            this._rs_progress = [dir, obj, start];
            
            var resize = new webix.ui.resizearea({
                container:this._viewobj,
                dir:dir,
                eventPos:eventPos,
                start:start,
                cursor:(dir == "x"?"e":"n")+"-resize"
            });
            resize.attachEvent("onResizeEnd", webix.bind(this._rs_end, this));
        }
        this._rs_down = this._rs_ready = false;
    },
    _rs_end:function(result){
        if (this._rs_progress){
            var dir = this._rs_progress[0];
            var obj = this._rs_progress[1];
            var newsize = result-this._rs_progress[2];
            if (dir == "x"){
                
                //in case of right split - different sizing logic applied
                if (this._settings.rightSplit && obj.cind+1>=this._rightSplit &&
                    obj.cind !== this._columns.length - 1)
                {
                    obj.cind++;
                    newsize *= -1;
                }
                
                var column = this._columns[obj.cind];
                var oldwidth = column.width;
                delete column.fillspace;
                this._setColumnWidth(obj.cind, oldwidth + newsize, true, true);
                this._updateColsSizeSettings();
            }
            else {
                var rid = this.getIdByIndex(obj.rind);
                var oldheight = this._getRowHeight(this.getItem(rid));
                this.setRowHeight(rid, oldheight + newsize);
            }
            this._rs_up();
        }
        this._rs_progress = null;
    },
    _rs_move:function(e){
        var config = this._settings;
        if (this._rs_ready && this._rs_process)
            return this._rs_start(e);

        e = e||event;
        var node = e.target||e.srcElement;
        var mode = false; //resize ready flag

        if (node.tagName == "TD" || node.tagName == "TABLE") return ;
        var element_class = node.className||"";
        var in_body = element_class.indexOf("webix_cell")!=-1;
        //ignore resize in case of drag-n-drop enabled
        if (in_body && config.drag) return;
        var in_header = element_class.indexOf("webix_hcell")!=-1;
        this._rs_ready = false;
        
        if (in_body || in_header){
            var dx = node.offsetWidth;
            var dy = node.offsetHeight;
            var pos = webix.html.posRelative(e);

            var resizeRow = config.resizeRow;
            if (in_body && resizeRow){
                if(resizeRow===true)
                    resizeRow = 3;
                if (pos.y<resizeRow){
                    this._rs_ready = ["y", 0, node];
                    mode = "n-resize";
                } else if (dy-pos.y<resizeRow+1){
                    this._rs_ready = ["y", dy, node];
                    mode = "n-resize";
                } 
                
            }
            var resizeColumn = config.resizeColumn;
            if (resizeColumn){
                if(resizeColumn===true)
                    resizeColumn = 3;
                if (pos.x<resizeColumn){
                    this._rs_ready = ["x", 0, node];
                    mode = "e-resize";
                } else if (dx-pos.x<resizeColumn+1){
                    this._rs_ready = ["x", dx, node];
                    mode = "e-resize";
                }
            }
        }
        
        //mark or unmark resizing ready state
        if (this._cursor_timer) window.clearTimeout(this._cursor_timer);
        this._cursor_timer = webix.delay(this._mark_resize_ready, this, [mode], mode?100:0);
    },

    _mark_resize_ready:function(mode){
        if (this._last_cursor_mode != mode){
            this._last_cursor_mode = mode;
            this._viewobj.style.cursor=mode||"default";
        }
    }
});


webix.extend(webix.ui.datatable,webix.PagingAbility);
webix.extend(webix.ui.datatable, webix.TablePaste);
webix.extend(webix.ui.datatable, webix.DataState);

webix.extend(webix.ui.datatable, {
    $init:function(){
        this.data.attachEvent("onStoreUpdated", webix.bind(function(id){
            if (!id) this._adjustColumns();
        }, this));
        this.attachEvent("onStructureLoad", this._adjustColumns);

        this.attachEvent("onStructureUpdate", this._resizeColumns);
        this.attachEvent("onColumnResize", function(a,b,c,user){
            if (user)
                this._resizeColumns();
        });
        this.attachEvent("onResize", this._resizeColumns);
    },
    _adjustColumns:function(){ 
        if (!this.count()) return;

        var resize = false;
        var cols = this._columns;
        for (var i = 0; i < cols.length; i++)
            if (cols[i].adjust)
                resize = this._adjustColumn(i, cols[i].adjust, true) || resize;

        if (resize) 
            this._updateColsSizeSettings(true);
    },
    _resizeColumns:function(){
        var cols = this._settings.columns;
        var fill = [];
        var summ = 0;

        if (cols && !this._settings.autowidth)
            for (var i = 0; i < cols.length; i++){
                var colfil = cols[i].fillspace;
                if (colfil){
                    fill[i] = colfil;
                    summ += colfil*1 || 1;
                }
            }

        if (summ)               
            this._fillColumnSize(fill, summ);
    },
    _fillColumnSize:function(fill, summ){
        var cols = this._settings.columns;
        if (!cols) return;

        var width = this._content_width - this._scrollSizeY;
        var resize = false;

        if (width>0){
            for (var i=0; i<cols.length; i++)
                if (!fill[i]) width -= (cols[i].width || this.config.columnWidth);

            for (var i = 0; i < fill.length; i++)
                if (fill[i]){
                    var request = Math.min(width, Math.round(width * fill[i]/summ));
                    resize = this._setColumnWidth(i, request, true) || resize;
                    width = width - cols[i].width;
                    summ = summ - fill[i];
                }

            if (resize) 
                this._updateColsSizeSettings(true);
        }
    },
    _getColumnConfigSize:function(ind, headers){
        var d = webix.html.create("DIV",{"class":"webix_view webix_table_cell webix_measure_size webix_cell"},"");
        d.style.cssText = "width:1px; visibility:hidden; position:absolute; top:0px; left:0px; overflow:hidden;";
        document.body.appendChild(d);

        var config = this._settings.columns[ind];
        var max = -Infinity;
        
        //iterator other all loaded data is required
        if (headers != "header")
            this.data.each(function(obj){
                if (obj){
                    var text = this._getValue(obj, config, 0);
                    d.innerHTML = text;
                    max = Math.max(d.scrollWidth, max);
                }
            }, this);

        if (headers && headers != "data"){
            for (var i=0; i<config.header.length; i++){
                var header = config.header[i];
                if (header){
                    d.innerHTML = header.text;
                    max = Math.max(d.scrollWidth, max);
                }
            }
        }

        d = webix.html.remove(d);
        //1px to compensate scrollWidth rounding
        return max + 1 + (webix.env.isIE?webix.skin.$active.layoutPadding.space:0); 
    },
    _adjustColumn:function(ind, headers, ignore){
        if (ind >= 0){
            var width = this._getColumnConfigSize(ind, headers);
            return this._setColumnWidth(ind, width, ignore);
        }
    },
    adjustColumn:function(id, headers){
        this._adjustColumn(this.getColumnIndex(id), headers);
    },
    adjustRowHeight:function(id, silent, is_max_height){
        var config = this.getColumnConfig(id);
        var count = this.data.count();

        var container;
        var d = webix.html.create("DIV",{"class":"webix_table_cell webix_measure_size webix_cell"},"");
        d.style.cssText = "width:"+config.width+"px; height:1px; visibility:hidden; position:absolute; top:0px; left:0px; overflow:hidden;";
        this.$view.appendChild(d);

        if (d.offsetHeight < 1){
            //hidden container, height detection is broken
            //reattach to the body
            container = this.$view.cloneNode(true);
            document.body.appendChild(container);
            container.appendChild(d);
        }

        this.data.each(function(obj){
            //in case of dyn. mode - this can be undefined 
            if (obj){
                d.innerHTML = this._getValue(obj, config, 0);
                var height = Math.max(d.scrollHeight, this._settings.rowHeight);
                if(is_max_height != true){
                    obj.$height = height;
                }

                if(is_max_height == true && (typeof obj.$height == "undefined" || height > obj.$height)){
                    obj.$height = height;
                }
            }
        }, this);

        d = webix.html.remove(d);
        if (container)
            webix.html.remove(container);

        if (!silent)
            this.refresh();
    },
    adjustRowHeightByIds:function(ids){
        for(var i = 0; i < ids.length; i++){
            this.adjustRowHeight(ids[i], true, true);
        }
    }
});

webix.extend(webix.ui.datatable,{

    math_setter:function(value){
        if (value)
            this._math_init();
        return value;
    },

    _math_pref: '$',

    _math_init: function() {
        if(webix.env.strict) return;

        this.data.attachEvent("onStoreUpdated", webix.bind(this._parse_row_math, this));
        this.data.attachEvent("onStoreLoad", webix.bind(this._parse_math, this));
        this.attachEvent("onStructureLoad", this._parse_math);
    },
    _parse_row_math:function(id, obj, action){
        if (!id || (action=="delete" || action=="paint")) return;

        if (action == "add")
            this._exprs_by_columns(obj);

        for (var i=0; i<this._columns.length; i++)
            this._parse_cell_math(id, this._columns[i].id, action !== "add");
        this._math_recalc = {};
    },
    _parse_cell_math: function(row, col, _inner_call) {
        var item = this.getItem(row);
        var value;

        // if it's outer call we should use inputted value otherwise to take formula, not calculated value
        if (_inner_call === true)
            value = item[this._math_pref + col] || item[col];
        else {
            value = item[col];
            this._math_recalc = {};
        }

        if (typeof value === "undefined" || value === null) return;

        if (value.length > 0 && value.substr(0, 1) === '=') {
            // calculate math value
            if ((typeof(item[this._math_pref + col]) === 'undefined') || (_inner_call !== true))
                item[this._math_pref + col] = item[col];
            item[col] = this._calculate(value, row, col);
            //this.updateItem(item);
        } else {
            // just a string
            if (typeof(item[this._math_pref + col]) !== 'undefined')
                delete item[this._math_pref + col];
            // remove triggers if they were setted earlier
            this._remove_old_triggers(row, col);
        }
        // recalculate depending cells
        if (typeof(item.depends) !== 'undefined' && typeof(item.depends[col]) !== 'undefined') {
            for (var i in item.depends[col]) {
                var name = item.depends[col][i][0] + '__' + item.depends[col][i][1];
                if (typeof(this._math_recalc[name]) === 'undefined') {
                    this._math_recalc[name] = true;
                    this._parse_cell_math(item.depends[col][i][0], item.depends[col][i][1], true);
                }
            }
        }
    },

    _set_original_value: function(row, col) {
        var item = this.getItem(row);
        if (typeof(item[this._math_pref + col]) !== 'undefined')
            item[col] = item[this._math_pref + col];
    },

    _parse_math: function(){
        if (!this._columns || !this.count()) return;

        this._exprs_by_columns();


        for (var j = 0; j < this._columns.length; j++){
            var col = this.columnId(j);
            this.data.each(function(obj){
                this._parse_cell_math(obj.id, col);
            }, this);
        }

        this._math_recalc = {};
    },

    _exprs_by_columns: function(row) {
        for (var i = 0; i < this._columns.length; i++){
            if (this._columns[i].math) {
                var col = this.columnId(i);
                var math = '=' + this._columns[i].math;
                math = math.replace(/\$r/g, '#$r#');
                math = math.replace(/\$c/g, '#$c#');
                if (row)
                    row[col] = this._parse_relative_expr(math, row.id, col);
                else
                    this.data.each(function(obj){
                        obj[col] = this._parse_relative_expr(math, obj.id, col);
                    }, this);
            }
        }
    },

    _parse_relative_expr: function(expr, row, col) {
        return (webix.template(expr))({ '$r': row, '$c': col });
    },

    _get_calc_value: function(row, col) {
        var item;

        if (this.exists(row))
            item = this.getItem(row);
        else
            return '#out_of_range';

        var value = item[this._math_pref + col] || item[col] || 0;
        value = value.toString();
        if (value.substring(0, 1) !== '=')
            // it's a string
            return value;
        else {
            // TODO: check if value shouldn't be recalculated
            // and return value calculated earlier

            // calculate math expr value right now
            if (typeof(item[this._math_pref + col]) === 'undefined')
                item[this._math_pref + col] = item[col];
            item[col] = this._calculate(value, row, col, true);
            return item[col];
        }
    },

    _calculate: function(value, row, col, _inner_call) {
        // add coord in math trace to detect self-references
        if (_inner_call === true) {
            if (this._in_math_trace(row, col))
                return '#selfreference';
        } else
            this._start_math_trace();
        this._to_math_trace(row, col);

        var item = this.getItem(row);
        value = value.substring(1);

        // get operations list
        var operations = this._get_operations(value);
        var triggers = this._get_refs(value);

        if (operations) {
            value = this._replace_refs(value, triggers);
            value = this._parse_args(value, operations);
        } else {
            value = this._replace_refs(value, triggers, true);
        }

        var exc = this._math_exception(value);
        if (exc !== false)
            return exc;

        // remove from coord from trace when calculations were finished - it's important!
        this._from_math_trace(row, col);

        // process triggers to know which cells should be recalculated when one was changed
        this._remove_old_triggers(row, col);
        for (var i = 0; i < triggers.length; i++) {
            this._add_trigger([row, col], triggers[i]);
        }
        var exc = this._math_exception(value);
        if (exc !== false)
            return exc;

        // there aren't any operations here. returns number or value of another cell
        if (!value) return value;

        // process mathematical expression and getting final result
        value = this._compute(value);
        var exc = this._math_exception(value);
        if (exc !== false)
            return exc;
        return value;
    },

    _get_operations: function(value) {
        // gettings operations list (+-*/)
        var splitter = /(\+|\-|\*|\/)/g;
        var operations = value.replace(/\[[^)]*?\]/g,"").match(splitter);
        return operations;
    },

    /*! gets list of referencies in formula
     **/
    _get_refs: function(value) {
        var reg = /\[([^\]]+),([^\]]+)\]/g;
        var cells = value.match(reg);
        if (cells === null) cells = [];

        for (var i = 0; i < cells.length; i++) {
            var cell = cells[i];
            var tmp = cell;
            cell = cell.substr(1, cell.length - 2);
            cell = cell.split(',');
            cell[0] = this._trim(cell[0]);
            cell[1] = this._trim(cell[1]);
            if (cell[0].substr(0, 1) === ':')
                cell[0] = this.getIdByIndex(cell[0].substr(1));
            if (cell[1].substr(0, 1) === ':')
                cell[1] = this.columnId(cell[1].substr(1));
            cell[2] = tmp;
            cells[i] = cell;
        }

        return cells;
    },

    // replace given list of references by their values
    _replace_refs: function(value, cells, clean) {
        var dell = "(", delr = ")";
        if (clean) dell = delr = "";
        for (var i = 0; i < cells.length; i++) {
            var cell = cells[i];
            var cell_value = this._get_calc_value(cell[0], cell[1]);
            if (isNaN(cell_value))
                cell_value = '"'+cell_value+'"';
            value = value.replace(cell[2], dell + cell_value + delr);
        }
        return value;
    },

    _parse_args: function(value, operations) {
        var args = [];
        for (var i = 0; i < operations.length; i++) {
            var op = operations[i];
            var temp = this._split_by(value, op);
            args.push(temp[0]);
            value = temp[1];
        }
        args.push(value);

        //var reg = /^(-?\d|\.|\(|\))+$/;
        for (var i = 0; i < args.length; i++) {
            var arg = this._trim(args[i]);
        //  if (reg.test(arg) === false)
        //      return ''; //error
            args[i] = arg;
        }

        var expr = "";
        for (var i = 0; i < args.length - 1; i++) {
            expr += args[i] + operations[i];
        }
        expr += args[args.length - 1];
        return expr;
    },

    _compute: function(expr) {
        try {
            webix.temp_value = '';
            expr = 'webix.temp_value = ' + expr;
            eval(expr);
        } catch(ex) {
            webix.assert(false,"Math error in datatable<br>"+expr);
            webix.temp_value = '';
        }
        var result = webix.temp_value;
        webix.temp_value = null;
        return result.toString();
    },

    _split_by: function(value, splitter) {
        var pos = value.indexOf(splitter);
        var before = value.substr(0, pos);
        var after = value.substr(pos + 1);
        return [before, after];
    },

    _trim: function(value) {
        value = value.replace(/^ */g, '');
        value = value.replace(/ *$/g, '');
        return value;
    },

    _start_math_trace: function() {
        this._math_trace = [];
    },
    _to_math_trace: function(row, col) {
        this._math_trace[row + '__' + col] = true;
    },
    _from_math_trace: function(row, col) {
        if (typeof(this._math_trace[row + '__' + col]) !== 'undefined')
            delete this._math_trace[row + '__' + col];
    },
    _in_math_trace: function(row, col) {
        if (typeof(this._math_trace[row + '__' + col]) !== 'undefined')
            return true;
        else
            return false;
    },

    _add_trigger: function(depends, from) {
        var item = this.getItem(from[0]);
        if (typeof(item.depends) === 'undefined')
            item.depends = {};
        if (typeof(item.depends[from[1]]) === 'undefined')
            item.depends[from[1]] = {};
        item.depends[from[1]][depends[0] + '__' + depends[1]] = depends;

        item = this.getItem(depends[0]);
        if (typeof(item.triggers) === 'undefined')
            item.triggers = {};
        if (typeof(item.triggers[depends[1]]) === 'undefined')
            item.triggers[depends[1]] = {};
        item.triggers[depends[1]][from[0] + '__' + from[1]] = from;
    },

    _remove_old_triggers: function(row, col) {
        if (!this.exists(row, col)) return;
        var item = this.getItem(row, col);
        if (typeof(item.triggers) === 'undefined') return;
        for (var i in item.triggers[col]) {
            var depend = item.triggers[col][i];
            delete this.getItem(depend[0]).depends[depend[1]][row + '__' + col];
        }
    },

    // check if exception syntax exists and returns exception text or false
    _math_exception: function(value) {
        var reg = /#\w+/;
        var match = value.match(reg);
        if (match !== null && match.length > 0)
            return match[0];
        return false;
    }

});

webix.extend(webix.ui.datatable, {

    /////////////////////////
    //    edit start       //
    /////////////////////////
    _get_editor_type:function(id){
        return this.getColumnConfig(id.column).editor;
    },
    getEditor:function(row, column){
        if (!row)
            return this._last_editor;

        if (arguments.length == 1){
            column = row.column;
            row = row.row; 
        }
        
        return ((this._editors[row]||{})[column]);
    },
    _for_each_editor:function(handler){
        for (var row in this._editors){
            var row_editors = this._editors[row];
            for (var column in row_editors)
                if (column!="$count")
                    handler.call(this, row_editors[column]);
        }
    },
    _init_editor:function(id, type, show){
        var row = id.row;
        var column  = id.column;
        var col_settings = type.config = this.getColumnConfig(column);
        //show it over cell
        if (show !== false)
            this.showCell(row, column);

        var node = type.render();

        if (type.$inline)
            node = this._locateInput(id);
        type.node = node;
            
        var item = this.getItem(row);
        var format = col_settings.editFormat;

        var value;
        if (this._settings.editMath)
            value = item["$"+column];
        value = value || item[column];

        if (webix.isUndefined(value))
            value="";

        type.setValue(format?format(value):value, item);
        type.value = item[column];
        this._addEditor(id, type);

        if (!type.$inline)
            this._sizeToCell(id, node, true);

        if (type.afterRender)
            type.afterRender();
        
        if (this._settings.liveValidation){
            var evId = "webix_keyup_edit_"+this._settings.id+"_"+row+"_"+column;
            webix.event(type.node, "keyup", this._bind_live_validation(id, this),{id: evId});
            this.validateEditor(id);
        }

        return node;
    },
    _bind_live_validation:function(id, that){
        return function(){
            that.validateEditor(id);
        };
    },
    _set_new_value:function(editor, new_value){
        var parser = this.getColumnConfig(editor.column).editParse;
        var item = this.getItem(editor.row);

        item[editor.column] = parser?parser(new_value):new_value;
        if (this._settings.editMath)
            delete item["$"+editor.column];
        return editor.row;
    },
    //register editor in collection
    _addEditor:function(id, type, node){
        var row_editors = this._editors[id.row]=this._editors[id.row]||{};

        row_editors.$count = (row_editors.$count||0)+1;

        type.row = id.row; type.column = id.column;
        this._last_editor = row_editors[id.column] = type;

        this._in_edit_mode++;
        this._last_editor_scroll = this.getScrollState();
    },
    _removeEditor:function(editor){
        if (this._last_editor == editor)
            this._last_editor = 0;
        
        if (editor.destroy)
            editor.destroy();
        
        var row = this._editors[editor.row];
        delete row[editor.column];
        row.$count -- ;
        if (!row.$count)
            delete this._editors[editor.row];
        this._in_edit_mode--;
    },
    _changeEditorId:function(oldid, newid)  {
        var editor = this._editors[oldid];
        if (editor){
            this._editors[newid] = editor;
            delete this._editors[oldid];
            for (var key in editor)
                editor[key].row = newid;
        }
    },

    //get html cell by combined id
    _locate_cell:function(id){
        var config = this.getColumnConfig(id.column);
        if (config && config.node && config.attached){
            var index = this.getIndexById(id.row);
            if (index >= config._yr0 && index< config._yr1)
                return config.node.childNodes[index-config._yr0];
        }
        return 0;
    },

    
    /////////////////////////
    //    public methods   //
    /////////////////////////
    editCell:function(row, column, preserve, show){
        column = column || this._settings.columns[0].id;
        return webix.EditAbility.edit.call(this, {row:row, column:column}, preserve, show);
    },
    editRow:function(id, focus){
        if (id && id.row)
            id = id.row;

        var next = false;
        this.eachColumn(function(column){
            this.edit({ row:id, column:column}, next, !next);
            next = true;
        });
    },
    editColumn:function(id, focus){
        if (id && id.column)
            id = id.column;

        var next = false;
        this.eachRow(function(row){
            this.edit({row:row, column:id}, next, !next);
            next = true;
        });
    },
    eachRow:function(handler, all){
        var order = this.data.order;
        if (all) 
            order = this.data._filter_order || order;

        for (var i=0; i<order.length; i++)
            handler.call(this, order[i]);
    },
    eachColumn:function(handler, all){
        for (var i in this._columns_pull){
            var column = this._columns_pull[i];
            handler.call(this, column.id, column);
        }
        if (all){
            for (var i in this._hidden_column_hash){
                var column = this._hidden_column_hash[i];
                handler.call(this, column.id, column);
            }
        }
    },


    ////////////////////
    //    edit next   //
    ////////////////////
    _after_edit_next:function(editor_next){
        if (this.getSelectedId){    //select related cell when possible
            var sel = this.getSelectedId(true);
            if (sel.length == 1){
                this._select(editor_next);
                return false;
            }
        }
    },
    _custom_tab_handler:function(tab, e){
        if (this._settings.editable && !this._in_edit_mode){
            //if we have focus in some custom input inside of datatable
            if (e.target && e.target.tagName == "INPUT") return true;

            var selection = this.getSelectedId(true);
            if (selection.length == 1){
                this.editNext(tab, selection[0]);
                return false;
            }
        }
        return true;
    },
    _find_cell_next:function(start, check, direction){
        var row = this.getIndexById(start.row);
        var column = this.getColumnIndex(start.column);
        var order = this.data.order;
        var cols = this._columns;

        if (direction){
            for (var i=row; i<order.length; i++){
                for (var j=column+1; j<cols.length; j++){
                    var id = { row:order[i], column:cols[j].id};
                    if (check.call(this, id))
                        return id;
                }
                column = -1;
            }
        } else {
            for (var i=row; i>=0; i--){
                for (var j=column-1; j>=0; j--){
                    var id = { row:order[i], column:cols[j].id};
                    if (check.call(this, id))
                        return id;
                }
                column = cols.length;
            }
        }

        return null;
    },


    /////////////////////////////
    //    scroll correction    //
    /////////////////////////////
    _correct_after_focus_y:function(){
        if (this._in_edit_mode){
            if (this._ignore_after_focus_scroll)
                this._ignore_after_focus_scroll = false;
            else {
                this._y_scroll.scrollTo(this.getScrollState().y+this._body.childNodes[1].firstChild.scrollTop);
                this._body.childNodes[1].firstChild.scrollTop = 0;
                this._ignore_after_focus_scroll = true;
            }
        }
    },
    _correct_after_focus_x:function(){
        if (this._in_edit_mode){
            this._x_scroll.scrollTo(this._body.childNodes[1].scrollLeft);
        }
    },
    _component_specific_edit_init:function(){
        this.attachEvent("onScrollY", this._update_editor_y_pos);
        this.attachEvent("onScrollX", this._update_editor_y_pos);
        this.attachEvent("onScrollY", this._refocus_inline_editor);
        this.attachEvent("onColumnResize", function(){ this.editStop(); });
        this.attachEvent("onAfterFilter", function(){ this.editStop(); });
        this.attachEvent("onRowResize", function(){ this.editStop(); });
        this._body.childNodes[1].firstChild.onscroll = webix.bind(this._correct_after_focus_y, this);
        this._body.childNodes[1].onscroll = webix.bind(this._correct_after_focus_x, this);
    },
    _update_editor_y_pos:function(){
        if (this._in_edit_mode){
            var old  = this._last_editor_scroll;
            this._last_editor_scroll = this.getScrollState();

            var diff = this._last_editor_scroll.y - old.y;
            this._for_each_editor(function(editor){
                if (editor.getPopup){
                    var node = this.getItemNode(editor);
                    if (node)
                        editor.getPopup().show(node);
                    else
                        editor.getPopup().show({ x:-10000, y:-10000 });
                } else if (!editor.$inline){
                    editor.node.top -= diff;
                    editor.node.style.top = editor.node.top + "px";
                }
            });
        }
    }

});

webix.extend(webix.ui.datatable, webix.EditAbility);
webix.extend(webix.ui.datatable, {
    $init:function(){
        this._clear_hidden_state(); 
        this.attachEvent("onStructureLoad", this._hideInitialColumns);
    },
    _clear_hidden_state:function(){
        this._hidden_column_hash = {};
        this._hidden_column_order = webix.toArray();
        this._hidden_split=[0,0];
    },
    _hideInitialColumns:function(){
        var cols = this._columns;
        this._getInitialSpans(cols);

        for (var i = cols.length-1; i>=0; i--){
            if (cols[i].hidden)
                this.hideColumn(cols[i].id, true, true);
            else if (cols[i].batch && this.config.visibleBatch && cols[i].batch!=this.config.visibleBatch){
                this.hideColumn(cols[i].id, true, true);
            }
        }
    },
    _getInitialSpans:function(cols){
        for(var i = 0; i<cols.length; i++)
            for(var h = 0; h<cols[i].header.length;h++){
                var line = cols[i].header[h];
                if(line && line.colspan)
                    line.$colspan = line.colspan;
            }
    },
    moveColumn:function(id, index){
        var start_index = this.getColumnIndex(id);
        if (start_index == index) return; //already in place
        var columns = this._settings.columns;

        var start = columns.splice(start_index,1);
        var pos = index - (index>start_index?1:0);
        webix.PowerArray.insertAt.call(columns, start[0], pos);

        //TODO: split handling
        //we can move split line when column dropped after it

        this._refresh_columns();
    },
    _init_horder:function(){
        var horder = this._hidden_column_order;
        var cols = this._settings.columns;
        if (!horder.length){
            for (var i=0; i<cols.length; i++)
                horder[i] = cols[i].id;
            this._hidden_split = [this._settings.leftSplit, this._rightSplit];
        }
    },
    isColumnVisible:function(id){
        return !this._hidden_column_hash[id];
    },
    hideColumn:function(id, mode, silent){
        var cols = this._settings.columns;
        var horder = this._hidden_column_order;
        var hhash = this._hidden_column_hash;
        var column;

        if (mode!==false){
            
            var index = this.getColumnIndex(id);
            webix.assert(index != -1, "hideColumn: invalid ID or already hidden");
            if(index === -1 || !this.callEvent("onBeforeColumnHide", [id])) return;

            //in case of second call to hide the same column, command will be ignored
            if (index == -1) return;

            this._init_horder();

            if (index<this._settings.leftSplit)
                this._settings.leftSplit--;
            if (index>=this._rightSplit)
                this._settings.rightSplit--;
            else 
                this._rightSplit--;

            this._hideColumn(index);
            column  = hhash[id] = cols.splice(index, 1)[0];
            column._yr0 = -1;
            delete this._columns_pull[id];
            this.callEvent("onAfterColumnHide", [id]);
        } else {
            column = hhash[id];
            webix.assert(column, "showColumn: invalid ID or already visible");

            //in case of second show command for already visible column - ignoring
            if(!column || !this.callEvent("onBeforeColumnShow", [id])) return;

            var prev = null;
            var i = 0;
            for (; i<horder.length; i++){
                if (horder[i] == id)
                    break;
                if (!hhash[horder[i]])
                    prev = horder[i];
            }
            var index = prev?this.getColumnIndex(prev)+1:0;

            webix.PowerArray.insertAt.call(cols,column, index);
            delete column.hidden;

            if (i<this._hidden_split[0])
                this._settings.leftSplit++;
            if (i>=this._hidden_split[1])   
                this._settings.rightSplit++;
            else
                this._rightSplit++;
                            
            delete hhash[id];
            this._columns_pull[id] = column;
            this.callEvent("onAfterColumnShow", [id]);
        }
        this._fixColspansHidden(column, mode !== false ? 0 : 1);
        if (!silent)
            this._refresh_columns();
    },
    _fixColspansHidden:function(config, mod){
        for (var i = config.header.length - 1; i >= 0; i--) {
            var ind = this._hidden_column_order;
            var spanSource, isHidden = false, spanSize = 0;

            for (var j = 0; j < ind.length; j++) {
                var config = this.getColumnConfig(ind[j]);
                var header = config.header[i];
                if (!this.isColumnVisible(ind[j])){
                    //hidden column
                    if (header && header.$colspan && spanSize <= 0){
                        //start of colspan in hidden
                        spanSize = header.colspan = header.$colspan;
                        isHidden = spanSource = header;
                    }
                    if (spanSource && spanSize > 0){
                        //hidden column in colspan, decrease colspan size
                        spanSource.colspan--;
                    }
                } else {
                    //visible column
                    if (isHidden && spanSize > 0 && spanSource && spanSource.colspan > 0){
                        //bit start of colspan is hidden
                        header = config.header[i] = spanSource;
                        spanSource = header;
                    } else if (header && header.$colspan && spanSize <= 0){
                        //visible start of colspan
                        spanSize = header.colspan = header.$colspan;
                        spanSource = header;
                    }
                    isHidden = null;
                }
                spanSize--;
            }
        }
    },
    refreshColumns:function(columns, reset){
        if ((columns && columns != this.config.columns) || reset){
            this._clear_hidden_state();
            this._filter_elements = [];
            if (columns)
                this._rightSplit = columns.length - (this.config.rightSplit || 0);
        }

        this._columns_pull = {};
        //clear rendered data
        for (var i=0; i<this._columns.length; i++){
            var col = this._columns[i];
            this._columns_pull[col.id] = col;
            col.attached = col.node = null;
        }
        for (var i=0; i<3; i++){
            this._header.childNodes[i].innerHTML = "";
            this._body.childNodes[i].firstChild.innerHTML = "";
        }

        //render new structure
        this._columns = this.config.columns = (columns || this.config.columns);
        this._rightSplit = this._columns.length-this._settings.rightSplit;

        this._dtable_fully_ready = 0;
        this._define_structure();

        this.callEvent("onStructureUpdate");

        this._update_scroll();
        this.render();  
    },
    _refresh_columns:function(){
        this._dtable_fully_ready = 0;
        this.callEvent("onStructureUpdate");
        
        this._apply_headers();
        this.render();
    },
    showColumn:function(id){
        return this.hideColumn(id, false);
    },
    showColumnBatch:function(batch, mode){
        var preserve = typeof mode != "undefined";
        mode = mode !== false;

        this.eachColumn(function(id, col){
            if(col.batch){
                var hidden = this._hidden_column_hash[col.id];
                if (!mode) hidden = !hidden;

                if(col.batch == batch && hidden)
                    this.hideColumn(col.id, !mode, true);
                else if(!preserve && col.batch!=batch && !hidden)
                    this.hideColumn(col.id, mode, true);
            }
        }, true);

        this._refresh_columns();
    }
});
webix.extend(webix.ui.datatable, webix.KeysNavigation);




webix.extend(webix.ui.datatable,webix.DataMove);
webix.extend(webix.ui.datatable, {
    $dragHTML:function(item, e){        
        var content = "";
        var cols = this._settings.columns;
        var is_changed_width = false;
        var width_sum = 0;
        if(this._settings.dragDisplayColumns.length > 0){
            is_changed_width = true;
            for (var i = 0; i < this._settings.dragDisplayColumns.length; i++){
                var drag_column = this._settings.dragDisplayColumns[i];
                var used_column = this.getUsedColumn(drag_column);
                var value = this._getValue(item, used_column);
                var column_width = this.getColumnWidth(drag_column, used_column);
                width_sum += column_width;

                content += "<div style='width:"+column_width+"px;'>"+value+"</div>";
            }
        } else {
            for (var i=0; i<cols.length; i++){
                var value = this._getValue(item, cols[i]);
                content += "<div style='width:"+cols[i].width+"px;'>"+value+"</div>";
            }
        }
        var width = this._content_width - this._scrollSizeY;
        is_changed_width && (width = width_sum);

        var html="<div class='webix_dd_drag' style='width:"+(width-2)+"px;'>" + content;
        
        return html+"</div>";
    },  
    getUsedColumn: function(drag_column) {
        var cols = this._settings.columns;
        for (var i=0; i<cols.length; i++){
            if(cols[i].id == drag_column.id){
                return cols[i];
            }
        }
    },
    getColumnWidth:function(drag_column, used_column) {
        return drag_column.width || used_column.width;
    }, 
    getHeaderNode:function(column_id, row_index){
        var ind = this.getColumnIndex(column_id);
        row_index = row_index || 0;
        var nodes = this._header.childNodes[1].getElementsByTagName("TR")[row_index+1].childNodes;
        for (var i=0; i<nodes.length; i++)
            if (nodes[i].getAttribute("column") == ind)
                return nodes[i].firstChild;
        return null;
    },
    getItemNode:function(id, e){
        if (id && !id.header){
            var row = id.row || id;
            var rowindex = this.getIndexById(row);
            var state = this._get_y_range();
            //row not visible
            if (rowindex < state[0] && rowindex > state[1]) return;

            //get visible column
            var x_range = this._get_x_range();
            var colindex = this._settings.leftSplit ? 0 : x_range[0];
            if (id.column){
                colindex = this.getColumnIndex(id.column);
                //column not visible
                if (colindex < this._rightSplit && colindex >= this._settings.leftSplit && ( colindex<x_range[0] || colindex > x_range[1]))
                    return;
            }

            var column = this._settings.columns[colindex];
            if (column.attached && column.node)
                return column.node.childNodes[rowindex-state[0]];
        }
    },
    dragColumn_setter:function(value){
        var control; //will be defined below
        if (value == "order"){
            control = {
                $drag:webix.bind(function(s,e){
                    var id = this.locate(e);
                    if (this._rs_process || !id || !this.callEvent("onBeforeColumnDrag", [id.column, e])) return false;
                    webix.DragControl._drag_context = { from:control, start:id, custom:"column_dnd" };

                    var column = this.getColumnConfig(id.column);

                    this._relative_column_drag = webix.html.posRelative(e);
                    this._limit_column_drag = column.width;

                    return "<div class='webix_dd_drag_column' style='width:"+column.width+"px'>"+(column.header[0].text||"&nbsp;")+"</div>";
                }, this),
                $dragPos:webix.bind(function(pos, e, node){
                    var context = webix.DragControl.getContext();
                    var box = webix.html.offset(this.$view);
                    node.style.display = 'none';
                    var html = document.elementFromPoint(pos.x, box.y+1);

                    var id = (html?this.locate(html):null);

                    var start = webix.DragControl.getContext().start.column;
                    if (id && id.column != start && (!this._column_dnd_temp_block || id.column != this._last_sort_dnd_node )){
                        //ignore normal dnd , and dnd from other components
                        if (context.custom == "column_dnd" && webix.$$(html) == this){
                            if (!this.callEvent("onBeforeColumnDropOrder",[start, id.column,e])) return;

                            var start_index = this.getColumnIndex(start);
                            var end_index = this.getColumnIndex(id.column);

                            //on touch devices we need to preserve drag-start element till the end of dnd
                            if(e.touches){
                                this._dragTarget = e.target;
                                this._dragTarget.style.display = "none";
                                this.$view.parentNode.appendChild(this._dragTarget);
                            }

                            this.moveColumn(start, end_index+(start_index<end_index?1:0));
                            this._last_sort_dnd_node = id.column;
                            this._column_dnd_temp_block = true;
                        }
                    } if (id && id.column == start){
                        //flag prevent flickering just after column move
                        this._column_dnd_temp_block = false;
                    }

                    node.style.display = 'block';

                    pos.x = pos.x - this._relative_column_drag.x;
                    pos.y = box.y;

                    if (pos.x < box.x)
                        pos.x = box.x; 
                    else {
                        var max = box.x + this.$view.offsetWidth - this._scrollSizeY-this._limit_column_drag;
                        if (pos.x > max)
                            pos.x = max;
                    }
                    webix.DragControl._skip = true;
                
                }, this),
                $dragDestroy:webix.bind(function(a, node){
                    webix.html.remove(node);
                    //clean dnd source element
                    if(this._dragTarget)
                        webix.html.remove(this._dragTarget);
                    var id = webix.DragControl.getContext().start;
                    this.callEvent("onAfterColumnDropOrder",[id.column, this._last_sort_dnd_node, a]);
                }, this)
            };
        } else if (value) {
            control = {
                _inner_drag_only:true,
                $drag:webix.bind(function(s,e){
                    var id = this.locate(e);
                    if (this._rs_process || !id || !this.callEvent("onBeforeColumnDrag", [id.column, e])) return false;
                    webix.DragControl._drag_context = { from:control, start:id, custom:"column_dnd" };

                    var header = this.getColumnConfig(id.column).header;
                    var text = "&nbsp;";
                    for (var i = 0; i < header.length; i++)
                        if (header[i]){
                            text = header[i].text;
                            break;
                        }

                    return "<div class='webix_dd_drag_column'>"+text+"</div>";
                }, this),
                $drop:webix.bind(function(s,t,e){
                    var target = e;
                    //on touch devices event doesn't point to the actual drop target
                    if(e.touches && this._drag_column_last)
                        target = this._drag_column_last;

                    var id = this.locate(target);

                    if (!id) return false;
                    var start = webix.DragControl.getContext().start.column;
                    if (start != id.column){
                        if (!this.callEvent("onBeforeColumnDrop",[start, id.column ,e])) return;
                        var start_index = this.getColumnIndex(start);
                        var end_index = this.getColumnIndex(id.column);

                        this.moveColumn(start, end_index+(start_index<end_index?1:0));
                        this.callEvent("onAfterColumnDrop",[start, id.column, e]);
                    }
                }, this),
                $dragIn:webix.bind(function(s,t,e){
                    var context = webix.DragControl.getContext();
                    //ignore normal dnd , and dnd from other components
                    
                    if (context.custom != "column_dnd" || context.from != control) return false;

                    var target = (e.target||e.srcElement);
                    while ((target.className||"").indexOf("webix_hcell") == -1){
                        target = target.parentNode;
                        if (!target) return;
                    }

                    if (target != this._drag_column_last){  //new target
                        if (this._drag_column_last)
                            webix.html.removeCss(this._drag_column_last, "webix_dd_over_column");
                        webix.html.addCss(target, "webix_dd_over_column");
                    }

                    return (this._drag_column_last = target);
                }, this),
                $dragDestroy:webix.bind(function(a,h){
                    if (this._drag_column_last)
                        webix.html.removeCss(this._drag_column_last, "webix_dd_over_column");
                    webix.html.remove(h);
                }, this)
            };
        }

        if (value){
            webix.DragControl.addDrag(this._header, control);
            webix.DragControl.addDrop(this._header, control, true);
        }
    }
});
webix.extend(webix.ui.datatable,webix.DragItem);
webix.extend(webix.ui.datatable, {
    _mark_invalid:function(id, details){
        this._clear_invalid_css(id);
        for (var key in details)
            this.addCellCss(id, key, "webix_invalid_cell");

        this.addCss(id, "webix_invalid");
    },
    _clear_invalid:function(id){
        this._clear_invalid_css(id);
        this.removeCss(id, "webix_invalid");
    },
    _clear_invalid_css:function(id){
        var item = this.getItem(id);
        var mark = this.data.getMark(id, "$cellCss");
        if (mark){
            for (var key in mark)
                mark[key] = mark[key].replace("webix_invalid_cell", "").replace("  "," ");
        }
    },

    addRowCss:function(id, css, silent){
        this.addCss(id, css, silent);
    },
    removeRowCss:function(id, css, silent){
        this.removeCss(id, css, silent);
    },
    addCellCss:function(id, name, css, silent){
        var mark = this.data.getMark(id, "$cellCss");
        var newmark = mark || {};

        var style = newmark[name]||"";
        newmark[name] = style.replace(css, "").replace("  "," ")+" "+css;

        if (!mark) this.data.addMark(id, "$cellCss", false, newmark, true);
        if (!silent)
            this.refresh(id);
    },
    removeCellCss:function(id, name, css, silent){
        var mark = this.data.getMark(id, "$cellCss");
        if (mark){
            var style = mark[name]||"";
            if (style)
                mark[name] = style.replace(css, "").replace("  "," ");
            if (!silent)
                this.refresh(id);
        }
    }
});
webix.extend(webix.ui.datatable, webix.ValidateCollection);

module.exports = webix;