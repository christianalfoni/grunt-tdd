buster.spec.expose();
// This is the meat of it: piggybacks expect.Assertion onto buster.assert
window.oldAssert = expect.Assertion.prototype.assert;
expect.Assertion.prototype.assert = function (truth, msg, error) {
    try {
        oldAssert.call(this, truth, msg, error);
    } catch (ex) {
        buster.assert(false, ex.message);
        return;
    }
    buster.assert(true, msg);
};