var _ = require('lodash'),
    stack = require('./stackExtractor'),
    cleaner = require('./suiteCleaner');

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
    writeResult: function (log, type) {
        return function (test) {
            if (test.error) {
                log.errorlns(test.name + ' - ' + test.error);
                var stacks = stack.extract(test.error.stack);
                stacks.forEach(function (stack) {
                    log.writeln('Line ' + stack.lineNumber + ' at ' + stack.path + stack.file)
                });
                log.writeln();
            }
            p.stats[type]++;
        }
    },
    reporter: {
        create: function (grunt) {
            if (grunt) this.log = grunt.log;
            return Object.create(this);
        },

        listen: function (runner, allTests) {
            if (allTests) {
                runner.on('test:error', p.writeResult(this.log, 'error'));
                runner.on('test:success', p.writeResult(this.log, 'success'));
                runner.on('test:failure', p.writeResult(this.log, 'failure'));
            } else {
                runner.on('context:start', function (context) {
                    if (!context.parent) {
                        p.suites.push(context);
                    }
                });
                runner.on('test:error', p.createResult('error'));
                runner.on('test:success', p.createResult('success'));
                runner.on('test:failure', p.createResult('failure'));
            }
        }
    },
    runSuites: function (runner, tests) {
        var testsCopy = _.cloneDeep(tests),
            promise = runner.runSuite(testsCopy);
        promise.then(function () {
            cleaner.clean(p.suites);
            runner.emit('grunt-tdd:ready', {
                suites: p.suites,
                stats: p.stats
            });
        });
    },
    writeEndResult: function (options) {
        console.log('writing end result!');
        if (p.stats.error === 0 && p.stats.failure === 0) {
            options.grunt.log.ok(':-)'.green.bold + ' (' + p.stats.success + ')');
            options.done();
        } else {
            options.grunt.log.error(':-/'.red.bold + ' (' + (p.stats.error + p.stats.failure) + '/' + (p.stats.error + p.stats.failure + p.stats.success) + ')');
            options.done(false);
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
        } catch (e) {
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
        p.runSuites(runner, [test]);
    },
    runAll: function (tests, grunt, done) {
        var testRunner = require('buster-test').testRunner,
            runner = testRunner.create({random: false}),
            reporter = p.reporter.create(grunt),
            testsToRun;

        p.resetTest();

        // Get test and handle any syntax error
        try {
            testsToRun = p.loadTests(tests);
        } catch (e) {
            return console.log('Bad syntax in test file', e.stack);
        }

        reporter.listen(runner, true);
        runner.on('suite:end', function () {
            p.writeEndResult(grunt, done);
        });
        grunt.log.writeln();
        runner.runSuite(testsToRun);
    }
};