#!/usr/bin/env node


require('colors');
var version = require('./package').version;


var argv = require('yargs')
.default({
    vendor: '',
    product: '',
    loglevel: 0,
    logonly: false,
    sensitivity: 2,
    ignore: '',
    platform: '',
    buttons: '',
    joysticks: ''
})
.boolean(['logonly'])
.argv;


console.log('\n------------------------------'.green);
console.log(('   hid-mapper v' + version).green);
console.log('------------------------------'.green);


if (argv.test) {
    console.log('\nPress all the buttons!\n'.green);
    return require('./lib/playground')(argv.test);
}


var _ = require('underscore');
var HID = require('node-hid');
var inquirer = require('inquirer');
var async = require('async');
var ProcessData = require('./lib/processData');
var Output = require('./lib/output');


var vendor = argv.vendor;
var product = argv.product;
var loglevel = argv.loglevel;
var logonly = argv.logonly;
var sensitivity = argv.sensitivity;
var ignore = (_.isNumber(argv.ignore) || argv.ignore.indexOf('/') > -1 ? argv.ignore + '' : '').split(',');
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
    console.log('\nPlease supply one the vendor/product id pairs'.red);
    console.log('Usage:'.red, 'hid-mapper --vendor 111 --product 222'.green, '\n');
    process.exit(0);
}


var processData = new ProcessData({
    hid: new HID.HID(vendor, product),
    sensitivity: sensitivity,
    ignore: ignore
});
var output = new Output(vendor, product);


processData.on('ready', function () {

    if (loglevel) {

        console.log('FIRST_FRAMES:', JSON.stringify(processData.firstFrames, function (key, value) {
            if (_.isArray(value) && value.length > 0 && !_.isArray(value[0])) {
                return value.join();
            }
            return value;
        }, 2));
        console.log('IGNORE:', JSON.stringify(processData.ignoreValues, function (key, value) {
            if (_.isObject(value) && typeof value.pin !== 'undefined') {
                return 'pin:' + value.pin + ', value:' + value.value;
            }
            return value;
        }, 2));

        if (loglevel === 2) {

            processData
            .on('data', function (data) {
                console.log(('Data ' + JSON.stringify(data)).red);
            });

        } else if (loglevel === 1) {

            processData
            .on('change', function (data) {
                console.log(('Change ' + JSON.stringify(data)).red);
            })
            .on('joystick', function (data) {
                console.log(('Joystick ' + JSON.stringify(data)).red);
            });

        }

    }

    if (logonly) {
        return;
    }

    if (buttons.length > 0 || joysticks.length > 0) {

        console.log('joysticks: '.green + joysticks.join(', ').red);
        console.log('buttons: '.green + buttons.join(', ').red + '\n');

        async.series([
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
                        if (parts[1] === 'y') {
                            processData.ignorePin(output.getJoystick(parts[0]));
                        }
                    });
                }, _cb);
            },
            function (_cb) {
                async.eachSeries(buttons, function (button, cb) {
                    console.log('Press the '.green + button.red + ' button:'.green);
                    processData.once('change', function (data) {
                        processData.wait(250, cb);
                        output.addButton(button, data);
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
