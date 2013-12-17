var _ = require('lodash');

var p = {
    suites: [],
    stats: {},
    getUnresolvedTest: function (name, isError) {
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
        return traverse(p.suites);
    },
    createResult: function (type) {
        return function (test) {
            var result = {};
            result.type = type;
            if (test.error) {
                result.message = test.error.message;
                result.name = test.error.name;
                result.stack = test.error.stack;
            }
            p.addResult(test.name, result);
            p.stats[type]++;
        }
    },
    addResult: function (name, result) {
        var test = p.getUnresolvedTest(name, (result.type !== 'success'));
        test.result = result;
    },
    cleanSuites: function () {
        var traverse = function (array, isTests) {
            var x,
                object;
            for (x = 0; x < array.length; x++) {
                object = array[x];
                if (isTests) {
                    p.cleanTest(object);
                } else {
                    p.cleanContext(object);
                    if (object.tests.length) {
                        traverse(object.tests, true);
                    }
                    if (object.contexts.length) {
                        traverse(object.contexts);
                    }
                }
            }
        };
        traverse(p.suites);
    },
    cleanTest: function (test) {
        for (var prop in test) {
            if (prop !== 'result' && prop !== 'name') {
                delete test[prop];
            }
        }
    },
    cleanContext: function (context) {
        for (var prop in context) {
            if (prop !== 'name' && prop !== 'tests' && prop !== 'contexts') {
                delete context[prop];
            }
        }
    },
    resetTest: function () {
        p.stats = {
            success: 0,
            error: 0,
            failure: 0,
            timeout: 0,
            deferred: 0
        };
        p.suites = [];

    },
    reporter: {
        create: function () {
            return Object.create(this);
        },

        listen: function (runner) {
            runner.on('context:start', function (context) {
                if (!context.parent) {
                    p.suites.push(context);
                }
            });
            runner.on('test:error', p.createResult('error'));
            runner.on('test:success', p.createResult('success'));
            runner.on('test:failure', p.createResult('failure'));

        },
        runSuite: function (runner, test) {
            var testCopy = _.cloneDeep(test);
            var promise = runner.runSuite([testCopy]);
            promise.then(function () {
                p.cleanSuites();
                runner.emit('grunt-tdd:ready', {
                    suites: p.suites,
                    stats: p.stats
                });
            });
        }
    }
};


module.exports = {
    run: function (tests, selectedTest, callback) {
        var testRunner = require('buster-test').testRunner,
            runner = testRunner.create({random: false}),
            reporter = p.reporter.create(),
            test;

        p.resetTest();

        runner.on('grunt-tdd:ready', callback);
        runner.on('grunt-tdd:failed', callback);

        // Get test and handle any syntax error
        try {
            test = require(process.cwd() + '/' + tests[selectedTest]);
        } catch (e) {
            return runner.emit('grunt-tdd:failed', {
                error: 'Bad syntax in file ' + tests[selectedTest] + '\n' + e.stack
            });
        }

        // Remove cached to enable reloading of file
        delete require.cache[process.cwd() + '/' + tests[selectedTest]];

        // If test is empty object it means that nothing is exported, give error
        if (_.isEmpty(test)) {
            return runner.emit('grunt-tdd:failed', {
                error: 'No exports, remember putting module.exports in ' + tests[selectedTest]
            });
        }

        reporter.listen(runner);
        reporter.runSuite(runner, test);
    }
};