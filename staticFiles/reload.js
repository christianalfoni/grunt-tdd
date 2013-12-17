var reload = function () {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/reload", true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200 && xhr.responseText === "reload") {
            location.reload();
        } else if (xhr.readyState == 4 && xhr.status == 200) {
            setTimeout(function () {
                reload();
            }, 100);
        }
    }
    xhr.send();
}
reload();