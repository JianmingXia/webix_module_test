// var webix = require("../lib/webix/webix-button");
require("../lib/webix/webix-window");
require("../lib/webix/webix-spacer");
require("../lib/webix/webix-layout");
require("../lib/webix/webix-list");
require("../lib/webix/webix-label");
require("../lib/webix/webix-datatable");
require("../lib/webix/webix-combo");
require("../lib/webix/webix-dataview");
require("../lib/webix/webix-contextmenu");
require("../lib/webix/webix-tree");
require("../lib/webix/webix-toolbar");

// webix.ui({
//     view: "datatable",
//     columns: [
//         { id: "rank", header: "", width: 50 },
//         { id: "title", header: "Film title", width: 200 },
//         { id: "year", header: "Released", width: 80 },
//         {
//             id: "votes", header: "Votes", width: 100,
//             template: function (obj) {
//                 debugger;
//                 return "[" + obj.Votes + "]";
//             }
//         }
//     ],
//     data: [
//         { id: 1, title: "The Shawshank Redemption", year: 1994, votes: 678790, rank: 1 },
//         { id: 2, title: "The Godfather", year: 1972, votes: 511495, rank: 2 }
//     ]
// });

webix.protoUI({
    name: "editdataview"
}, webix.EditAbility, webix.ui.dataview);

var dataview = webix.ui({
    view: "editdataview",
    id: "dataview1",
    xCount: 3,
    editable: true,
    editaction: "click",
    navigation: true,
    editor: "text",
    margin_height: 5,
    item_margin: 20,
    type: {
        height: 60,
    },
    template: "<div class='webix_strong'>#title#</div> Year: #year#, rank: #rank#",
    // template: function() {
    //     debugger;
    //     return "xxxxxx";
    // },
    data: [
        { id: 1, title: "The Shawshank Redemption", year: 1994, rank: 1 },
        { id: 2, title: "The Godfather", year: 1972, rank: 2 },
        { id: 3, title: "The Godfather: Part II", year: 1974, rank: 3 },
        { id: 4, title: "The Good, the Bad and the Ugly", year: 1966, rank: 4 }
    ] 
});

// webix.ui({
//     view: "toolbar",
//     margin: 20,
//     cols: [
//         { view: "button", value: "Load" },
//         { view: "button", value: "Save" },
//         { view: "button", value: "Delete" }
//     ]
// });

// var small_film_set = [
//     { id: 1, title: "The Shawshank Redemption", year: 1994, votes: 678790, rating: 9.2, rank: 1 },
//     { id: 2, title: "The Godfather", year: 1972, votes: 511495, rating: 9.2, rank: 2 },
//     { id: 3, title: "The Godfather: Part II", year: 1974, votes: 319352, rating: 9.0, rank: 3 },
//     { id: 4, title: "The Good, the Bad and the Ugly", year: 1966, votes: 213030, rating: 8.9, rank: 4 },
//     { id: 5, title: "My Fair Lady", year: 1964, votes: 533848, rating: 8.9, rank: 5 },
//     { id: 6, title: "12 Angry Men", year: 1957, votes: 164558, rating: 8.9, rank: 6 }
// ];
// webix.ui({
//     view: "dataview",
//     id: "dataview",
//     height: 120,
//     data: small_film_set,
//     template: "<div style='width:240px; height:60px;'><div class='webix_strong'>#title#</div> Year: #year#, rank: #rank#</div>",
//     sizeToContent: true
// });

// webix.ui({
//     view: "list",
//     id: "list",
//     width: 250,
//     height: 120,
//     template: "#title#",
//     select: true,
//     data: [
//         { id: 1, title: "Item 1" },
//         { id: 2, title: "Item 2" },
//         { id: 3, title: "Item 3" }
//     ]
// });

// webix.ui({
//     view: "datatable",
//     id: "datatable",
//     height: 120,
//     columns: [
//         { id: "rank", header: "", width: 50 },
//         { id: "title", header: "Film title", width: 200 },
//         { id: "year", header: "Released", width: 80 },
//         { id: "votes", header: "Votes", width: 100 }
//     ],
//     data: [
//         { id: 1, title: "The Shawshank Redemption", year: 1994, votes: 678790, rank: 1 },
//         { id: 2, title: "The Godfather", year: 1972, votes: 511495, rank: 2 }
//     ]
// });

// webix.ui({
//     view: "tree",
//     id: "tree",
//     select: true,
//     height: 120,
//     data: [
//         {
//             id: "root", value: "Cars", open: true, data: [
//                 {
//                     id: "1", open: true, value: "Toyota", data: [
//                         { id: "1.1", value: "Avalon" },
//                         { id: "1.2", value: "Corolla" },
//                         { id: "1.3", value: "Camry" }
//                     ]
//                 },
//                 {
//                     id: "2", value: "Skoda", open: true, data: [
//                         { id: "2.1", value: "Octavia" },
//                         { id: "2.2", value: "Superb" }
//                     ]
//                 }
//             ]
//         }
//     ]
// });

// webix.ui({
//     view: "contextmenu",
//     id: "contextmenu",
//     data: [
//         "Add",
//         "Rename",
//         "Delete",
//         { $template: "Separator" }
//         , "Info"
//     ],
// });

// debugger;
// $$("contextmenu").attachTo($$("dataview").getNode());
// $$("contextmenu").attachTo($$("list").$view);
// $$("contextmenu").attachTo($$("datatable").$view);
// $$("contextmenu").attachTo($$("tree"));

// $$('dataview').attachEvent('onBeforeContextMenu', function (id, e, node) {
//     debugger;
// });

// $$('list').attachEvent('onBeforeContextMenu', function (id, e, node) {
//     debugger;
// });

// $$('datatable').attachEvent('onBeforeContextMenu', function (id, e, node) {
//     debugger;
// });


// $$('tree').attachEvent('onBeforeContextMenu', function (id, e, node) {
//     debugger;
// });
// webix.ui({
//     view:"combo", label: 'Combo', value:"1", yCount: 3,
//     options:[
//         {id:1, value:"One"},
//         {id:2, value:"Two"},
//         {id:3, value:"Three"},
//         {id:4, value:"Three"}
//     ],
//     body: {
//         yCount: 3
//     }
// });

// var button = webix.ui({
//     rows: [
//         {
//             height: 300
//         },
//         {
//             cols:[
//                 {
//                     view:"button",
//                     value:"Button",
//                     inputWidth:100
//                 },
//                 {
//                     view:"button",
//                     id:"my_button",
//                     value:"Button",
//                     inputWidth:100
//                 },
//                 {
//                     view:"button",
//                     value:"Button",
//                     inputWidth:100
//                 }
//             ]
//         }
//     ]
// });

// if (!webix.env.touch && webix.ui.scrollSize) {
//     webix.CustomScroll.init();
// }
//
// var list = webix.ui({
//   view:"list",
//   width:250,
//   height:200,
//   template:"#title#",
//   id:"list",
//   select:true,
//   // scroll: false,
//   data:[
//     { id:1, title:"Item 1"},
//     { id:2, title:"Item 2"},
//     { id:3, title:"Item 3"},
//         { id:11, title:"Item 1"},
//     { id:12, title:"Item 2"},
//     { id:13, title:"Item 3"},
//     { id:112, title:"Item 2"},
//     { id:113, title:"Item 3"}
//   ]
// });


// document.body.onmousewheel = function(event) {
//     event = event || window.event;
//     console.dir(event);
//     event.stopPropagation();
//     event.preventDefault();
// };

// webix.ui({
//     view:"window",
//     id:"my_win",
//     head: false,
//     width: 100,
//     body:{
//         view:"list",
//         template:"#title#",
//         scroll: false,
//         data:[
//             { id:1, title:"权限管理"},
//         ]
//     }
// }).show();

// autowidth 属性
// var label = webix.ui({
//     view:"label",
//     label: "Labeddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddl",
//     align:"left",
//     autoheight: true,
//     width: 200,
//     line_height: 20
// });


//
// function textLength(a,b){
// 	a = a.title.toString().length;
// 	b = b.title.toString().length;
// 	return a>b?1:(a<b?-1:0);
// };
//
// function sortByParam(a,b){
//     if(a.type != b.type) {
//         return 0;
//     }
// 	a = a.votes;
// 	b = b.votes;
// 	return a>b?1:(a<b?-1:0);
// }
// var small_film_set = [
// 	{ id:1, title:"The Shawshank Redemption", year:1994, votes:678790, rating:9.2, rank:1, category:"Thriller",type:"dir"},
// 	{ id:2, title:"The Godfather", year:1972, votes:511495, rating:9.2, rank:2, category:"Crime",type:"dir"},
// 	{ id:3, title:"The Godfather: Part II", year:1974, votes:319352, rating:9.0, rank:3, category:"Crime",type:"dir"},
// 	{ id:4, title:"The Good, the Bad and the Ugly", year:1966, votes:213030, rating:8.9, rank:4, category:"Western",type:"file"},
// 	{ id:5, title:"Pulp fiction", year:1994, votes:533848, rating:8.9, rank:5, category:"Crime",type:"file"},
// 	{ id:6, title:"12 Angry Men", year:1957, votes:164558, rating:8.9, rank:6, category:"Western",type:"file"}
// ];
//
// webix.ui({
//     width: 1500,
//     cols: [
//         {
//             view:"datatable",
//             id: "datatable",
//             height:800,
//             width:800,
//         	columns:[
//         		{ id:"rank",	header:"", css:"rank",
//                     adjust: true, 		fillspace: 4},
//         		{ id:"year",	header:"Released" ,
//                     adjust: true,fillspace: 1 },
//         		{ id:"title",	header:"Film title",
//                     adjust: true,fillspace: 1, sort: textLength},
//         		{ id:"votes",	header:"Votes",
//                     adjust: true,	fillspace: 1,	sort:sortByParam}
//         	],
//         	data:small_film_set
//         },
//         {
//             view: 'label',
//             label: "sdfs"
//         }
//     ]
// });
//
// debugger;
// $$("datatable").sort(textLength,"asc");
