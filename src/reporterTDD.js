(function (window) {

    /*
     ==== BUSTER TEST RUNNER
     */
    var buster = {
        initialize: function () {
            buster.overrideReporter();
            buster.registerEvents();
        },
        overrideReporter: function () {
            window.buster.reporters.html.addStats = function () {
            };
            window.buster.reporters.html.contextStart = function () {
            };
            window.buster.reporters.html.testSuccess = function () {
            };
            window.buster.reporters.html.testFailure = function () {
            };
            window.buster.reporters.html.testError = function () {
            };
            window.buster.reporters.html.testDeferred = function () {
            };
        },
        registerEvents: function () {
            window.buster.testRunner.on('context:start', buster.addTestSuite);
            window.buster.testRunner.on('test:success', buster.createResult('success'));
            window.buster.testRunner.on('test:failure', buster.createResult('error'));
            window.buster.testRunner.on('test:error', buster.createResult('error'));
            window.buster.testRunner.on('test:deferred', buster.createResult('deferred'));
            window.buster.testRunner.on('suite:end', reporterTDD.displayResults);
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
            return traverse(reporterTDD.suites);
        },
        addTestSuite: function (context) {
            if (!context.parent) { // No parent means buster.testCase
                reporterTDD.suites.push(context);
            }
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
                buster.addResult(test.name, result);
            }
        },
        addResult: function (name, result) {
            var test = buster.getUnresolvedTest(name, (result.type !== 'success'));
            if (!test) {
                reporterTDD.throw('Could not find any test with name: ' + name);
            }
            test.result = result;
            reporterTDD.stats[result.type]++;
        }
    };

    /*
     ==== JASMINE TEST RUNNER
     */
    var jasmine = {
        initialize: function () {
            var jasmineFinished = window.jasmine.getEnv().currentRunner().finishCallback;
            window.jasmine.getEnv().currentRunner().finishCallback = function () {
                jasmineFinished.call(this);
                reporterTDD.suites.push(window.jasmine.getEnv().currentRunner().suites_[0]);
                jasmine.cleanSuites();
                reporterTDD.displayResults();
            };
            window.jasmine.getEnv().execute();
        },
        cleanSuites: function () {
            var traverse = function (array, isTests) {
                var x,
                    object;
                for (x = 0; x < array.length; x++) {
                    object = array[x];
                    if (isTests) {
                        jasmine.cleanTest(object);
                    } else {
                        jasmine.cleanContext(object);
                        if (object.tests.length) {
                            traverse(object.tests, true);
                        }
                        if (object.contexts.length) {
                            traverse(object.contexts);
                        }
                    }
                }
            };
            traverse(reporterTDD.suites);
        },
        cleanTest: function (test) {
            var isError = test.results_.failedCount > 0,
                errorItem;
            test.name = test.description;
            test.result = {};
            test.result.type = isError ? 'error' : 'success';
            reporterTDD.stats[test.result.type]++;
            if (isError) {
                errorItem = jasmine.getErrorItem(test.results_.items_);
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

    /*
     ====== MOCHA TEST RUNNER
     - Does not remove properties not needed, as Mocha will need them
     */
    var mocha = {
        initialize: function () {
            var runner = window.mocha.run();
            runner.on('end', function () {
                reporterTDD.suites = window.mocha.suite.suites;
                mocha.cleanSuites();
                reporterTDD.displayResults();
            });
        },
        cleanSuites: function () {
            var traverse = function (array, isTests) {
                var x,
                    object;
                for (x = 0; x < array.length; x++) {
                    object = array[x];
                    if (isTests) {
                        mocha.cleanTest(object);
                    } else {
                        mocha.cleanContext(object);
                        if (object.tests.length) {
                            traverse(object.tests, true);
                        }
                        if (object.contexts.length) {
                            traverse(object.contexts);
                        }
                    }
                }
            };
            traverse(reporterTDD.suites);

        },
        cleanTest: function (test) {
            var isError = typeof test.err !== 'undefined';
            test.name = test.title;
            test.result = {};
            test.result.type = isError ? 'error' : 'success';
            reporterTDD.stats[test.result.type]++;
            if (isError) {
                test.result.message = test.err.message;
                test.result.stack = test.err.stack;
            }
        },
        cleanContext: function (context) {
            context.name = context.title;
            context.contexts = context.suites;
        }
    };

    var reporterTDD = {
        // PROPS
        runner: null,
        suites: [],
        stats: {
            success: 0,
            error: 0,
            timeout: 0,
            deferred: 0
        },
        collapse: localStorage.collapse ? JSON.parse(localStorage.collapse) : false,
        // RUNNERS
        runners: {
            buster: buster,
            jasmine: jasmine,
            mocha: mocha
        },
        // METHODS
        throw: function (message) {
            throw Error('reporterTDD(): ' + message);
        },
        displayError: function (error) {
            var element = reporterTDD.createElement('h1', 'error');
            element.innerHTML = error.replace(/\n/g, '<br/>');
            document.body.appendChild(element);
            document.body.style.display = 'block';
        },
        initialize: function () {
            reporterTDD.registerCollapseEvent();
            if (window.nodeSuites) {
                reporterTDD.suites = window.nodeSuites;
                reporterTDD.stats = window.nodeStats;
                window.addEventListener('load', reporterTDD.displayResults);
            } else if (window.nodeFailed) {
                reporterTDD.displayError(window.nodeFailed);
            } else {
                if (window.require) reporterTDD.runner.initialize();
                else window.addEventListener('load', reporterTDD.runner.initialize);
                window.addEventListener('load', reporterTDD.resetView);
            }
        },
        resetView: function () {
            var selector = document.getElementById('testSelector');
            document.body.innerHTML = '';
            document.body.appendChild(selector);
        },
        registerCollapseEvent: function () {
            document.body.addEventListener('keydown', function (event) {
                if (event.keyCode === 32) {
                    reporterTDD.collapse = !reporterTDD.collapse;
                    reporterTDD.toggleCollapse();
                    localStorage.collapse = reporterTDD.collapse;
                }
            });
        },
        toggleCollapse: function () {
            var results = document.getElementById('results');
            if (reporterTDD.collapse) {
                results.className = 'results collapse';
            } else {
                results.className = 'results';
            }
        },
        hasErrors: function () {
            if (reporterTDD.stats.error || reporterTDD.stats.timeout) {
                return true;
            } else {
                return false;
            }
        },
        createElement: function (tagName, className) {
            if (!tagName) {
                reporterTDD.throw('Can not create element, missing tagName');
            }
            var element = document.createElement(tagName.toUpperCase());
            if (className) element.className = className;
            return element;
        },
        createResultElement: function (test) {
            var element = reporterTDD.createElement('LI', 'test ' + test.result.type),
                name,
                errorMessage,
                stack;
            name = reporterTDD.createElement('SPAN');
            name.innerHTML = test.name;
            element.appendChild(name);
            if (test.result.type !== 'success') {
                errorMessage = reporterTDD.createElement('SPAN', 'error-message');
                errorMessage.innerHTML = test.result.message;
                element.appendChild(errorMessage);
                stack = reporterTDD.createStackElement(test.result.stack);
                element.appendChild(stack);
            }
            return element;
        },
        createStack: function (stack) {
            var reducedStack = [];
            if (stack) { // Should assertion library causes no stack;
                stack = stack.split((stack.indexOf('\\n') >= 0 ? '\\n' : '\n')); // \\n is used by Node to support JSON stringify
                stack.forEach(reporterTDD.createStackLinesToArrayIterator(reducedStack));
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
        },
        createStackElement: function (stack) {
            var wrapper = reporterTDD.createElement('DIV', 'stack'),
                stackArray = reporterTDD.createStack(stack);
            stackArray.forEach(function (stack) {
                var line = reporterTDD.createElement('DIV');
                line.innerHTML = '- Line <span class="lineNumber">' + stack.lineNumber + '</span> at ' + stack.path + '<span class="file">' + stack.file + '</span>';
                wrapper.appendChild(line);
            });
            return wrapper;
        },
        displayResults: function () {
            var wrapper = reporterTDD.createElement('DIV', 'reporterTDD');
            wrapper.appendChild(reporterTDD.createStats());
            wrapper.appendChild(reporterTDD.createResults());
            reporterTDD.resetView();
            document.body.appendChild(wrapper);
            document.body.style.display = 'block';
        },
        createStats: function () {
            var resultClass = (reporterTDD.hasErrors() ? 'error' : 'success'),
                statsWrapper = reporterTDD.createElement('DIV', 'stats ' + resultClass),
                resultElement = reporterTDD.createElement('DIV', 'result ' + resultClass),
                statElement;

            resultElement.innerHTML = reporterTDD.hasErrors() ? ':-/' : ':-)';
            statsWrapper.appendChild(resultElement);
            for (var stat in reporterTDD.stats) {
                statElement = reporterTDD.createElement('DIV', 'stat');
                statElement.innerHTML = stat + ': ' + reporterTDD.stats[stat];
                statsWrapper.appendChild(statElement);
            }
            return statsWrapper;
        },
        createResults: function () {
            var isPhantomJS = navigator.userAgent.indexOf('PhantomJS') >= 0;
            var wrapper = reporterTDD.createElement('UL', 'results' + (reporterTDD.collapse ? ' collapse' : '')),
                traverse = function (array, parentNode) {
                    var object,
                        x,
                        test,
                        list,
                        context;
                    for (x = 0; x < array.length; x++) {
                        object = array[x];

                        if (object.result) {
                            // TODO: Refactor
                            if (isPhantomJS) {
                                var logResult = {};
                                logResult.name = object.name;
                                logResult.result = {};
                                logResult.result.type = object.result.type;
                                if (object.result.type === 'error') {
                                    logResult.result.message = object.result.message;
                                    logResult.result.stack = object.result.stack;
                                }
                                console.log(JSON.stringify({
                                    '__GRUNT-TDD': logResult
                                }));
                            }

                            test = reporterTDD.createResultElement(object);
                            parentNode.appendChild(test);
                        } else {
                            context = reporterTDD.createElement('LI', 'context ' + (object.hasError ? 'error' : 'success'));
                            context.innerHTML = object.name;
                            parentNode.appendChild(context);
                            list = reporterTDD.createElement('UL');
                            parentNode.appendChild(list);
                        }

                        if (object.tests && object.tests.length) {
                            traverse(object.tests, list);
                        }
                        // If not test array and there are more contexts
                        if (object.contexts && object.contexts.length) {
                            traverse(object.contexts, list);
                        }
                    }
                };
            traverse(reporterTDD.suites, wrapper);
            wrapper.id = 'results';
            if (isPhantomJS) console.log('DONE');
            return wrapper;
        }
    }

    if (window.buster) {
        reporterTDD.runner = reporterTDD.runners.buster;
    } else if (window.jasmine) {
        reporterTDD.runner = reporterTDD.runners.jasmine;
    } else if (window.mocha) {
        window.mocha.setup({
            ui: 'bdd',
            ignoreLeaks: true
        });
        reporterTDD.runner = reporterTDD.runners.mocha;
    } else if (!window.nodeSuites && !window.nodeFailed) {
        reporterTDD.throw('Neither Buster, Mocha or Jasmine is available in the global scope!');
    }

    if (window.require) {
        window.tddRun = reporterTDD.initialize;
    } else {
        reporterTDD.initialize();
    }
}(window));