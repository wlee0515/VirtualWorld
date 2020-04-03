import EulerRotation from "./EulerRotation.mjs";

const gDegToRad = Math.PI/180;
const gRadToDeg = 180/Math.PI;
const gPlanetRadius = 6371000; //m

export function dimensionConversion (iDrawRadius ) {
  return iDrawRadius/gPlanetRadius;
}

export function convertGeoCoordinateToGeoCentric (iLatitude, iLongitude, iAltitude ) {
      
  var wLatitude = iLatitude*gDegToRad;
  var wLongitude = iLongitude*gDegToRad;

  var wRadius = iAltitude + gPlanetRadius;
  var wEquatorRadius = wRadius*Math.cos(wLatitude);
  
  return {
    x : wEquatorRadius*Math.sin(wLongitude),
    y : wRadius*Math.sin(wLatitude),
    z : wEquatorRadius*Math.cos(wLongitude)
  }
}


export function addNEDVectorToGeoLocation (iLatitude, iLongitude , iAltitude, iNEDVector) {
      
  var wLatitude = iLatitude*gDegToRad;
  var wLongitude = iLongitude*gDegToRad;

  wLatitude += iNEDVector[0]/gPlanetRadius;

  var wHalfPi = Math.PI/2;
  var w2Pi = Math.PI*2;
  
  while (wLatitude > wHalfPi) {
    wLatitude = Math.PI - wLatitude;
    wLongitude += Math.PI;
  }
  
  while (wLatitude < -wHalfPi) {
    wLatitude = -Math.PI - wLatitude;
    wLongitude += Math.PI;
  }
  
  var wLatitudeRadius = Math.cos(wLatitude)*gPlanetRadius;

  wLongitude += iNEDVector[1]/wLatitudeRadius;

  while (wLongitude > Math.PI) {
    wLongitude -= w2Pi;
  }
  while (wLongitude < -Math.PI) {
    wLongitude += w2Pi;
  }

  var wAltitude = iAltitude - iNEDVector[2];
  
  return {
    latitude : wLatitude*gRadToDeg,
    longitude : wLongitude*gRadToDeg,
    altitude : wAltitude
  }
}


export function addBodyVectorToGeoLocation (iLatitude, iLongitude , iAltitude, iRoll, iPitch, iYaw, iBodyVector) {
  
  var wNEDVector = EulerRotation.rotateBodyToNED( iRoll, iPitch, iYaw, iBodyVector);
  return addNEDVectorToGeoLocation(iLatitude, iLongitude , iAltitude , wNEDVector);
}


export default {
  Radius : gPlanetRadius,
  dimensionConversion : dimensionConversion,
  convertGeoCoordinateToGeoCentric : convertGeoCoordinateToGeoCentric,
  addNEDVectorToGeoLocation : addNEDVectorToGeoLocation,
  addBodyVectorToGeoLocation : addBodyVectorToGeoLocation
}

