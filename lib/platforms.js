var buttonSets = {
    snes: 'a,b,x,y,l,r,start,select,up,down,left,right',
    n64: 'a,b,z,l,r,start,cUp,cDown,cLeft,cRight,dUp,dDown,dLeft,dRight',
    ps4: 'square,triangle,circle,x,l1,l2,lStick,r1,r2,rStick,share,options,ps,dUp,dDown,dLeft,dRight'
};
var joystickSets = {
    n64: 'center',
    ps4: 'left,right'
};

module.exports = function (platform) {
    var returnObj = {};
    if (platform && buttonSets.hasOwnProperty(platform)) {
        returnObj.buttons = buttonSets[platform].split(',');
    }
    if (platform && joystickSets.hasOwnProperty(platform)) {
        returnObj.joysticks = joystickSets[platform].split(',');
    }
    return returnObj;
};