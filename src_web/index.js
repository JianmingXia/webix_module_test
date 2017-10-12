require("../lib/webix/webix-datatable");

let datatable_checkbox = {};
function custom_checkbox(obj, common, value) {
    let operate = true;
    if (datatable_checkbox.hasOwnProperty(obj.id) && datatable_checkbox[obj.id] == value) {
        operate = false;
    }
    datatable_checkbox[obj.id] = value;

    if (value){
        if (operate) {
            $$("datatable_1").unselectAll();
        }
        $$("datatable_1").select(obj.id, true);
        if ($$("datatable_1").count() > 0 && $$("datatable_1").getSelectedId().length && $$("datatable_1").getSelectedId().length == $$("datatable_1").count()){
            $$("datatable_1").setHeaderCheckValue("ch1", true);
        }
        return "<input class='webix_table_checkbox' type='checkbox' checked='true' >";
    }
    else
    {
        if (operate) {
            $$("datatable_1").unselect(obj.id);
            $$("datatable_1").setHeaderCheckValue("ch1", false);
        }
        return "<input class='webix_table_checkbox' type='checkbox' />";
    }
}

function custom_checkbox2(obj, common, value) {
    if (value)
        return "<input class='webix_table_checkbox' type='checkbox' checked='true' >";
    else {
        return "<input class='webix_table_checkbox' type='checkbox' />";
    }
}

var small_film_set = [
    { id: 1, title: "The Shawshank Redemption", year: 1994, votes: 678790, rating: 9.2, rank: 1, category: "Thriller" },
    { id: 2, title: "The Godfather", year: 1972, votes: 511495, rating: 9.2, rank: 2, category: "Crime" },
    { id: 3, title: "The Godfather: Part II", year: 1974, votes: 319352, rating: 9.0, rank: 3, category: "Crime" },
    { id: 4, title: "The Good, the Bad and the Ugly", year: 1966, votes: 213030, rating: 8.9, rank: 4, category: "Western" },
    { id: 5, title: "Pulp fiction", year: 1994, votes: 533848, rating: 8.9, rank: 5, category: "Crime" },
    { id: 6, title: "12 Angry Men", year: 1957, votes: 164558, rating: 8.9, rank: 6, category: "Western" }
];

webix.ui({
    view: "datatable",
    id: "datatable_1",
    columns: [
        { id: "ch1", header: { content: "masterCheckbox" }, template: custom_checkbox, width: 40 },
        { id: "ch2", header: { content: "masterCheckbox" }, template: custom_checkbox2, width: 40 },
        { id: "title", sort: "string", header: "Film title", width: 200 },
        { id: "category", header: "Category", width: 80 },
        { id: "votes", header: "Votes", width: 100 }
    ],

    autoheight: true,
    autowidth: true,
    editable: true,
    checkboxRefresh: true,
    multiselect: true,
    select: "row",

    data: webix.copy(small_film_set)
});

$$("datatable_1").attachEvent("onBeforeSelect", function (data, preserve) {
    if(false == preserve) {
        for (let index in datatable_checkbox) {
            if (datatable_checkbox[index] == 1) {
                return false;
            }
        }
    }

    return true;
});