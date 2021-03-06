// MUSIC PAGE: opens a selected tab while hiding the rest
function openSection(e, selection) {

    // decalre all variables
    var i, tabContent, option;

    // gets elements with class="tabContent"
    tabContent = document.getElementsByClassName("tabContent");
    for (i = 0; i < tabContent.length; i++) {
        tabContent[i].style.display = "none";
    }

    // get all elements with class="option" and remove class "active"
    option = document.getElementsByClassName("option");
    for (i = 0; i < option.length; i++) {
        option[i].className = option[i].className.replace(" active", "");
    }

    // show current tab + add active label to button of tab
    document.getElementById(selection).style.display = "block";
    e.currentTarget.className += " active";
}

function filterPhotos(e, label) {
    var x, gallery, filter;

    gallery = document.getElementsByClassName("gallery");
    for (x = 0; x < gallery.length; x++) {
        gallery[x].style.display = "none";
    }

    filter = document.getElementsByClassName("filter");
    for (x = 0; x < filter.length; x++) {
        filter[x].className = filter[x].className.replace(" active", "");
    }

    document.getElementById(label).style.display = "block";
    e.currentTarget.className += " active";
}



