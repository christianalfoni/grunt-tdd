grunt-tdd
=========

> Presentation at: [Grunt-tdd presentation on YouTube](http://www.youtube.com/watch?v=1xMKeq-plFk)

It is difficult to get going with TDD. There are a lot of presentations on how to write tests, but really, it is not understanding how to write tests that prevents you from doing TDD, it is the **process**. First of all it has to be easy to set up your test environment and even more important, you need automatic feedback when writing tests. It should not take you out of the process of implementing code, but naturally be a part of it.

Grunt-tdd ideally runs on your second monitor, in a browser window. When you write your tests it will automatically refresh. It will also refresh when you start implementing your code. This automatic refresh will let you easily jump between your test-file and implemention-file, keeping you inside your IDE.

## The essence
- It is a PROCESS
- It is a UNIT testing reporter
- Supports Buster, Mocha and Jasmine
- Supports AngularJS unit tests
- Supports sinon.js (stubbing, spies and fake XHR) 
- Runs both browser and node tests and displays the result in your browser
- Hit **SPACEBAR** to toggle collapsing of tests, only showing the ones that give error
- All your test files are found on the dropdown top right
- Run f.ex. **grunt tdd:browser --runAll** to run all tests in terminal

## Deps
- **npm install grunt-contrib-watch**

**Important!** Due to watching a lot of files for changes when writing tests it is needed to increase MacOSX default open file limit, which is very low by default. Create/Edit your ~/.bash_profile file and add the following line: ulimit -S -n 2048 (or higher).

## Configuration

In your **Gruntfile.js**:

	``` javascript

		module.exports = function (grunt) {
    		grunt.initConfig({
      			tdd: { 
        			// NODE CONFIG
        			node: {
          			files: {
            				sources: ['server/src/**/*.js'], // Where your application files are located
            				libs: [], // Any general libs needed to be loaded, will be loaded from your node_modules folder
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
            				runner: 'buster', // jasmine, mocha or buster
            				expect: true, // Use the expect.js library for assertions
            				sinon: true // For spies, stubs and fake XHR
          			}
        			},
        
				// REQUIREJS CONFIG
        		browser2: {
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
            			requirejs: {
              			baseUrl: 'client/'
            			}
          		}
        		}
      		}
    	});
  	}

  	grunt.loadNpmTasks('grunt-tdd');

	```

## Get going

### First time
- Choose your test runner. Buster, mocha or jasmine
- I recommend using expect as assertion tool (expect.js)
- Configure requirejs if needed

### When you start developing
- Run the task with **grunt tdd:#PROFILE#** (#PROFILE# is the name of your task profile. With the examples above it would be: grunt tdd:node, grunt tdd:browser or grunt tdd:browser2)
- Open the browser at localhost and port configured (default 3001)
