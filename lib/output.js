var inquirer = require('inquirer');
var path = require('path');
var fs = require('fs');
var _ = require('underscore');


function Output (vendor, product) {
    this.data = {
        vendorID: vendor,
        productID: product,
        buttons: [],
        joysticks: []
    };
}

Output.prototype.stringify = function () {
    return JSON.stringify(this.data, null, 4);
};

Output.prototype.save = function () {
    var self = this;
    inquirer.prompt([{
        name: 'filename',
        message: 'Enter a filename to save this file (blank to skip):'
    }], function (answers) {
        var savePath;
        if (answers.filename) {
            savePath = path.resolve(process.cwd(), answers.filename.slice(-5) === '.json' ? answers.filename : answers.filename + '.json');
            fs.writeFile(savePath, self.stringify(), function (err) {
                if (err) {
                    console.log('The file could not be saved'.red);
                    console.error(err);
                } else {
                    console.log('File saved to ' + savePath.green);
                }
                process.exit(0);
            });
            
        } else {
            console.log('File not saved'.red);
            console.log(self.stringify());
            process.exit(0);
        }
    });
};

Output.prototype.addJoystick = function (joystick, frame) {
    var parts = joystick.split('.');
    var name = parts[0];
    var direction = parts[1];
    var exists = _.find(this.data.joysticks, function (j) {
        return j.name === name;
    });
    if (exists) {
        if (exists.hasOwnProperty(direction)) {
            exists[direction].pin = frame.pin;
            console.log('Replaced ' + JSON.stringify(exists).red + '\n');
        } else {
            exists[direction] = {pin: frame.pin};
            console.log('Added ' + JSON.stringify(exists).red + '\n');
        }
    } else {
        var joystickOutput = {
            name: name
        };
        joystickOutput[direction] = {pin: frame.pin};
        this.data.joysticks.push(joystickOutput);
        console.log('Added ' + JSON.stringify(joystickOutput).red + '\n');
    }
};


Output.prototype.addButton = function(name, frame) {
    var exists = _.find(this.data.buttons, function (b) {
        return b.name === name;
    });
    if (exists) {
        exists.value = frame.value;
        exists.pin = frame.pin;
        console.log('Replaced ' + JSON.stringify(exists).red + '\n');
    } else {
        frame.name = name;
        this.data.buttons.push(frame);
        console.log('Added ' + JSON.stringify(frame).red + '\n');
    }
};

module.exports = Output;