
var cleanObject = function (object) {

    if (object.result) {

        for (var prop in object) {

            if (prop !== 'deferred' && prop !== 'result' && prop !== 'name') {
                delete object[prop];
            }

        }

    } else {

        for (var prop in object) {

            if (prop !== 'tests' && prop !== 'contexts' && prop !== 'name' && prop !== 'hasError') {
                delete object[prop];
            }

        }

        cleanArray(object.contexts);
        cleanArray(object.tests);

    }




}

var cleanArray = function (array) {

    array.forEach(cleanObject);

}


module.exports = function (suites) {

        cleanArray(suites);

}