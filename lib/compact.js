module.exports = function (actual){
    var newArray = [];
    for (var i = 0; i < actual.length; i++) {
        if (actual[i] || typeof actual[i] === 'number') {
            newArray.push(actual[i]);
        }
    }
    return newArray;
};
