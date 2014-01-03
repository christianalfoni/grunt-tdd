(function (global) {
    global.jasmine.ExpectationResult = function (params) {
        var trace;
        this.type = 'expect';
        this.matcherName = params.matcherName;
        this.passed_ = params.passed;
        this.expected = params.expected;
        this.actual = params.actual;
        this.message = this.passed_ ? 'Passed.' : params.message;
        // Making sure that a stack trace is added on errors
        if (params.trace) {
            trace = params.trace;
        } else {
            try {
                throw new Error(this.message);
            } catch (e) {
                trace = e;
            }
        }
        this.trace = this.passed_ ? '' : trace;
    };
    global.jasmine.ExpectationResult.prototype.toString = function () {
        return this.message;
    };

    global.jasmine.ExpectationResult.prototype.passed = function () {
        return this.passed_;
    };
}(typeof window === 'undefined'  ? global : window));