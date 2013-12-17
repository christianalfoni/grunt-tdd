buster.testCase('reporterTDD', {
    setUp: function () {
        this.window = {};
        var reporterTDDTest = reporterTDD(this.window);
        this.reporter = reporterTDDTest.reporter;
        this.buster = reporterTDDTest.buster;
        this.jasmine = reporterTDDTest.jasmine;
    },
    'initializes with default values': function () {
        expect(this.reporter.runners.jasmine).to.be.an('object');
        expect(this.reporter.runners.buster).to.be.an('object');
        expect(this.reporter.runner).to.be(null);
        expect(this.reporter.stats).to.be.an('object');
        expect(this.reporter.suites).to.be.an('array');
    },
    'initialize()': {
        'calls setRunner() and initialize() on selected runner': function () {

            sinon.stub(this.reporter, 'setRunner');
            sinon.stub(this.reporter.runners.buster, 'initialize');
            this.reporter.runner = this.reporter.runners.buster;
            this.reporter.initialize();
            expect(this.reporter.setRunner.calledOnce).to.be(true);
            expect(this.reporter.runner.initialize.calledOnce).to.be(true);
            this.reporter.setRunner.restore();
            this.reporter.runners.buster.initialize.restore();
            this.reporter.runner = null;
        }
    },
    'throw()': {
        'is a function': function () {
            expect(this.reporter.throw).to.be.a("function")
        },
        'takes one argument (message)': function () {
            expect(this.reporter.throw).to.have.length(1);
        },
        'throws a reporterTDD error if called with a message': function () {
            expect(this.reporter.throw).withArgs('message').to.throwError(/reporterTDD/);
        }
    },
    'setRunner()': {
        tearDown: function () {
            delete this.window.jasmine;
            delete this.window.buster;
            this.reporter.runner = null;
        },
        'is a function': function () {
            expect(this.reporter.setRunner).to.be.a("function")
        },
        'takes no arguments': function () {
            expect(this.reporter.setRunner).to.have.length(0);
        },
        'does NOT throw if buster exists in global scope': function () {
            this.window.buster = {};
            expect(this.reporter.setRunner).withArgs().not.to.throwError();
        },
        'does NOT throw if jasmine exists in global scope': function () {
            this.window.jasmine = {};
            expect(this.reporter.setRunner).withArgs().not.to.throwError();
        },
        'does throw error if no test libs are avaialble': function () {
            expect(this.reporter.setRunner).to.throwError(/reporterTDD/);
        },
        'changes runner based on window property': function () {
            this.window.buster = {};
            this.reporter.setRunner();
            expect(this.reporter.runner).to.be(this.reporter.runners.buster);

        }
    },
    'createElement()': {
        'is a function': function () {
            expect(this.reporter.createElement).to.be.a("function")
        },
        'takes two arguments (tagName, className)': function () {
            expect(this.reporter.createElement).to.have.length(2);
        },
        'returns an element of set tag and classname': function () {
            var element = this.reporter.createElement('DIV', 'test');
            expect(element.tagName).to.be('DIV');
            expect(element.className).to.be('test');
        },
        'returns empty className, when none passed': function () {
            var element = this.reporter.createElement('DIV');
            expect(element.tagName).to.be('DIV');
            expect(element.className).to.be('')
        },
        'throws error when missing tagName': function () {
            expect(this.reporter.createElement).to.throwError(/reporterTDD/);
        }
    },
    'createStats()': {
        'is a function': function () {
            expect(this.reporter.createStats).to.be.a("function")
        },
        'takes no arguments': function () {
            expect(this.reporter.createStats).to.have.length(0);
        },
        'returns a DIV element containing statistic results': function () {
            var stats = this.reporter.createStats();
            expect(stats.childNodes.length).to.be(6);
        }
    },
    'displayResults()': {
        'is a function': function () {
            expect(this.reporter.displayResults).to.be.a("function")
        },
        'takes no arguments': function () {
            expect(this.reporter.displayResults).to.have.length(0);
        },
        '//returns ': function () {
            expect(this.reporter.displayResults()).to.be.a("");
        }
    },
    'createResults()': {
        'is a function': function () {
            expect(this.reporter.createResults).to.be.a("function")
        },
        'takes no arguments ()': function () {
            expect(this.reporter.createResults).to.have.length(0);
        }
    },
    'hasErrors()': {
        setUp: function () {
            this.buildStats = function (success, error, failure, timeout, deferred) {
                return {
                    success: success,
                    error: error,
                    failure: failure,
                    timeout: timeout,
                    deferred: deferred
                }
            };
        },
        tearDown: function () {
            this.reporter.stats = {
                success: 0,
                error: 0,
                failure: 0,
                timeout: 0,
                deferred: 0
            }
        },
        'is a function': function () {
            expect(this.reporter.hasErrors).to.be.a("function")
        },
        'takes no arguments': function () {
            expect(this.reporter.hasErrors).to.have.length(0);
        },
        'returns true if ERROR has occured': function () {
            this.reporter.stats = this.buildStats(5, 1, 0, 0, 2);
            expect(this.reporter.hasErrors()).to.be(true);
        },
        'returns true if FAILURE has occured': function () {
            this.reporter.stats = this.buildStats(5, 0, 1, 0, 2);
            expect(this.reporter.hasErrors()).to.be(true);
        },
        'returns true if TIMEOUT has occured': function () {
            this.reporter.stats = this.buildStats(5, 0, 1, 1, 2);
            expect(this.reporter.hasErrors()).to.be(true);
        },
        'returns false if no errors are present': function () {
            this.reporter.stats = this.buildStats(5, 0, 0, 0, 2);
            expect(this.reporter.hasErrors()).to.be(false);
        }
    },
    'createStackLinesToArrayIterator()': {
        'is a function': function () {
            expect(this.reporter.createStackLinesToArrayIterator).to.be.a("function")
        },
        'takes one argument (array)': function () {
            expect(this.reporter.createStackLinesToArrayIterator).to.have.length(1);
        },
        'returns a function': function () {
            expect(this.reporter.createStackLinesToArrayIterator([])).to.be.a('function');
        },
        'when function is called, any invalid stack lines will be skipped': function () {
            var array = [],
                invalidStackLine = 'invalid stack line',
                iteratorFunction = this.reporter.createStackLinesToArrayIterator(array);
            expect(iteratorFunction).withArgs(invalidStackLine).not.to.throwError();
            expect(array.length).to.be(0);
        }
    },
    'createStack()': {
        setUp: function () {
            this.stack = 'Error: [assert] Expected false to be truthy at Object.ba.fail (http://localhost:63342/tdd-reporter/reporterTDD.js:1486:29)' + '\n' +
                'at assert (http://localhost:63342/tdd-reporter/reporterTDD.js:1460:20)' + '\n' +
                'at Object.buster.testCase.initialize().is a function (http://localhost:63342/tdd-reporter/index.html:19:17)' + '\n' +
                'at asyncFunction (http://localhost:63342/tdd-reporter/reporterTDD.js:6394:23)' + '\n' +
                'at callTestFn (http://localhost:63342/tdd-reporter/reporterTDD.js:6500:31)' + '\n' +
                'at http://localhost:63342/tdd-reporter/reporterTDD.js:791:31 ' + '\n' +
                'at http://localhost:63342/tdd-reporter/reporterTDD.js:791:31 ' + '\n' +
                'at p.then (http://localhost:63342/tdd-reporter/reporterTDD.js:71:51) ' + '\n' +
                'at Object.then (http://localhost:63342/tdd-reporter/reporterTDD.js:177:28) ' + '\n' +
                'at Object.B.extend.runTest (http://localhost:63342/tdd-reporter/reporterTDD.js:6703:30)';
        },
        'is a function': function () {
            expect(this.reporter.createStack).to.be.a("function")
        },
        'takes one argument (stack)': function () {
            expect(this.reporter.createStack).to.have.length(1);
        },
        'returns an array of stack lines': function () {
            expect(this.reporter.createStack(this.stack)).to.be.an('array');
        },
        'parses the lines to only contain file name and line number': function () {
            expect(this.reporter.createStack(this.stack)[0]).to.eql({
                path: 'http://localhost:63342/tdd-reporter/',
                file: 'index.html',
                lineNumber: '19'
            });
        },
        '//does not contain any stack lines related to libraries': function () {

        }
    },
    'RUNNERS': {
        /*
         'BUSTER': {
         setUp: function () {
         this.createBusterSuite = function () {
         return {
         name: 'testSuite',
         tests: [
         {
         name: 'test1'
         }
         ],
         contexts: [
         {
         name: 'context1',
         tests: [
         {
         name: 'test2'
         }
         ],
         contexts: [
         {
         name: 'context2',
         tests: [
         {
         name: 'test1'
         },
         {
         name: 'test3'
         }
         ],
         contexts: []
         }
         ]
         }
         ]
         }
         };
         this.runner = this.reporter.runners.buster;
         },
         'initialize': {
         'is a function': function () {
         expect(this.runner.initialize).to.be.a("function")
         },
         'takes no arguments': function () {
         expect(this.runner.initialize).to.have.length(0);
         }
         },
         'overrideReporter()': {
         'is a function': function () {
         expect(this.runner.overrideReporter).to.be.a("function")
         },
         'takes no arguments': function () {
         expect(this.runner.overrideReporter).to.have.length(0);
         },
         'replaces buster reporter functions with empty functions': function () {
         var addStats = function () {
         },
         contextStart = function () {
         },
         testSuccess = function () {
         },
         testFailure = function () {
         },
         testError = function () {
         },
         testDeferred = function () {
         };
         this.window.buster = {
         reporters: {
         html: {
         addStats: addStats,
         contextStart: contextStart,
         testSuccess: testSuccess,
         testFailure: testFailure,
         testError: testError,
         testDeferred: testDeferred
         }
         }
         };
         this.runner.overrideReporter();
         expect(this.window.buster.reporters.html.contextStart).not.to.be(contextStart);
         expect(this.window.buster.reporters.html.contextStart).not.to.be(contextStart);
         expect(this.window.buster.reporters.html.testSuccess).not.to.be(testSuccess);
         expect(this.window.buster.reporters.html.testFailure).not.to.be(testFailure);
         expect(this.window.buster.reporters.html.testError).not.to.be(testError);
         expect(this.window.buster.reporters.html.testDeferred).not.to.be(testDeferred);

         delete this.window.buster;
         }
         },
         'registerEvents()': {
         'is a function': function () {
         expect(this.runner.registerEvents).to.be.a("function")
         },
         'takes no arguments': function () {
         expect(this.runner.registerEvents).to.have.length(0);
         },
         'register buster event listening': function () {
         this.window.buster = {
         testRunner: {
         on: sinon.spy()
         }
         };
         this.runner.registerEvents();
         expect(this.window.buster.testRunner.on.getCall(0).calledWith('context:start')).to.be(true);
         expect(this.window.buster.testRunner.on.getCall(1).calledWith('test:success')).to.be(true);
         expect(this.window.buster.testRunner.on.getCall(2).calledWith('test:failure')).to.be(true);
         expect(this.window.buster.testRunner.on.getCall(3).calledWith('test:error')).to.be(true);
         expect(this.window.buster.testRunner.on.getCall(4).calledWith('test:deferred')).to.be(true);
         expect(this.window.buster.testRunner.on.getCall(5).calledWith('suite:end')).to.be(true);
         }
         },
         'getUnresolvedTest()': {
         'is a function': function () {
         expect(this.runner.getUnresolvedTest).to.be.a("function");
         },
         'takes two arguments (name, isError)': function () {
         expect(this.runner.getUnresolvedTest).to.have.length(2);
         },
         'returns test with given name': function () {
         this.reporter.suites.push(this.createBusterSuite());
         expect(this.runner.getUnresolvedTest('test1')).to.be(this.reporter.suites[0].tests[0]);
         expect(this.runner.getUnresolvedTest('test2')).to.be(this.reporter.suites[0].contexts[0].tests[0]);
         expect(this.runner.getUnresolvedTest('test3')).to.be(this.reporter.suites[0].contexts[0].contexts[0].tests[1]);
         this.reporter.suites = [];
         },
         'does not return the resolved test matching the name, but next match': function () {
         this.reporter.suites.push(this.createBusterSuite());
         this.reporter.suites[0].tests[0].result = {type: 'success'};
         expect(this.runner.getUnresolvedTest('test1')).to.be(this.reporter.suites[0].contexts[0].contexts[0].tests[0]);
         this.reporter.suites = [];
         },
         'adds error to parent contexts': function () {
         this.reporter.suites.push(this.createBusterSuite());
         this.runner.getUnresolvedTest('test2', true);
         expect(this.reporter.suites[0].hasError).to.be(true);
         expect(this.reporter.suites[0].contexts[0].hasError).to.be(true);
         expect(this.reporter.suites[0].contexts[0].contexts[0].hasError).to.be(undefined); // Test is not resolved in this context
         }

         },
         'addTestSuite()': {
         'is a function': function () {
         expect(this.runner.addTestSuite).to.be.a("function")
         },
         'takes one argument (testSuite)': function () {
         expect(this.runner.addTestSuite).to.have.length(1);
         },
         'does NOT throw if called correctly': function () {
         expect(this.runner.addTestSuite).withArgs(this.createBusterSuite()).not.to.throwError();
         },
         'adds suite if valid context': function () {
         var suite = this.createBusterSuite();
         this.runner.addTestSuite(suite);
         expect(this.reporter.suites.length).to.be(1);
         expect(this.reporter.suites[0]).to.be(suite);
         this.reporter.suites = [];
         },
         'does not add context if invalid context': function () {
         this.runner.addTestSuite({
         parent: {}
         });
         expect(this.reporter.suites.length).to.be(0);
         }
         },
         'addResult()': {
         'is a function': function () {
         expect(this.runner.addResult).to.be.a("function")
         },
         'takes two arguments (name, result)': function () {
         expect(this.runner.addResult).to.have.length(2);
         },
         'throws if test is not found': function () {
         expect(this.runner.addResult).withArgs('foo', 'success').to.throwError(/reporterTDD/);
         },
         'adds passed result to test': function () {
         var test = {name: 'test'};
         sinon.stub(this.runner, 'getUnresolvedTest').returns(test);
         this.runner.addResult('test', 'success');
         expect(test.result).to.be('success');
         this.runner.getUnresolvedTest.restore();
         }
         },
         'createResult()': {
         'is a function': function () {
         expect(this.runner.createResult).to.be.a("function")
         },
         'takes two arguments (type)': function () {
         expect(this.runner.createResult).to.have.length(1);
         },
         'returns a function that builds a result object and calls addResult()': {
         'success': function () {
         var resultFunction = this.runner.createResult('success');
         sinon.stub(this.runner, 'addResult');
         resultFunction({
         name: 'test1'
         });
         expect(this.runner.addResult.calledWith('test1', {
         type: 'success'
         })).to.be(true);
         this.runner.addResult.restore();
         },
         'error': function () {
         var resultFunction = this.runner.createResult('error'),
         test = {
         name: 'test1',
         error: {
         message: 'some error',
         name: 'Error',
         stack: 'line 1'
         }
         };
         sinon.stub(this.runner, 'addResult');
         resultFunction(test);
         expect(this.runner.addResult.calledWith('test1', {
         type: 'error',
         name: test.error.name,
         message: test.error.message,
         stack: test.error.stack
         })).to.be(true);
         this.runner.addResult.restore();
         },
         '//timeout': function () {
         },
         '//failure': function () {
         },
         '//deferred': function () {
         }

         }
         }
         },

         'JASMINE': {
         setUp: function () {
         this.createJasmineSuite = function () {
         return {
         description: 'testSuite',
         specs_: [
         {
         name: 'test1'
         }
         ],
         suites_: [
         {
         description: 'context1',
         specs_: [
         {
         description: 'test2'
         }
         ],
         suites_: [
         {
         description: 'context2',
         specs_: [
         {
         description: 'test1'
         },
         {
         description: 'test3'
         }
         ],
         suites_: []
         }
         ]
         }
         ]
         }
         };
         this.runner = this.reporter.runners.jasmine;
         },
         'initialize': {
         'is a function': function () {
         expect(this.runner.initialize).to.be.a("function")
         },
         'takes no arguments': function () {
         expect(this.runner.initialize).to.have.length(0);
         }
         },
         'cleanSuites()': {
         'is a function': function () {
         expect(this.runner.cleanSuites).to.be.a("function")
         },
         'takes no arguments': function () {
         expect(this.runner.cleanSuites).to.have.length(0);
         },
         '//returns ': function () {
         expect(this.runner.cleanSuite()).to.be.a("");
         }
         },
         'cleanTest()': {
         'is a function': function () {
         expect(this.runner.cleanTest).to.be.a("function")
         },
         'takes one argument (test)': function () {
         expect(this.runner.cleanTest).to.have.length(1);
         },
         'clean a successfull JASMINE test object': function () {
         var jasmineTest = {
         afterCallbacks: [],
         description: "contains spec with an expectation",
         env: {},
         id: 0,
         matchersClass: null,
         queue: {},
         results_: {
         description: "contains spec with an expectation",
         failedCount: 0,
         items_: [],
         passedCount: 1,
         skipped: false,
         totalCount: 1
         },
         spies_: {},
         suite: {}
         };
         this.runner.cleanTest(jasmineTest);
         expect(jasmineTest).to.be.eql({
         name: 'contains spec with an expectation',
         result: {
         type: 'success'
         }
         });
         },
         'clean an unsuccessfull JASMINE test object': function () {
         var jasmineTest = {
         afterCallbacks: [],
         description: "contains spec with an expectation",
         env: {},
         id: 0,
         matchersClass: null,
         queue: {},
         results_: {
         description: "contains spec with an expectation",
         failedCount: 1,
         items_: [
         {
         actual: true,
         expected: false,
         matcherName: "toBe",
         message: "Expected true to be false.",
         passed_: false,
         trace: {
         message: 'Expected true to be false.',
         stack: "Error: Expected true to be false.↵    at new jasmine.ExpectationResult (http://localhost:63342/tdd-reporter/jasmine.js:114:32)↵    at null.toBe (http://localhost:63342/tdd-reporter/jasmine.js:1235:29)↵    at null.<anonymous> (http://localhost:63342/tdd-reporter/index.html:16:26)↵    at jasmine.Block.execute (http://localhost:63342/tdd-reporter/jasmine.js:1064:17)"
         },
         type: "expect"
         }
         ],
         passedCount: 0,
         skipped: false,
         totalCount: 1
         },
         spies_: {},
         suite: {}
         };
         this.runner.cleanTest(jasmineTest);
         expect(jasmineTest).to.be.eql({
         name: 'contains spec with an expectation',
         result: {
         type: 'error',
         message: 'Expected true to be false.',
         stack: "Error: Expected true to be false.↵    at new jasmine.ExpectationResult (http://localhost:63342/tdd-reporter/jasmine.js:114:32)↵    at null.toBe (http://localhost:63342/tdd-reporter/jasmine.js:1235:29)↵    at null.<anonymous> (http://localhost:63342/tdd-reporter/index.html:16:26)↵    at jasmine.Block.execute (http://localhost:63342/tdd-reporter/jasmine.js:1064:17)"
         }
         });
         }
         },
         'cleanContext()': {
         'is a function': function () {
         expect(this.runner.cleanContext).to.be.a("function")
         },
         'takes one argument (context)': function () {
         expect(this.runner.cleanContext).to.have.length(1);
         },
         'cleans a JASMINE context object ': function () {
         var jasmineContext = {
         after_: [],
         before_: [],
         children_: [],
         description: "A suite",
         env: {},
         finished: true,
         id: 0,
         parentSuite: null,
         queue: {},
         specs_: [],
         suites_: []
         };
         this.runner.cleanContext(jasmineContext);
         expect(jasmineContext).to.be.eql({
         name: 'A suite',
         tests: [],
         contexts: []
         });
         }
         },
         'getErrorItem()': {
         setUp: function () {
         this.items = [
         {
         actual: true,
         expected: false,
         matcherName: "toBe",
         message: "Expected true to be false.",
         passed_: true,
         trace: {},
         type: "expect"
         },
         {
         actual: true,
         expected: false,
         matcherName: "toBe",
         message: "Expected true to be false.",
         passed_: false,
         trace: {},
         type: "expect"
         },
         {
         actual: true,
         expected: false,
         matcherName: "toBe",
         message: "Expected true to be false.",
         passed_: false,
         trace: {},
         type: "expect"
         }
         ];
         },
         'is a function': function () {
         expect(this.runner.getErrorItem).to.be.a("function")
         },
         'takes one argument (items)': function () {
         expect(this.runner.getErrorItem).to.have.length(1);
         },
         'returns the first error item in the array': function () {
         expect(this.runner.getErrorItem(this.items)).to.be(this.items[1]);
         }
         }
         },*/

        'MOCHA': {
            setUp: function () {
                this.createMochaSuite = function () {
                    return {
                        title: 'testSuite',
                        tests: [
                            {
                                title: 'test1'
                            }
                        ],
                        suites: [
                            {
                                title: 'context1',
                                tests: [
                                    {
                                        title: 'test2'
                                    }
                                ],
                                suites: [
                                    {
                                        title: 'context2',
                                        tests: [
                                            {
                                                title: 'test1'
                                            },
                                            {
                                                title: 'test3'
                                            }
                                        ],
                                        suites: []
                                    }
                                ]
                            }
                        ]
                    }
                };
                this.runner = this.reporter.runners.mocha;
            },
            'initialize': {
                'is a function': function () {
                    expect(this.runner.initialize).to.be.a("function")
                },
                'takes no arguments': function () {
                    expect(this.runner.initialize).to.have.length(0);
                }
            },
            'cleanSuites()': {
                'is a function': function () {
                    expect(this.runner.cleanSuites).to.be.a("function")
                },
                'takes no arguments': function () {
                    expect(this.runner.cleanSuites).to.have.length(0);
                },
                'changes property names to common names': function () {
                    this.reporter.suites.push(this.createMochaSuite());
                    this.runner.cleanSuites();
                    expect(this.reporter.suites[0].name).to.be('testSuite');
                    expect(this.reporter.suites[0].tests).to.be.an('array');
                    expect(this.reporter.suites[0].tests[0].name).to.be('test1');
                    expect(this.reporter.suites[0].contexts).to.be.an('array');
                    expect(this.reporter.suites[0].contexts[0].name).to.be('context1');
                    this.reporter.suites = [];
                }
            },
            'cleanTest()': {
                'is a function': function () {
                    expect(this.runner.cleanTest).to.be.a("function")
                },
                'takes one argument (test)': function () {
                    expect(this.runner.cleanTest).to.have.length(1);
                },
                'clean a successfull MOCHA test object': function () {
                    var mochaTest = {
                        $events: {},
                        _slow: 75,
                        _timeout: 2000,
                        async: 0,
                        callback: function () {
                        },
                        ctx: {},
                        duration: 1,
                        fn: function () {
                        },
                        parent: {},
                        pending: false,
                        speed: "fast",
                        state: "passed",
                        sync: true,
                        timedOut: false,
                        title: "contains spec with an expectation",
                        type: "test"
                    };
                    this.runner.cleanTest(mochaTest);
                    expect(mochaTest.name).to.be.eql('contains spec with an expectation');
                    expect(mochaTest.result).to.eql({
                        type: 'success'
                    });
                },
                'clean an unsuccessfull MOCHA test object': function () {
                    var mochaTest = {
                        $events: {},
                        _slow: 75,
                        _timeout: 2000,
                        async: 0,
                        callback: function () {
                        },
                        ctx: {},
                        err: {
                            message: 'Expected true to be false.',
                            stack: "Error: Expected true to be false.↵    at new jasmine.ExpectationResult (http://localhost:63342/tdd-reporter/jasmine.js:114:32)↵    at null.toBe (http://localhost:63342/tdd-reporter/jasmine.js:1235:29)↵    at null.<anonymous> (http://localhost:63342/tdd-reporter/index.html:16:26)↵    at jasmine.Block.execute (http://localhost:63342/tdd-reporter/jasmine.js:1064:17)"
                        },
                        fn: function () {
                        },
                        parent: {},
                        pending: false,
                        state: "failed",
                        sync: true,
                        timedOut: false,
                        title: "contains spec with an expectation",
                        type: "test"
                    };
                    this.runner.cleanTest(mochaTest);
                    expect(mochaTest.name).to.be('contains spec with an expectation');
                    expect(mochaTest.result).to.eql({
                        type: 'error',
                        message: 'Expected true to be false.',
                        stack: "Error: Expected true to be false.↵    at new jasmine.ExpectationResult (http://localhost:63342/tdd-reporter/jasmine.js:114:32)↵    at null.toBe (http://localhost:63342/tdd-reporter/jasmine.js:1235:29)↵    at null.<anonymous> (http://localhost:63342/tdd-reporter/index.html:16:26)↵    at jasmine.Block.execute (http://localhost:63342/tdd-reporter/jasmine.js:1064:17)"
                    });
                }
            },
            'cleanContext()': {
                'is a function': function () {
                    expect(this.runner.cleanContext).to.be.a("function")
                },
                'takes one argument (context)': function () {
                    expect(this.runner.cleanContext).to.have.length(1);
                },
                'cleans a MOCHA context object ': function () {
                    var mochaContext = {
                        _afterAll: [],
                        length: 0,
                        _afterEach: [],
                        _bail: undefined,
                        _beforeAll: [],
                        _beforeEach: [],
                        _slow: 75,
                        _timeout: 2000,
                        ctx: {},
                        parent: {},
                        pending: false,
                        root: false,
                        suites: [],
                        tests: [],
                        title: "A suite"
                    };
                    this.runner.cleanContext(mochaContext);
                    expect(mochaContext.name).to.be('A suite');
                    expect(mochaContext.tests).to.be.an('array');
                    expect(mochaContext.contexts).to.be.an('array');
                }
            }
        }
    }
})
;