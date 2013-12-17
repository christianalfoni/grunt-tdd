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
        p.suites = [];
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
        return {
            suites: p.suites,
            stats: p.stats
        }
    },
    cleanTest: function (test) {
        var isError = typeof test.err !== 'undefined';
        test.name = test.title;
        test.result = {};
        test.result.type = isError ? 'error' : 'success';
        p.stats[test.result.type]++;
        if (isError) {
            test.result.message = test.err.message;
            test.result.stack = test.err.stack;
        }
        for (var prop in test) {
            if (prop !== 'result' && prop !== 'name') {
                delete test[prop];
            }
        }
    },
    cleanContext: function (context) {
        context.name = context.title;
        context.contexts = context.suites;
        for (var prop in context) {
            if (prop !== 'name' && prop !== 'tests' && prop !== 'contexts') {
                delete context[prop];
            }
        }
    }
};


module.exports = {
    run: function (tests, selectedTest, callback) {
        var testRunner = require('mocha'),
            runner = new testRunner({
                ignoreLeaks: false,
                ui: 'bdd'
            }),
            result;

        runner.addFile(process.cwd() + '/' + tests[selectedTest]); // Adds test to runner
        delete require.cache[process.cwd() + '/' + tests[selectedTest]]; // Remove cached to enable reloading of file

        runner.run(function () {
            p.resetTest();
            p.suites = runner.suite.suites;
            result = p.cleanSuites();
            callback(result);
        });
    }
}