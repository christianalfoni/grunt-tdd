var _ = require('lodash');
var suites;
var stats;
var getUnresolvedTest = function (name, isError) {
    var traverse = function (array, isTests) {
        var object,
            x,
            test;
        for (x = 0; x < array.length; x++) {
            object = array[x];
            // If it is a test array being traversed, it should check the name
            if (isTests && object.name === name && !object.result) {
                return object;
            }
            // If not test array and there are tests
            if (!isTests && object.tests.length) {
                test = traverse(object.tests, true); // Adds true to tell the traverse function that tests are being traversed
                if (test) {
                    object.hasError = object.hasError === true ? true : isError; // If error occurs, set error on context
                    return test;
                }
            }
            // If not test array and there are more contexts
            if (!isTests && object.contexts.length) {
                test = traverse(object.contexts);
                if (test) {
                    object.hasError = object.hasError === true ? true : isError; // If error occurs, set error on context
                    return test;
                }
            }
        }
    };
    return traverse(suites);
};
var createResult = function (type) {
    return function (test) {
        var result = {};
        result.type = type;
        if (test.error) {
            result.message = test.error.message;
            result.name = test.error.name;
            result.stack = test.error.stack;
        }
        addResult(test.name, result);
        stats[type]++;
    }
};

var addResult = function (name, result) {
    var test = getUnresolvedTest(name, (result.type !== 'success'));
    test.result = result;
};


var cleanSuites = function () {
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
};
var cleanTest = function (test) {
    for (var prop in test) {
        if (prop !== 'result' && prop !== 'name') {
            delete test[prop];
        }
    }
};

var cleanContext = function (context) {
    for (var prop in context) {
        if (prop !== 'name' && prop !== 'tests' && prop !== 'contexts') {
            delete context[prop];
        }
    }
}

module.exports = {
    create: function () {
        suites = [];
        stats = {
            success: 0,
            failure: 0,
            error: 0,
            timeout: 0,
            deferred: 0
        };
        return Object.create(this);
    },

    listen: function (runner) {
        runner.on('context:start', function (context) {
            if (!context.parent) {
                suites.push(context);
            }
        });
        runner.on('test:error', createResult('error'));
        runner.on('test:success', createResult('success'));
        runner.on('test:failure', createResult('failure'));

    },
    runSuite: function (runner, test) {
        var testCopy = _.cloneDeep(test);
        var promise = runner.runSuite([testCopy]);
        promise.then(function () {
            cleanSuites();
            runner.emit('grunt-tdd:ready', {
                suites: suites,
                stats: stats
            });;
        });
    }
};