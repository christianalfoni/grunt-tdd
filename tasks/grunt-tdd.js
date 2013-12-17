/*
 * grunt-buster-tdd
 * https://github.com/christian/grunt-buster-tdd
 *
 * Copyright (c) 2013 Christian Alfoni Jørgensen
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

    // PLUGIN DEPS
    var url = require('url');
    var _ = require('lodash');
    grunt.loadNpmTasks('grunt-contrib-watch');


    // Module DEPS
    var http = require('http'),
        serverRunning = false,
        doReload = false,
        fileDeps = {
            css: grunt.file.read(__dirname + '/../staticFiles/reporterTDD.css'),
            reporter: grunt.file.read(__dirname + '/../staticFiles/reporterTDD.js'),
            reload: grunt.file.read(__dirname + '/../staticFiles/reload.js')
        };


    // OPTIONS
    var sources,
        libs,
        tests,
        port,
        runner,
        isNode,
        sinon,
        expect,
        selectedTest = 0;

    // METHODS
    var p = {
        extractFilesMap: function (files) {
            var filesMap = {};
            files.forEach(function (fileData) {
                filesMap[fileData.dest] = fileData.src || [];
            });
            return filesMap;
        },
        extractOriginalPaths: function (files) {
            var filesMap = {};
            files.forEach(function (fileData) {
                filesMap[fileData.dest] = fileData.orig.src;
            });
            return filesMap;
        },
        isAngular: function (libs) {
            for (var x = 0; x < libs.length; x++) {
                if (libs[x].toLowerCase().indexOf('angular') >= 0) {
                    return true;
                }
            }
            return false;
        },
        setResourcesAndOptions: function (files, options) {
            sources = files.sources;
            libs = files.libs;
            tests = files.tests;
            port = options.port || 3001;
            runner = options.runner || 'buster';
            isNode = typeof options.node === 'undefined' ? false : options.node;
            sinon = options.sinon;
            expect = options.expect;
            console.log('runner is set to ' + runner);
            if (isNode) {

                if (runner === 'buster') {
                    global.buster = require('buster-test');
                }

                if (expect) {
                    global.expect = require('expect.js');
                }

                if (sinon) {
                    global.sinon = require('sinon');
                }

            } else {
                switch (runner) {
                    case 'buster':
                        fileDeps.runner = grunt.file.read(__dirname + '/../staticFiles/buster-test.js');
                        break;
                    case 'jasmine':
                        fileDeps.runner = grunt.file.read(__dirname + '/../staticFiles/jasmine.js');
                        break;
                    case 'mocha':
                        fileDeps.runner = grunt.file.read(__dirname + '/../staticFiles/mocha.js');
                        break;
                }

                if (sinon) {
                    fileDeps.sinon = grunt.file.read(__dirname + '/../staticFiles/sinon-1.7.1.js');
                }

                // Expose expect if set and add exposeExepct if runner is buster
                if (expect || runner === 'mocha') {
                    fileDeps.expect = grunt.file.read(__dirname + '/../staticFiles/expect.js') + (runner === 'buster' ? grunt.file.read(__dirname + '/../staticFiles/exposeExpect.js') : '');
                }

                if (p.isAngular(libs)) {
                    fileDeps.angularMocks = grunt.file.read(__dirname + '/../staticFiles/angular-mocks.js');
                }
            }

        },
        addLibs: function () {
            var libScripts = '';
            libs.forEach(function (lib) {
                libScripts += '<script src="' + lib + '"></script>\n';
            });
            return libScripts;
        },
        addSources: function () {
            var sourcesScripts = '';
            sources.forEach(function (source) {
                sourcesScripts += '<script src="' + source + '"></script>\n';
            });
            return sourcesScripts;
        },
        addTests: function () {
            var testsString = '';
            tests.forEach(function (test, index) {
                testsString += '<option' + (index.toString() === selectedTest ? ' selected' : '') + '>' + test + '</option>';
            });
            return testsString;
        },
        selectTest: function (req, res, query) {
            selectedTest = query.split('=')[1];
            p.sendIndex(req, res);
        },
        sendIndex: function (req, res) {
            var nodeTest = '',
                body,
                send = function () {
                    body = '<!DOCTYPE html>' +
                        '<html>' +
                        '<head>' +
                        '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">' +
                        '<style>html, body {background-color: #111; } .test-file-name { color: #444 !important; font-size: 24px !important; position: fixed; bottom: 10px; right: 10px;color: white; }</style>' +
                        '<link rel="stylesheet" href="reporterTDD.css">' +
                        '<script>' +
                        'var tests = JSON.parse(\'' + JSON.stringify(tests) + '\');' +
                        nodeTest +
                        'var changeTest = function () {' +
                        'location.href = "/test?index=" + document.getElementById("testSelector").selectedIndex' +
                        '}' +
                        '</script>' +
                        '</head>' +
                        '<body>' +
                        '<span class="test-file-name">No test selected</span>';
                    body += p.addLibs();
                    body += p.addSources();
                    body += '<script src="/reporter.js"></script>' +
                        '<select id="testSelector" onchange="changeTest()">' +
                        p.addTests() +
                        '</select>' +
                        (isNode ? '' : '<script src="' + tests[selectedTest] + '"></script>') +
                        '</body>' +
                        '</html>';

                    res.writeHead(200, {
                        "Content-Type": "text/html"
                    });
                    console.log('sending response');
                    res.end(body);
                };

            /*
             NODE BUSTER TEST RUN
             TODO: REFACTOR
             */
            console.log('with runner ' + runner);
            if (isNode && runner === 'buster') {

                var testRunner = require('buster-test').testRunner,
                    theRunner = testRunner.create({random: false});
                theRunner.on('grunt-tdd:ready', function (data) {
                    nodeTest = 'var nodeSuites = JSON.parse(\'' + JSON.stringify(data.suites).replace(/\\n/g, '\\\\n').replace(/\\"/g, '\\\\"').replace(/\'/g, '\\\'') + '\');' + '\n' +
                        'var nodeStats = JSON.parse(\'' + JSON.stringify(data.stats) + '\');';
                    send();
                });
                theRunner.on('grunt-tdd:failed', function (error) {
                    nodeTest = 'var nodeFailed = "' + error + '";\n';
                    send();
                });
                var reporter = require(__dirname + '/../libs/busterReporter').create(),
                    handleBadSyntax = function () {
                        process.removeListener('uncaughtException', handleBadSyntax);
                        runner.emit('grunt-tdd:failed', 'Bad syntax in file ' + tests[selectedTest]);
                    };
                process.on('uncaughtException', handleBadSyntax);
                var test = require(process.cwd() + '/' + tests[selectedTest]);
                process.removeListener('uncaughtException', handleBadSyntax);
                delete require.cache[process.cwd() + '/' + tests[selectedTest]]; // Remove cached to enable reloading of file
                if (_.isEmpty(test)) {
                    return theRunner.emit('grunt-tdd:failed', 'No exports, remember putting module.exports in ' + tests[selectedTest]);
                }
                reporter.listen(theRunner);
                reporter.runSuite(theRunner, test);

                /*
                 NODE MOCHA TEST RUN
                 TODO: REFACTOR
                 */
            } else if (isNode && runner === 'mocha') {
                var testRunner = require('mocha'),
                    clean = require(__dirname + '/../libs/mochaCleaner'),
                    theRunner = new testRunner({
                        ignoreLeaks: false,
                        ui: 'bdd'
                    });
                console.log(testRunner.prototype);
                theRunner.addFile(process.cwd() + '/' + tests[selectedTest]);
                delete require.cache[process.cwd() + '/' + tests[selectedTest]]; // Remove cached to enable reloading of file
                theRunner.run(function (errors) {
                    var result = clean(theRunner.suite.suites);
                    nodeTest = 'var nodeSuites = JSON.parse(\'' + JSON.stringify(result.suites).replace(/\\n/g, '\\\\n').replace(/\\"/g, '\\\\"').replace(/\'/g, '\\\'') + '\');' + '\n' +
                        'var nodeStats = JSON.parse(\'' + JSON.stringify(result.stats) + '\');';
                    send();
                });

            } else {
                send();
            }
        },
        sendRunnerCss: function (req, res) {
            res.writeHead(200, {
                "Content-Type": "text/css"
            });
            res.end(fileDeps.css);
        },
        sendReporter: function (req, res) {
            var lib = (fileDeps.runner || '') + '\n' +
                (fileDeps.sinon || '') + '\n' +
                (fileDeps.expect || '') + '\n' +
                fileDeps.reporter + '\n' +
                (fileDeps.angularMocks || '') + '\n' +
                fileDeps.reload;

            res.writeHead(200, {
                "Content-Type": "application/javascript"
            });
            res.end(lib);
        },
        sendFile: function (req, res) {
            if (req.url.match(/\.js$/)) {
                var file = grunt.file.read(process.cwd() + req.url);
                res.writeHead(200, {
                    "Content-Type": "application/javascript"
                });
                res.end(file);
            } else {
                res.writeHead(404);
                res.end();
            }
        },
        reload: function (req, res) {
            if (doReload) {
                doReload = false;
                res.end('reload');
            } else {
                res.end('');
            }
        },
        addWatchTask: function (fileMap, task) {
            var watchConfig = grunt.config('watch') || {},
                files = fileMap.sources.concat(fileMap.tests);

            watchConfig.__tdd = {
                files: files,
                tasks: [task],
                options: {
                    spawn: false,
                    interrupt: true
                }
            }
            grunt.config('watch', watchConfig);
        }
    };

    grunt.registerMultiTask('tdd', 'Test single test files in browser with automatic reload', function () {
        if (!serverRunning) {
            p.setResourcesAndOptions(p.extractFilesMap(this.files), this.options());
            var server = http.createServer(function (req, res) {
                var urlData = url.parse(req.url);
                switch (urlData.pathname) {
                    case '/':
                        p.sendIndex(req, res);
                        break;
                    case '/reload':
                        p.reload(req, res);
                        break;
                    case '/reporter.js':
                        p.sendReporter(req, res);
                        break;
                    case '/reporterTDD.css':
                        p.sendRunnerCss(req, res);
                        break;
                    case '/test':
                        p.selectTest(req, res, urlData.query);
                        break;
                    default:
                        p.sendFile(req, res);
                }
                ;
            });
            server.listen(port);
            serverRunning = true;
            p.addWatchTask(p.extractOriginalPaths(this.files), this.nameArgs);
            grunt.task.run(['watch:__tdd']);
        } else {
            doReload = true;
        }
    });
};