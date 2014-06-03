#!/usr/bin/env node


function diffFrames (frame, frame2, ignoreIndex) {
    if (!frame || !frame2) {
        return null;
    }

    var diff;
    frame.forEach(function (value, index) {
        if (typeof ignoreIndex === 'number' && index === ignoreIndex) {
            return;
        }
        if (value !== frame2[index]) {
            diff = {
                pin: index,
                value: frame2[index]
            };
        }
    });
    return diff;
}

function compact (actual){
    var newArray = [];
    for (var i = 0; i < actual.length; i++) {
        if (actual[i]) {
            newArray.push(actual[i]);
        }
    }
    return newArray;
}


require('colors');
var argv = require('yargs').argv;
var HID = require('node-hid');
var inquirer = require('inquirer');
var async = require('async');
var path = require('path');
var fs = require('fs');
var devices = HID.devices();

var buttonSets = {
    snes: 'a,b,x,y,l,r,start,select,up,down,left,right',
    n64: 'a,b,z,l,r,start,cUp,cDown,cLeft,cRight,dUp,dDown,dLeft,dRight'
};
var vendor = argv.vendor;
var product = argv.product;
var ignorePin = argv.ignorepin;
var buttons = compact((argv.buttons || '').split(','));
var output = {
    vendorID: vendor,
    productID: product,
    buttons: [],
    joysticks: []
};


if (!vendor || !product) {
    console.log(JSON.stringify(devices, null, 2));
    console.log('Please supply one the vendor/product id pairs'.red);
    console.log('Usage:'.red);
    console.log('hid-mapper --vendor 111 --product 222'.green);
    process.exit(0);
}


var firstFrame;
var recentFrame;
var ignoreData = false;
var hid = new HID.HID(vendor, product);


function processData (currentFrame, cb) {
    if (!firstFrame) {
        firstFrame = currentFrame.toJSON();
    }

    var newFrame = diffFrames(recentFrame, currentFrame.toJSON(), ignorePin);

    if (!ignoreData && newFrame && diffFrames(firstFrame, currentFrame.toJSON(), ignorePin)) {
        ignoreData = true;
        cb(newFrame);
    }

    recentFrame = currentFrame.toJSON();
}


function saveOutput () {
    inquirer.prompt([{
        name: 'filename',
        message: 'Enter a filename to save this file (blank to skip):'
    }], function (answers) {
        var savePath;
        if (answers.filename) {
            savePath = path.resolve(process.cwd(), answers.filename.slice(-5) === '.json' ? answers.filename : answers.filename + '.json');
            fs.writeFile(savePath, JSON.stringify(output, null, 4), function (err) {
                if (err) {
                    console.log('The file could not be saved'.red);
                    console.error(err);
                } else {
                    console.log(('File saved to ' + savePath).red);
                }
                process.exit(0);
            });
            
        } else {
            console.log('File not saved'.red);
            console.log(JSON.stringify(output, null, 4));
            process.exit(0);
        }
    });
}


if (buttons.length > 0) {
    console.log();
    if (buttons.length === 1 && buttonSets.hasOwnProperty(buttons[0])) {
        buttons = buttonSets[buttons[0]].split(',');
    }
    async.eachSeries(buttons, function (button, cb) {
        console.log(('Press the ' + button + ' button:').green);
        hid.on('data', function (data) {
            processData(data, function (newFrame) {
                newFrame.name = button;
                output.buttons.push(newFrame);
                console.log(('Added ' + JSON.stringify(newFrame)).red + '\n');
                hid.removeAllListeners('data');
                ignoreData = false;
                cb();
            });
        });
    }, saveOutput);
} else {
    console.log('Press any button on your controller'.green);
    console.log('^C to quit with an option to save'.green + '\n');
    hid.on('data', function (data) {
        processData(data, function (newFrame) {
            inquirer.prompt([{
                name: 'name',
                message : 'Enter an identifier for pin change ' + newFrame.pin + '/' + newFrame.value + ':'
            }], function (answers) {
                newFrame.name = answers.name;
                output.buttons.push(newFrame);
                console.log(('Added ' + JSON.stringify(newFrame)).red + '\n');
                ignoreData = false;
            });
        });
    });
    process.on('SIGINT', saveOutput);
}
