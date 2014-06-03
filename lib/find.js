module.exports = function (arr, name) {
    return arr.filter(function (a) {
        return a.name === name;
    })[0];
};