var inquirer = require('inquirer');
var path = require('path');
var fs = require('fs');
var _ = require('underscore');


function Output (vendor, product) {
    this.data = {
        vendorID: vendor,
        productID: product,
        joysticks: [],
        buttons: []
    };
}

Output.prototype.stringify = function () {
    return JSON.stringify(this.data, null, 4);
};

Output.prototype.cleanup = function () {
    _.each(this.data, function (value, key, list) {
        if (_.isArray(value) && value.length === 0) {
            delete list[key];
        }
    });
};

Output.prototype.save = function () {
    var self = this;

    this.cleanup();

    inquirer.prompt([{
        name: 'filename',
        message: 'Enter a filename to save this file (blank to skip):'
    }], function (answers) {
        var savePath;
        console.log();
        if (answers.filename) {
            savePath = path.resolve(process.cwd(), answers.filename.slice(-5) === '.json' ? answers.filename : answers.filename + '.json');
            fs.writeFile(savePath, self.stringify(), function (err) {
                if (err) {
                    console.log('The file could not be saved'.red);
                    console.error(err);
                    console.log(self.stringify());
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
    frame = _.pick(frame, 'value', 'pin');
    var parts = joystick.split('.');
    var name = parts[0];
    var direction = parts[1];
    var exists = _.find(this.data.joysticks, function (j) {
        return j.name === name;
    });
    if (exists) {
        if (exists.hasOwnProperty(direction)) {
            exists[direction].pin = frame.pin;
            console.log(JSON.stringify(exists) + '\n');
        } else {
            exists[direction] = {pin: frame.pin};
            console.log(JSON.stringify(exists) + '\n');
        }
    } else {
        var joystickOutput = {
            name: name
        };
        joystickOutput[direction] = {pin: frame.pin};
        this.data.joysticks.push(joystickOutput);
        console.log(JSON.stringify(joystickOutput) + '\n');
    }
};

Output.prototype.addButton = function(name, frame) {
    frame = _.pick(frame, 'value', 'pin');
    var exists = _.find(this.data.buttons, function (b) {
        return b.name === name;
    });
    if (exists) {
        exists.value = frame.value;
        exists.pin = frame.pin;
        console.log(JSON.stringify(exists) + '\n');
    } else {
        frame.name = name;
        this.data.buttons.push(frame);
        console.log(JSON.stringify(frame) + '\n');
    }
};

module.exports = Output;
