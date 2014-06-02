var Gamepad = require('node-gamepad');

Gamepad.prototype._loadConfiguration = function () {
    this._config = require(this._type);
};

var path = process.argv[2];
var controller = new Gamepad(__dirname + '/saved/' + path);
var config = require('./saved/' + path);

controller.connect();

(config.buttons || []).forEach(function (button) {
    controller.on(button.name + ':press', function () {
        console.log(button.name + ':press');
    });
    controller.on(button.name + ':release', function () {
        console.log(button.name + ':release');
    });
});

(config.joysticks || []).forEach(function (joystick) {
    controller.on(joystick.name + ':move', function (value) {
        console.log(joystick.name + ':move', value);
    });
});
