module.exports = function (arr) {
    if (arr.length > 0) {
        for (var i = 1; i < arr.length; i++) {
            if (arr[i] !== arr[0]) {
                return false;
            }
        }
    }
    return true;
};