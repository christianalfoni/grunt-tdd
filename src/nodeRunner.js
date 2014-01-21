var _ = require('lodash'),
    stack = require('./stackExtractor');

var p = {
    suites: [],
    stats: {},
    runner: null,
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
    loadRunner: function (options) {
        switch (options.runner) {
            case 'buster':
                var testRunner = require('buster-test').testRunner,
                    runner = testRunner.create({random: false});
                p.buster.reporter.create().listen(runner, options);
                return runner;
            case 'mocha':
                var TestRunner = require('mocha'),
                    runner = new TestRunner({
                        ignoreLeaks: false,
                        ui: 'bdd'
                    });
                runner._reporter = p.mocha.reporter.create(options);
                return runner;
            case 'jasmine':
                require('jasmine-node');
                // Have to overwrite global expect since jasmine-node puts its own
                if (options.expect) global.expect = require('expect.js');
                require('./../libs/jasmineTraceFix');
                break;
        }
    },
    cleanSuites: function (suites, cleanContext, cleanTest) {
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
    },
    createWriteResult: function (options, type) {
        return function (test) {
            var error;
            if (type === 'error') {
                error = test.error || test.result; // Buster gives an error object on the fly
                options.grunt.log.errorlns(test.name + ' - ' + error.message);
                var stacks = stack.extract(error.stack);
                stacks.forEach(function (stack) {
                    options.grunt.log.writeln('Line ' + stack.lineNumber + ' at ' + stack.path + stack.file)
                });
                options.grunt.log.writeln();
            }
            if (options.runner === 'buster' || options.runAll) p.stats[type]++;

        }
    },
    writeEndResult: function (options) {
        if (p.stats.error === 0 && p.stats.failure === 0) {
            options.grunt.log.ok(':-)'.green.bold + ' (' + p.stats.success + ')');
            options.grunt.log.writeln();
            options.done();
        } else {
            options.grunt.log.error(':-/'.red.bold + ' (' + p.stats.success + '/' + (p.stats.error + p.stats.failure + p.stats.success) + ')');
            options.grunt.log.writeln();
            options.done(false);
        }
    },
    mocha: {
        // Needs a reporter to extract error message and stack. It is added to the test object
        reporter: {
            create: function (options) {
                return function TerminalReporter(runner) {
                    runner.on('fail', function (test, err) {
                        test.err = err;
                    });
                }
            }
        },
        loadTests: function (runner, options) {
            var testsToRun = [];
            options.tests.forEach(function (test) {
                runner.addFile(process.cwd() + '/' + test); // Adds test to runner
                delete require.cache[process.cwd() + '/' + test]; // Remove cached to enable reloading of file
            });
            return testsToRun;
        },
        runSuites: function (runner, tests, options) {
            if (options.node) options.grunt.log.writeln();
            runner.run(function () {

                p.suites = runner.suite.suites;
                p.cleanSuites(p.suites, p.mocha.cleanContext, p.mocha.createCleanTest(options));
                if (options.node) p.writeEndResult(options);
                else options.done({
                    suites: p.suites,
                    stats: p.stats
                });
            });
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
        createCleanTest: function (options) {
            var writeError;
            if (options.node) writeError = p.createWriteResult(options, 'error');
            return function (test) {
                var isError = test.state === 'failed';
                test.name = test.title;
                test.result = {};
                test.result.type = isError ? 'error' : 'success';
                if (isError) {
                    test.result.message = test.err.message;
                    test.result.stack = test.err.stack;
                }
                if (isError && writeError) {
                    writeError(test);
                } else {
                    p.stats.success++;
                }
                for (var prop in test) {
                    if (prop !== 'result' && prop !== 'name') {
                        delete test[prop];
                    }
                }
            }
        }
    },
    jasmine: {
        loadTests: function (runner, options) {
            var testsToRun = [],
                testToRun;
            options.tests.forEach(function (test) {
                testToRun = require(process.cwd() + '/' + test);
                testsToRun.push(testToRun);
                // Remove cached to enable reloading of file
                delete require.cache[process.cwd() + '/' + test];
            });
            return testsToRun;
        },
        runSuites: function (runner, tests, options) {
            if (options.node) options.grunt.log.writeln();
            jasmine.getEnv().currentRunner().finishCallback = function () {
                p.suites = jasmine.getEnv().currentRunner().suites_;
                p.cleanSuites(p.suites, p.jasmine.cleanContext, p.jasmine.createCleanTest(options));
                p.writeEndResult(options);
            }
            jasmine.getEnv().execute();
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
        createCleanTest: function (options) {
            var writeError;
            if (options.node) {
                writeError = p.createWriteResult(options, 'error');
            }
            return function (test) {
                console.log('adding test!');
                var isError = test.results_.failedCount > 0,
                    errorItem;
                test.name = test.description;
                test.result = {};
                test.result.type = isError ? 'error' : 'success';
                if (isError) {
                    errorItem = p.jasmine.getErrorItem(test.results_.items_);
                    test.result.message = errorItem.message;
                    test.result.stack = errorItem.trace.stack;
                }

                if (isError && writeError) {
                    writeError(test);
                } else {
                    p.stats.success++;
                }
                for (var prop in test) {
                    if (prop !== 'result' && prop !== 'name') {
                        delete test[prop];
                    }
                }
            }
        },
        getErrorItem: function (items) {
            var x;
            for (x = 0; x < items.length; x++) {
                if (!items[x].passed_) return items[x];
            }
        }
    },
    buster: {
        reporter: {
            create: function () {
                return Object.create(this);
            },

            listen: function (runner, options) {
                if (options.node) {
                    runner.on('test:error', p.createWriteResult(options, 'error'));
                    runner.on('test:success', p.createWriteResult(options, 'success'));
                    runner.on('test:failure', p.createWriteResult(options, 'failure'));
                } else {
                    runner.on('context:start', function (context) {
                        if (!context.parent) {
                            p.suites.push(context);
                        }
                    });
                    runner.on('test:error', p.buster.createResult('error'));
                    runner.on('test:success', p.buster.createResult('success'));
                    runner.on('test:failure', p.buster.createResult('failure'));
                }
            }
        },
        loadTests: function (runner, options) {
            var testsToRun = [],
                testToRun;
            options.tests.forEach(function (test) {
                testToRun = require(process.cwd() + '/' + test);
                if (_.isEmpty(testToRun)) throw Error('No exports, remember putting module.exports in ' + test);
                testsToRun.push(testToRun);
                // Remove cached to enable reloading of file
                delete require.cache[process.cwd() + '/' + test];
            });
            return testsToRun;
        },
        runSuites: function (runner, tests, options) {
            var promise;
            if (options.node) options.grunt.log.writeln();
            else tests = _.cloneDeep(tests);
            promise = runner.runSuite(tests);
            promise.then(function () {
                if (options.node) {
                    p.writeEndResult(options);
                } else {
                    p.cleanSuites(p.suites, p.buster.cleanContext, p.buster.cleanTest);
                    options.done({
                        suites: p.suites,
                        stats: p.stats
                    });
                }
            });
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
                p.buster.addResult(test.name, result);
                p.stats[type]++;
            }
        },
        addResult: function (name, result) {
            var test = p.buster.getUnresolvedTest(name, (result.type !== 'success'));
            test.result = result;
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
        }
    }
};


module.exports = {
    run: function (options) {
        if (options.node) {
            var runner = p.loadRunner(options),
                testsToRun;

            p.resetTest();
            try {
                testsToRun = p[options.runner].loadTests(runner, options);
            } catch (e) {
                var message = e.message.match(/No exports/) ? e.message : e.message + '\n' + e.stack;
                if (options.node) {
                    options.grunt.log.errorlns(message);
                    return options.done(false);
                } else
                    return options.done({
                        error: message
                    });
            }
            p[options.runner].runSuites(runner, testsToRun, options);
        } else {

            var phantom = require('node-phantom'),
                writeResults = {
                    error: p.createWriteResult(options, 'error'),
                    success: p.createWriteResult(options, 'success')
                };
            p.resetTest();
            options.grunt.log.writeln();
            phantom.create(function (err, ph) {
                return ph.createPage(function (err, page) {
                    page.onConsoleMessage = function (msg) {
                        try {
                            if (msg === 'DONE') {
                                p.writeEndResult(options);
                            } else if (msg.indexOf('__GRUNT-TDD') > -1) {
                                var test = JSON.parse(msg);
                                writeResults[test['__GRUNT-TDD'].result.type](test['__GRUNT-TDD']);
                            }
                        } catch (e) {
                                console.log(e);
                        }
                    };
                    return page.open('http://localhost:3001/', function (err, status) {

                    });
                });
            });
        }

    }
};