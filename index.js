#!/usr/bin/env node

var argv = require('yargs').argv;


if (argv.test) {
    return require('./lib/playground')(argv.test);
}


require('colors');
var _ = require('underscore');
var HID = require('node-hid');
var inquirer = require('inquirer');
var async = require('async');
var ProcessData = require('./lib/processData');
var Output = require('./lib/output');


var vendor = argv.vendor;
var product = argv.product;
var rawMode = argv.raw;
var dump = argv.dump;
var platforms = require('./lib/platforms')(argv.platform);
var buttons = platforms.buttons || _.compact((argv.buttons || '').split(','));
var joysticks = platforms.joysticks || _.compact((argv.joysticks || '').split(','));


if (!vendor || !product) {
    console.log(JSON.stringify(HID.devices().filter(function (d) {
        if (vendor) {
            return d.vendorId === vendor;
        }
        if (product) {
            return d.productId === product;
        }
        return true;
    }), null, 2));
    console.log('Please supply one the vendor/product id pairs'.red);
    console.log('Usage:'.red);
    console.log('hid-mapper --vendor 111 --product 222'.green);
    process.exit(0);
}

var processData = new ProcessData({
    hid: new HID.HID(vendor, product)
});
var output = new Output(vendor, product);

processData.on('ready', function () {

    if (dump) {
        console.log('FIRST_FRAMES:', JSON.stringify(processData.firstFrames));
        console.log('IGNORE_PIN:', JSON.stringify(processData.ignorePin));
    }

    if (rawMode) {

        processData.on('change', function (data) {
            console.log(('Change ' + JSON.stringify(data)).red);
        });

        if (typeof rawMode === 'number') {
            setTimeout(function () {
                process.exit(0);
            }, rawMode * 1000);
        }

    } else if (buttons.length > 0 || joysticks.length > 0) {

        console.log('buttons: '.green + buttons.join(', ').red + '\njoysticks: '.green + joysticks.join(', ').red + '\n');
        async.series([
            function (_cb) {
                async.eachSeries(buttons, function (button, cb) {
                    console.log('Press the '.green + button.red + ' button:'.green);
                    processData.once('change', function (data) {
                        processData.wait(250, cb);
                        output.addButton(button, data);
                    });
                }, _cb);
            },
            function (_cb) {
                joysticks = Array.prototype.concat.apply([], joysticks.map(function (joystick) {
                    return [joystick + '.x', joystick + '.y'];
                }));
                async.eachSeries(joysticks, function (joystick, cb) {
                    var parts = joystick.split('.');
                    console.log('Move the '.green + parts[0].red + ' joystick in the '.green + parts[1].red + ' direction:'.green);
                    processData.once('joystick', function (data) {
                        processData.wait(500, cb);
                        output.addJoystick(joystick, data);
                    });
                }, _cb);
            }
        ], output.save.bind(output));
        
    } else {
        
        console.log('Press any button on your controller'.green);
        console.log('^C to quit with an option to save'.green + '\n');
        processData.on('change', function (data) {
            processData.pause();
            inquirer.prompt([{
                name: 'name',
                message : 'Enter an identifier for pin change ' + data.pin + '/' + data.value + ':'
            }], function (answers) {
                var name = answers.name;
                output[name.indexOf('.') > -1 ? 'addJoystick' : 'addButton'](name, data);
                processData.wait(250);
            });
        });
        process.on('SIGINT', output.save.bind(output));

    }
});
