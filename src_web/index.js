// var webix = require("../lib/webix/webix-button");
// require("../lib/webix/webix-window");
// require("../lib/webix/webix-spacer");
// require("../lib/webix/webix-layout");
// require("../lib/webix/webix-list");
require("../lib/webix/webix-label");


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
var label = webix.ui({
    view:"label",
    label: "Labeddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddl",
    align:"left",
    autoheight: true,
    width: 200,
    line_height: 20
});
