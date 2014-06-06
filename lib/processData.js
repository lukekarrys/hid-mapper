var EventEmitter = require('events').EventEmitter;
var util = require('util');
var _ = require('underscore');
var sameValues = require('./sameValues');

var FIRST_FRAMES = 100;
var JOYSTICK_DETECTION_FRAMES = 100;


function ProcessData (options) {
    EventEmitter.call(this);
    this.setMaxListeners(0);

    this.hid = options.hid;
    this.sensitivity = options.sensitivity || 0;
    this.dump = options.dump;
    this.userIgnore = _.compact((options.ignore || [])).map(function (i) {
        if (i.indexOf('/') > -1) {
            return {
                pin: parseInt(i.split('/')[0]),
                value: parseInt(i.split('/')[1])
            };
        } else {
            return {
                pin: parseInt(i)
            };
        }
    });

    this.firstFrames = [];
    this.recent = [];
    this.isPaused = false;
    this.isReady = false;
    this.ignoreValues = [];

    console.log('\n------------------------------'.green);
    console.log('   Calibrating device...'.green);
    console.log('------------------------------\n'.green);
    this.hid.on('data', this.process.bind(this));
}

util.inherits(ProcessData, EventEmitter);

ProcessData.prototype.process = function (currentFrame) {
    this.emit('data', currentFrame);
    var currentData = currentFrame.toJSON();

    if (this.firstFrames.length < FIRST_FRAMES) {
        this.firstFrames.push(currentData);
        if (this.dump) {
            console.log('Calibrating', this.firstFrames.length, '/', FIRST_FRAMES);
        }
        return;
    }

    if (!this.isReady) {
        this.checkFirstFrames();
        this.isReady = true;
        this.emit('ready');
        return;
    }

    var isChangeFrame = this.detectChangeFrame(currentData);
    var isJoystickFrame = this.detectJoystickFrame(currentData);
    var sameAsFirst = this.sameAsFirst(currentData);

    if (!this.isPaused && !sameAsFirst) {
        // TODO: there needs to be some way that change events are only
        // emitted *after* the prescense of a joystick event is confirmed/denied
        this.trigger(isChangeFrame, isJoystickFrame);
    }

    this.recent.push(currentData);
};

ProcessData.prototype.trigger = function (button, joystick) {
    button && this.emit('change', button);
    joystick && this.emit('joystick', joystick);
};

ProcessData.prototype.mostRecent = function () {
    return this.recent.length ? this.recent[this.recent.length - 1] : null;
};

ProcessData.prototype.sameAsFirst = function (frame) {
    var result = false;
    for (var i = 0, m = this.firstFrames.length; i < m; i++) {
        if (this.firstFrames[i].toString() === frame.toString()) {
            result = true;
            break;
        }
    }
    return result;
};

ProcessData.prototype.checkFirstFrames = function () {
    var diffs = [];
    var prev;

    this.firstFrames.forEach(function (firstFrame) {
        var diff = this.detectChangeFrame(firstFrame, prev);
        if (diff) {
            diffs.push(diff);
        }
        prev = firstFrame;
    }.bind(this));

    this.ignoreValues = _.uniq(diffs.slice().concat(this.userIgnore), false, function (d) {
        return d.pin + '/' + d.value;
    });
};

ProcessData.prototype.detectJoystickFrame = function (frame, previousFrames) {
    previousFrames || (previousFrames = this.recent.slice(-1 * JOYSTICK_DETECTION_FRAMES));


    if (!frame || !previousFrames || previousFrames.length === 0) {
        return null;
    }

    var diffs = [];
    var result;

    previousFrames.forEach(function (previousFrame) {
        diffs.push(this.detectChangeFrame(frame, previousFrame));
    }.bind(this));

    var pins = _.chain(diffs).compact().pluck('pin').value();
    var values = _.chain(diffs).compact().pluck('value').value();

    if (pins.length === JOYSTICK_DETECTION_FRAMES && values.length === JOYSTICK_DETECTION_FRAMES && sameValues(pins)) {
        result = {
            pin: pins[0]
        };
    }

    return result;
};

ProcessData.prototype.shouldIgnoreFrame = function (pin, value) {
    var result = false;

    var ignoreFrame;
    var ignorePin;
    var ignoreValueRange;

    for (var i = 0, m = this.ignoreValues.length; i < m; i++) {
        ignoreFrame = this.ignoreValues[i];
        ignorePin = ignoreFrame.pin;
        ignoreValueRange = ignoreFrame.hasOwnProperty('value') ? [ignoreFrame.value - this.sensitivity, ignoreFrame.value + this.sensitivity] : null;

        if (pin === ignoreFrame.pin) {
            if (!ignoreValueRange) {
                // Ignore all values for this pin
                return true;
            } else if (value >= ignoreValueRange[0] && value <= ignoreValueRange[1]) {
                return true;
            }
        }
    }

    return result;
};


ProcessData.prototype.detectChangeFrame = function (frame, frame2) {
    frame2 || (frame2 = this.mostRecent());

    if (!frame || !frame2) {
        return null;
    }

    var diff;

    frame.forEach(function (value, index) {
        if (this.shouldIgnoreFrame(index, value)) {
            return;
        }
        if (value !== frame2[index]) {
            diff = {
                pin: index,
                value: frame[index]
            };
        }
    }.bind(this));

    return diff;
};

ProcessData.prototype.pause = function () {
    this.isPaused = true;
    return this;
};

ProcessData.prototype.resume = function () {
    this.isPaused = false;
    return this;
};

ProcessData.prototype.wait = function (ms, cb) {
    this.pause();
    setTimeout(function () {
        this.resume();
        cb && cb();
    }.bind(this), ms);
};


module.exports = ProcessData;
