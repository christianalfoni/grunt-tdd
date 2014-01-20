var p = {
    addLibs: function (libs) {
        var libScripts = '';
        libs.forEach(function (lib) {
            libScripts += '<script src="' + lib + '"></script>\n';
        });
        return libScripts;
    },
    addSources: function (sources) {
        var sourcesScripts = '';
        sources.forEach(function (source) {
            sourcesScripts += '<script src="' + source + '"></script>\n';
        });
        return sourcesScripts;
    },
    addTests: function (options, selectedTest) {
        if (options.runAll) {
            var scripts = '';
            options.files.tests.forEach(function (test) {
                scripts += '<script src="' + test + '"></script>\n';
            });
            return scripts;
        } else {
            return '<script src="' + options.files.tests[selectedTest] + '"></script>';
        }
    },
    addTestSelections: function (tests, selectedTest) {
        var testsString = '';
        tests.forEach(function (test, index) {
            testsString += '<option' + (index.toString() === selectedTest ? ' selected' : '') + '>' + test + '</option>';
        });
        return testsString;
    },
    safeString: function (object) {
        return JSON.stringify(object)
            .replace(/\\n/g, '\\\\n') // Fixes parsing of line breaks
            .replace(/\\"/g, '\\\\"') // Fixes parsing of double quotes
            .replace(/\'/g, '\\\''); // Fixes parsing of single quotes
    },
    buildNodeResults: function (nodeResults) {
        var results = '';
        if (nodeResults.error) {
            results += 'var nodeFailed = JSON.parse(\'' + p.safeString(nodeResults.error) + '\');';
        } else {
            results += 'var nodeSuites = JSON.parse(\'' + p.safeString(nodeResults.suites) + '\');' + '\n';
            results += 'var nodeStats = JSON.parse(\'' + p.safeString(nodeResults.stats) + '\');';
        }
        return results;
    },
    buildRequireJsScript: function (options, selectedTest) {
        var htmlString = '';
        if (options.runAll) {
            htmlString += '<script>';
            htmlString += 'requirejs.config(' + JSON.stringify(options.requirejs) + ');\n';
            htmlString += 'require([';
            htmlString += '\'' + options.files.tests.join('\',\'') + '\'';
            htmlString +=  '], window.tddRun);</script>';
        } else {
            htmlString = '<script>require([\'' + options.files.tests[selectedTest] + '\'], window.tddRun);</script>';
        }
        console.log(htmlString);
        return htmlString;
    }
};

module.exports = {
    _privates: p,
    create: function (grunt, options, selectedTest, nodeResults) {
        var template = grunt.file.read(__dirname + '/../staticFiles/template.html'),
            sources = options.node ? '' : p.addSources(options.files.sources),
            libs = options.node ? '' : p.addLibs(options.files.libs),
            test = options.node ? '' : p.addTests(options, selectedTest),
            nodeResults = nodeResults ? p.buildNodeResults(nodeResults) : '';

        template = template.replace('{{tests}}', p.addTestSelections(options.files.tests, selectedTest));
        template = template.replace('{{sources}}', sources);
        template = template.replace('{{libs}}', libs);
        template = template.replace('{{test}}', options.requirejs ? p.buildRequireJsScript(options, selectedTest) : test);
        template = template.replace('{{node}}', nodeResults);

        return template;
    }
}