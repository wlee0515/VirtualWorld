function httpRequest_Get(iUrl, iCallback){
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", iUrl, true);
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        if(null != iCallback) {
          iCallback(xhttp.responseText);
        }
      }
    };
    xhttp.send();
 }

 function hashCode(str) { // java String#hashCode
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

function hashCodeColor(str) {
  var hash = hashCode(str);
  var r = (hash & 0xFF0000) >> 16;
  var g = (hash & 0x00FF00) >> 8;
  var b = hash & 0x0000FF;
  return "rgb(" + r + "," + g + "," + b + ")";
}

function loadScript(iUrl){
  var script = document.createElement("script")
  script.type = "text/javascript";
  script.src = iUrl;
  document.getElementsByTagName("head")[0].appendChild(script);
}

export {
  httpRequest_Get,
  hashCode,
  hashCodeColor,
  loadScript
}
