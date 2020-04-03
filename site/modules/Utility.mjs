export function convertColorIdToColor(iColorId) {
  var wB = parseInt(iColorId % 255);
  var wG = parseInt(Math.floor(iColorId % (255 * 255) / 255));
  var wR = parseInt(Math.floor(iColorId % (255 * 255 * 255) / (255 * 255)));

  return `rgb(${wR},${wG},${wB})`;
}

export function convertColorToColorId(iR, iG, iB) {
  var iColorId = parseInt(iB);
  iColorId += 255 * parseInt(iG);
  iColorId += 255 * 255 * parseInt(iR);
  return iColorId;
}

export function getRandomColor() {

  var letters = '0123456789ABCDEF'.split('');
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export function getUrlParameter(iParameter) {
  var wPageURL = window.location.search.substring(1);
  var wURLVariables = wPageURL.split('&');
  for (var i = 0; i < wURLVariables.length; i++) {
    var wParameterName = wURLVariables[i].split('=');
    if (wParameterName[0] == iParameter) {
      return wParameterName[1];
    }
  }

  return "";
}

export function getAllScroll(iDOM) {
  var wScrollX = 0;
  var wScrollY = 0;

  var wCurrentDOM = iDOM;

  while (wCurrentDOM != document.body) {
    wCurrentDOM = wCurrentDOM.offsetParent;
    
    if (null != wCurrentDOM) {
      wScrollX += parseInt(wCurrentDOM.scrollLeft);
      wScrollY += parseInt(wCurrentDOM.scrollTop);
    }
    else {
      break;
    }
  }
  
//  wScrollX += parseInt(window.pageXOffset);
//  wScrollY += parseInt(window.pageYOffset);

  return {
    x: wScrollX,
    y: wScrollY,
  };

}

export function getAllParentOffset(iDOM) {
  var wOffsetTop = 0;
  var wOffsetLeft = 0;

  var wCurrentDOM = iDOM;

  while (wCurrentDOM != document.body) {
    wCurrentDOM = wCurrentDOM.offsetParent;
    if (null != wCurrentDOM) {
      wOffsetTop += parseInt(wCurrentDOM.offsetTop);
      wOffsetLeft += parseInt(wCurrentDOM.offsetLeft);  
    }
    else {
      break;
    }
  }

  return {
    offsetTop: wOffsetTop,
    offsetLeft: wOffsetLeft,
  };

}

export function getDOMRelativeMousePosition(iDOM, iMouseX, iMouseY) {
  
  var wScroll = getAllScroll(iDOM);
  var wOffset = getAllParentOffset(iDOM);
  
  return {
    x: iMouseX - (iDOM.offsetLeft + wOffset.offsetLeft - wScroll.x),
    y: iMouseY - (iDOM.offsetTop + wOffset.offsetTop - wScroll.y)
  }
}

export function mergeObject(iSrcObj, iDestObj ) {
  for (var property in iSrcObj) {
    if (iDestObj.hasOwnProperty(property)) {
      iDestObj[property] = iSrcObj[property];
    }
  }
}