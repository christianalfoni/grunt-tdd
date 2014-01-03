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
    },
    createStack: function (stack) {
        var reducedStack = [];
        if (stack) { // Should assertion library causes no stack;
            stack = stack.split((stack.indexOf('\\n') >= 0 ? '\\n' : '\n')); // \\n is used by Node to support JSON stringify
            stack.forEach(p.createStackLinesToArrayIterator(reducedStack));
        }
        return reducedStack;
    },
    createStackLinesToArrayIterator: function (array) {
        return function (stackLine) {
            if (!stackLine.match(/(?:reporter|expect|test-runner|when|lodash|runner|runnable|should|chai).js/)) { // Removes any lines from the reporter
                // Kick ass regexp to extract filepath, name and line number
                // http://www.regexper.com/#%2F(http%3A%5C%2F%5C%2F.%2B%3F%3A%5B0-9a-z%5C%2F-%5D%2B%5C%2F)(%5Cw%2B%5C.%5Cw%2B)%3A(%5Cd%2B)%2F
                var validStackLine = stackLine.match(/((?:http:\/\/.+?:|\/).+\/)([0-9a-zA-Z\/-]+\.\w+):(\d+)/);
                if (!validStackLine) return;
                array.push({
                    path: validStackLine[1],
                    file: validStackLine[2],
                    lineNumber: validStackLine[3]
                });
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
    },
    runAll: function (tests, grunt, done) {
        var testRunner = require('mocha'),
            runner = new testRunner({
                ignoreLeaks: false,
                ui: 'bdd'
            }),
            result;

        p.resetTest();
        grunt.log.writeln();
        runner._reporter = function TerminalReporter (runner) {

            runner.on('pass', function(test){
                p.stats.success++;
            });

            runner.on('fail', function(test, err){
                p.stats.error++;
                grunt.log.errorlns(test.title + ' - ' + err);
                var stacks = p.createStack(err.stack);
                stacks.forEach(function (stack) {
                    grunt.log.writeln('Line ' + stack.lineNumber + ' at ' + stack.path + stack.file)
                });
                grunt.log.writeln();
            });

            runner.on('end', function(){
                if (p.stats.error === 0 && p.stats.failure === 0) {
                    grunt.log.ok(':-)'.green.bold + ' (' + p.stats.success + ')');
                    done();
                } else {
                    grunt.log.error(':-/'.red.bold + ' (' + (p.stats.error + p.stats.failure) + '/' + (p.stats.error + p.stats.failure + p.stats.success) + ')');
                    done(false);
                }
            });
        };

        tests.forEach(function (test) {
            runner.addFile(process.cwd() + '/' + test); // Adds test to runner
        });

        runner.run(function () {
            p.suites = runner.suite.suites;
            result = p.cleanSuites();
            done();
        });
    }

}