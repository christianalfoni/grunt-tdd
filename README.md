grunt-tdd
=========

Run browser and Node JS tests on Buster, Mocha or Jasmine and get the reports in the browser

## The essence
- It is a PROCESS
- It is a UNIT testing reporter tool
- Supports Buster, Mocha and Jasmine
- Runs both browser and node tests

### TODO
- Mocha/Jasmine does not give error on syntax errors
- Create small project to test with everything implemented
- Add requirejs config
- Add deferred to buster
- Add timeout errors

### NEW FEATS
- Search tests
- Run other selected tests in background and indicate error
- Add Qunit runner


#### Fixes
- Commented out Angular-Mocks additions to stack, due to readonly on PhantomJS and do not see the need for it
- Fixed Jasmine ExpectationResult to always give stack trace
- Jasmine is in version 1.3.1 both on server and client
- Angular E2E, even possible? This is a unit test reporter