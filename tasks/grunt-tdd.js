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
    var url = require('url'),
        _ = require('lodash'),
        http = require('http');

    grunt.loadNpmTasks('grunt-contrib-watch');


    // GLOBAL SETTINGS
    var serverRunning = false,
        doReload = false,
        selectedTest = 0;

    // METHODS
    var
        p = {
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
            hasAngular: function (libs) {
                for (var x = 0; x < libs.length; x++) {
                    if (libs[x].toLowerCase().indexOf('angular') >= 0) {
                        return true;
                    }
                }
                return false;
            },
            configure: function (files, options) {
                options.files = {
                    sources: files.sources || [],
                    libs: files.libs || [],
                    tests: files.tests || []
                };
                options.port = options.port || 3001;
                options.runner = options.runner || 'buster';
                options.node = typeof options.node === 'undefined' ? false : options.node;

                return options;

            },
            selectTest: function (res, query, options) {
                selectedTest = query.split('=')[1];
                p.sendIndex(res, options);
            },
            runNodeTests: function (options, selectedTest, callback) {
                  if (options.runner === 'buster') {
                      require(__dirname + '/../src/busterRunner').run(options.files.tests, selectedTest, callback);
                  } else if (options.runner === 'mocha') {
                      require(__dirname + '/../src/mochaRunner').run(options.files.tests, selectedTest, callback);
                  } else if (options.runner === 'jasmine') {
                      require(__dirname + '/../src/jasmineRunner').run(options, selectedTest, callback);
                  }
            },
            sendIndex: function (res, options) {
                var body,
                    send = function (nodeResults) {
                        body = require(__dirname + '/../src/reporterTemplate').create(grunt, options, selectedTest, nodeResults);
                        res.writeHead(200, {
                            "Content-Type": "text/html"
                        });
                        res.end(body);
                    };

                if (options.node) {
                    p.runNodeTests(options, selectedTest, send);
                } else {
                    send();
                }
            },
            sendRunnerCss: function (res, css) {
                res.writeHead(200, {
                    "Content-Type": "text/css"
                });
                res.end(css.join('\n'));
            },
            sendReporter: function (res, files) {
                res.writeHead(200, {
                    "Content-Type": "application/javascript"
                });
                res.end(files.join('\n'));
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

                grunt.option('force', true); // Task has to be forced in Node when errors are thrown from test
                watchConfig.__tdd = {
                    files: files,
                    tasks: [task],
                    options: {
                        spawn: false,
                        interrupt: true
                    }
                }
                grunt.config('watch', watchConfig);
                grunt.task.run(['watch:__tdd']);
            },
            getRunner: function (options) {
                switch (options.runner) {
                    case 'buster':
                        return grunt.file.read(__dirname + '/../libs/buster-test.js');
                    case 'jasmine':
                        return grunt.file.read(__dirname + '/../libs/jasmine.js');
                    case 'mocha':
                        return grunt.file.read(__dirname + '/../libs/mocha.js');
                }
            },
            getAssertionTools: function (options) {
                var assertionTools = [];
                if (options.expect) assertionTools.push(grunt.file.read(__dirname + '/../libs/expect.js'));
                if (options.should) assertionTools.push(grunt.file.read(__dirname + '/../libs/should.js'));
                if (options.chai) assertionTools.push(grunt.file.read(__dirname + '/../libs/chai.js'));
                // Buster needs to be configured for the expect library
                if (options.expect && options.runner === 'buster') assertionTools.push(grunt.file.read(__dirname + '/../src/exposeExpect.js'));
                if (options.sinon) assertionTools.push(grunt.file.read(__dirname + '/../libs/sinon-1.7.1.js'));

                return assertionTools.join('\n');
            },
            getDeps: function (options) {
                var deps = {
                    css: [],
                    js: []
                };

                // Order of array is very important
                // This is the order the browser will read the files
                deps.css.push(grunt.file.read(__dirname + '/../staticFiles/reporterTDD.css'));
                if (!options.node && options.requirejs) deps.js.push(grunt.file.read(__dirname + '/../libs/require.js'));
                if (!options.node) deps.js.push(p.getRunner(options));
                if (!options.node && options.runner === 'jasmine') deps.js.push(grunt.file.read(__dirname + '/../libs/jasmineTraceFix.js'));
                if (!options.node) deps.js.push(p.getAssertionTools(options));
                deps.js.push(grunt.file.read(__dirname + '/../src/reporterTDD.js'));
                if (!options.node && p.hasAngular(options.files.libs)) deps.js.push(grunt.file.read(__dirname + '/../libs/angular-mocks.js'));
                deps.js.push(grunt.file.read(__dirname + '/../src/reload.js'));

                return deps;
            },
            loadNodeGlobals: function (options) {
                if (options.runner === 'buster') global.buster = require('buster-test');
                if (options.expect) global.expect = require('expect.js');
                if (options.should) global.should = require('should');
                if (options.chai) global.chai = require('chai');
                if (options.sinon) global.sinon = require('sinon');

            },
            runAllTests: function (options, done) {
                require(__dirname + '/../src/nodeRunner').run({
                    done: done,
                    runAll: options.runAll,
                    runner: options.runner,
                    node: options.node,
                    grunt: grunt,
                    tests: options.files.tests,
                    expect: options.expect // When running Jasmine, expect has to be overwritten, if optioned
                });
            }
        };

    grunt.registerMultiTask('tdd', 'Test single test files in browser with automatic reload', function () {
        var options = p.configure(p.extractFilesMap(this.files), this.options()),
            server,
            deps,
            runAll = options.runAll || grunt.option('runAll');

        options.runAll = runAll;

        if (options.node && runAll) {
            var done = this.async();
            p.loadNodeGlobals(options);
            p.runAllTests(options, done);
        } else if (!serverRunning) {
            deps = p.getDeps(options);
            if (options.node) p.loadNodeGlobals(options);
            server = http.createServer(function (req, res) {
                var urlData = url.parse(req.url);
                switch (urlData.pathname) {
                    case '/':
                        p.sendIndex(res, options);
                        break;
                    case '/reload':
                        p.reload(req, res);
                        break;
                    case '/reporter.js':
                        p.sendReporter(res, deps.js);
                        break;
                    case '/reporterTDD.css':
                        p.sendRunnerCss(res, deps.css);
                        break;
                    case '/test':
                        p.selectTest(res, urlData.query, options);
                        break;
                    case '/buster-test.css':
                        res.writeHead(200, {
                            "Content-Type": "text/css"
                        });
                        res.end(''); // Do not send buster CSS file as it is not used
                        break;
                    default:
                        p.sendFile(req, res);
                }
            });
            server.listen(options.port);
            serverRunning = true;
            if (runAll) {
                var done = this.async();
                p.runAllTests(options, done);
            } else {
                p.addWatchTask(p.extractOriginalPaths(this.files), this.nameArgs);
            }
        } else {
            doReload = true;
        }
    });
};