var stats;
var cleanSuites = function (suites) {
    stats = {
        success: 0,
        error: 0,
        failure: 0,
        timeout: 0,
        deferred: 0
    }
    var traverse = function (array, isTests) {
        var x,
            object;
        for (x = 0; x < array.length; x++) {
            object = array[x];
            if (isTests) {
                cleanTest(object);
            } else {
                cleanContext(object);
                if (object.tests.length) {
                    traverse(object.tests, true);
                }
                if (object.contexts.length) {
                    traverse(object.contexts);
                }
            }
        }
    };
    traverse(suites);
    return {
        suites: suites,
        stats: stats
    }
};
var cleanTest = function (test) {
    var isError = typeof test.err !== 'undefined';
    test.name = test.title;
    test.result = {};
    test.result.type = isError ? 'error' : 'success';
    stats[test.result.type]++;
    if (isError) {
        test.result.message = test.err.message;
        test.result.stack = test.err.stack;
    }
    for (var prop in test) {
        if (prop !== 'result' && prop !== 'name') {
            delete test[prop];
        }
    }
};

var cleanContext = function (context) {
    context.name = context.title;
    context.contexts = context.suites;
    for (var prop in context) {
        if (prop !== 'name' && prop !== 'tests' && prop !== 'contexts') {
            delete context[prop];
        }
    }
};

module.exports = cleanSuites;