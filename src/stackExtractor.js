var p = {
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
    extract: function (stack) {
        var reducedStack = [];
        if (stack) { // Should assertion library causes no stack;
            stack = stack.split((stack.indexOf('\\n') >= 0 ? '\\n' : '\n')); // \\n is used by Node to support JSON stringify
            stack.forEach(p.createStackLinesToArrayIterator(reducedStack));
        }
        return reducedStack;
    }
}