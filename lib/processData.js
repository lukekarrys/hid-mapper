var EventEmitter = require('events').EventEmitter;
var util = require('util');
var pluck = require('./pluck');
var sameValues = require('./sameValues');


function ProcessData (options) {
    EventEmitter.call(this);
    this.setMaxListeners(0);

    this.hid = options.hid;

    this.firstFrames = [];
    this.recent = [];
    this.isPaused = false;
    this.isReady = false;
    this.ignorePin = null;

    console.log('Calibrating device...'.green);
    this.hid.on('data', this.process.bind(this));
}

util.inherits(ProcessData, EventEmitter);

ProcessData.prototype.process = function (currentFrame) {
    this.emit('data', currentFrame);
    var currentData = currentFrame.toJSON();

    if (this.firstFrames.length < 50) {
        this.firstFrames.push(currentData);
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
        isChangeFrame && this.emit('change', isChangeFrame);
        isJoystickFrame && this.emit('joystick', isJoystickFrame);
    }

    this.recent.push(currentData);
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
    var differingIndex;
    var prev;
    this.firstFrames.forEach(function (firstFrame) {
        var diff = this.detectChangeFrame(firstFrame, prev);
        if (diff) {
            differingIndex = diff.pin;
        }
        prev = firstFrame;
    }.bind(this));

    if (typeof differingIndex === 'number') {
        this.ignorePin = differingIndex;
    }
};

ProcessData.prototype.detectJoystickFrame = function (frame, previousFrames) {
    previousFrames || (previousFrames = this.recent.slice(-100));


    if (!frame || !previousFrames || previousFrames.length === 0) {
        return null;
    }

    var diffs = [];
    var result;

    previousFrames.forEach(function (previousFrame) {
        diffs.push(this.detectChangeFrame(frame, previousFrame));
    }.bind(this));

    var pins = pluck(diffs, 'pin');
    var values = pluck(diffs, 'value');

    if (pins.length === 100 && values.length === 100 && sameValues(pins)) {
        result = {
            pin: pins[0]
        };
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
        if (typeof this.ignorePin === 'number' && index === this.ignorePin) {
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
        cb();
    }.bind(this), ms);
};


module.exports = ProcessData;
