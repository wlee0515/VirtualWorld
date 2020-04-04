const gDegToRad = Math.PI/180;
const gRadToDeg = 180/Math.PI;

function rotateAxisCW(iAngle, iAxis, iVector) {
  var wTempVector = [iVector[0], iVector[1], iVector[2]];

  var wAxis1 = (iAxis + 1) % 3;
  var wAxis2 = (iAxis + 2) % 3;
  var wCAng = Math.cos(iAngle * gDegToRad);
  var wSAng = Math.sin(iAngle * gDegToRad);
  wTempVector[wAxis1] = iVector[wAxis1] * wCAng + iVector[wAxis2] * wSAng
  wTempVector[wAxis2] = -iVector[wAxis1] * wSAng + iVector[wAxis2] * wCAng

  return wTempVector;
}

function rotateAxisCCW(iAngle, iAxis, iVector) {
  var wTempVector = [iVector[0], iVector[1], iVector[2]];

  var wAxis1 = (iAxis + 1) % 3;
  var wAxis2 = (iAxis + 2) % 3;
  var wCAng = Math.cos(iAngle * gDegToRad);
  var wSAng = Math.sin(iAngle * gDegToRad);
  wTempVector[wAxis1] = iVector[wAxis1] * wCAng - iVector[wAxis2] * wSAng
  wTempVector[wAxis2] = iVector[wAxis1] * wSAng + iVector[wAxis2] * wCAng

  return wTempVector;
}

function rotateNEDToBody(iRoll, iPitch, iYaw, iNEDVector) {
  var wBodyVector = [iNEDVector[0], iNEDVector[1], iNEDVector[2]];
  wBodyVector = rotateAxisCW(iYaw, 2, wBodyVector);
  wBodyVector = rotateAxisCW(iPitch, 1, wBodyVector);
  wBodyVector = rotateAxisCW(iRoll, 0, wBodyVector);

  return wBodyVector;
}

function rotateBodyToNED(iRoll, iPitch, iYaw, iBodyVector) {
  var wNEDVector = [iBodyVector[0], iBodyVector[1], iBodyVector[2]];
  wNEDVector = rotateAxisCW(-iRoll, 0, wNEDVector);
  wNEDVector = rotateAxisCW(-iPitch, 1, wNEDVector);
  wNEDVector = rotateAxisCW(-iYaw, 2, wNEDVector);

  return wNEDVector;

}

export {
  rotateAxisCW,
  rotateAxisCCW,
  rotateNEDToBody,
  rotateBodyToNED
}

