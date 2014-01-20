grunt-tdd
=========

It is difficult to get going with TDD. There are a lot of presentations on how to write tests, but really, it is not understanding how to write tests that prevents you from doing TDD, it is the **process**. First of all it has to be easy to set up your test environment and even more important, you need automatic feedback when writing tests. It should not take you out of the process of implementing code, but naturally be a part of it.

Grunt-tdd ideally runs on your second monitor, in a browser window. When you write your tests it will automatically refresh. It will also refresh when you start implementing your code. This automatic refresh will let you easily jump between your test-file and implemention-file, keeping you inside your IDE.

## The essence
- It is a PROCESS
- It is a UNIT testing reporter
- Supports Buster, Mocha and Jasmine
- Supports AngularJS unit tests
- Runs both browser and node tests and displays the result in your browser
- Hit **SPACEBAR** to toggle collapsing of tests, only showing the ones that give error

## Deps
- **npm install grunt-contrib-watch**

## Configuration

``` javascript

  module.exports = function (grunt) {
    grunt.initConfig({
      tdd: { 
        // NODE CONFIG
        node: {
          files: {
            sources: ['server/src/**/*.js'], // Where your application files are located
            libs: [], // Any general libs needed to be loaded
            tests: ['server/tests/**/*-test.js'] // Where your tests are located
          },
          options: {
            node: true, // Set to true if testing node code
            runner: 'jasmine', // jasmine, mocha or buster
            expect: true // Use the expect.js library for assertions
          }
        },
        
        // BROWSER CONFIG
        browser: {
          files: {
            sources: ['client/src/**/*.js'], // Where your application files are located
            libs: [ // Libs loaded in order
              'client/libs/jquery.js',
              'client/libs/underscore.js', 
              'client/libs/backbone.js'],
            tests: ['client/tests/**/*-test.js'] // Where your tests are located
          },
          options: {
            runner: 'mocha', // jasmine, mocha or buster
            expect: true // Use the expect.js library for assertions
          }
        },
        
        // REQUIREJS CONFIG
        browser2: {
          files: {
            sources: ['client/src/**/*.js'], // Where your application files are located
            requirejs: {
              baseUrl: 'client/'
            },
            libs: [ // Libs loaded in order
              'client/libs/jquery.js',
              'client/libs/underscore.js', 
              'client/libs/backbone.js'],
            tests: ['client/tests/**/*-test.js'] // Where your tests are located
          },
          options: {
            runner: 'mocha', // jasmine, mocha or buster
            expect: true // Use the expect.js library for assertions
          }
        }
      }
    });
  }
```

## Get going

**First time:**
- Choose your testing library
- I recommend using expect as assertion tool (expect.js)
- Configure requirejs if needed

**When you start developing:**
- Run the task
- Open the browser at localhost and port configured (default 3000)
