var compact = require('./compact');

module.exports = function (arr, prop) {
    return compact(arr.map(function (a) {
        return a && a[prop];
    }));
};