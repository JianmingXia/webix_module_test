// var webix = require("../lib/webix/webix-button");
require("../lib/webix/webix-window");
require("../lib/webix/webix-spacer");
require("../lib/webix/webix-layout");
require("../lib/webix/webix-list");
require("../lib/webix/webix-label");
require("../lib/webix/webix-datatable");
require("../lib/webix/webix-combo");

webix.ui({
    view:"combo", label: 'Combo', value:"1", yCount: 3,
    options:[
        {id:1, value:"One"},
        {id:2, value:"Two"},
        {id:3, value:"Three"},
        {id:4, value:"Three"}
    ],
    body: {
        yCount: 3
    }
});

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
