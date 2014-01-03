var _ = require('lodash');
var p = {
    stats: {},
    suites: [],
    resetTest: function () {
        p.stats = {
            success: 0,
            error: 0,
            failure: 0,
            timeout: 0,
            deferred: 0
        };
        jasmine.getEnv().currentRunner().suites_ = []; // jasmine does not clean this array, have to do it myself
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
        traverse(p.suites)
        return {
            suites: p.suites,
            stats: p.stats
        };
    },
    cleanTest: function (test) {
        var isError = test.results_.failedCount > 0,
            errorItem;
        test.name = test.description;
        test.result = {};
        test.result.type = isError ? 'error' : 'success';
        p.stats[test.result.type]++;
        if (isError) {
            errorItem = p.getErrorItem(test.results_.items_);
            test.result.message = errorItem.message;
            test.result.stack = errorItem.trace.stack;
        }
        for (var prop in test) {
            if (prop !== 'result' && prop !== 'name') {
                delete test[prop];
            }
        }
    },
    cleanContext: function (context) {
        context.name = context.description;
        context.tests = context.specs_;
        context.contexts = context.suites_;
        for (var prop in context) {
            if (prop !== 'name' && prop !== 'tests' && prop !== 'contexts') {
                delete context[prop];
            }
        }
    },
    getErrorItem: function (items) {
        var x;
        for (x = 0; x < items.length; x++) {
            if (!items[x].passed_) return items[x];
        }
    }
};


module.exports = {
    run: function (options, selectedTest, callback) {
        var testRunner = require('jasmine-node'),
            result,
            tests = options.files.tests,
            test;

        // Have to overwrite global expect since jasmine-node puts its own
        if (options.expect) global.expect = require('expect.js');
        p.resetTest();

        // Get test and handle any syntax error
        try {
            test = require(process.cwd() + '/' + tests[selectedTest]);
        } catch (e) {
            return callback({
                error: 'Bad syntax in file ' + tests[selectedTest] + '\n' + e.stack
            });
        }

        // Remove cached to enable reloading of file
        delete require.cache[process.cwd() + '/' + tests[selectedTest]];

        jasmine.getEnv().currentRunner().finishCallback = function () {
            p.suites = _.cloneDeep(jasmine.getEnv().currentRunner().suites_);
            result = p.cleanSuites();
            callback(result);
        }

        jasmine.getEnv().execute();

    },
    runAll: function (options, grunt, done) {

        var testRunner = require('jasmine-node'),
            testsToRun = [],
            tests = options.files.tests,
            test;

        // Have to overwrite global expect since jasmine-node puts its own
        if (options.expect) global.expect = require('expect.js');
        p.resetTest();

        // Get test and handle any syntax error
        try {
            tests.forEach(function (test) {
                var testToRun = require(process.cwd() + '/' + test);
                testsToRun.push(testToRun);
                delete require.cache[process.cwd() + '/' + test];
            });
        } catch (e) {
            return grunt.log.error('Bad syntax in test file', e.stack);
        }

        jasmine.getEnv().currentRunner().finishCallback = function () {
            p.suites = jasmine.getEnv().currentRunner().suites_;
            p.cleanSuites();
            if (p.stats.error === 0 && p.stats.failure === 0) {
                grunt.log.ok(':-)'.green.bold + ' (' + p.stats.success + ')');
                done();
            } else {
                grunt.log.error(':-/'.red.bold + ' (' + (p.stats.error + p.stats.failure) + '/' + (p.stats.error + p.stats.failure + p.stats.success) + ')');
                done(false);
            }
        }

        jasmine.getEnv().execute();

    }

}
