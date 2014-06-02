#!/usr/bin/env node


function diffFrames (frame, frame2, ignoreIndex) {
    if (!frame || !frame2) return null;

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


var argv = require('yargs').argv;
var HID = require('node-hid');
var colors = require('colors');
var inquirer = require('inquirer');
var fs = require('fs');
var devices = HID.devices();


var vendor = argv.vendor;
var product = argv.product;
var ignorePin = argv.ignorepin;
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
hid.on("data", function (currentFrame) {
    if (!firstFrame) firstFrame = currentFrame.toJSON();

    var newFrame = diffFrames(recentFrame, currentFrame.toJSON(), ignorePin);

    if (!ignoreData && newFrame && diffFrames(firstFrame, currentFrame.toJSON(), ignorePin)) {
        ignoreData = true;
        inquirer.prompt([{
            name: 'name',
            message : 'Enter an identifier for pin change ' + newFrame.pin + '/' + newFrame.value + ':'
        }], function (answers) {
            newFrame.name = answers.name;
            newFrame.value = newFrame.value;
            output.buttons.push(newFrame);
            console.log(('Added ' + JSON.stringify(newFrame)).red + '\n');
            ignoreData = false;
        });
    }

    recentFrame = currentFrame.toJSON();
});

process.on('SIGINT', function () {
    inquirer.prompt([{
        name: 'filename',
        message: 'Enter a filename to save this file (blank to skip):'
    }], function (answers) {
        if (answers.filename) {
            fs.writeFileSync(__dirname + '/saved/' + answers.filename, JSON.stringify(output, null, 4));
            console.log(('File saved to ./saved/' + answers.filename).red);
        } else {
            console.log('File not saved'.red);
            console.log(JSON.stringify(output, null, 4));
        }
        process.exit(0);
    });
});
