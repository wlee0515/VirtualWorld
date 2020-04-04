import * as mod_EntityManager from "../modules/EntityManager.mjs";
import * as mod_PlanetModel from "../modules/PlanetModel.mjs";
import * as mod_PlanetRenderer from "../modules/PlanetRenderer.mjs";
import * as mod_WebRTI from "https://webrti.herokuapp.com/script/javascript/WebRTI.mjs";


function SimulationMain (iViewPointCanvasId) {
  
  this.internalData = {
    SimulationStarted : false,
    LastTimeStamp: (new Date()).getTime()
  }

  this.providers = {
    WebRTI : new mod_WebRTI.WebRTI(),
    EntityManager : new mod_EntityManager.EntityManager(),
  }

  this.ViewPoint = {
    WorldRenderer : new mod_PlanetRenderer.PlanetRenderer(iViewPointCanvasId, 5000)
  }

  this.entryPointCallbackList = [];
  this.subscribeToEntryPointCallback = function (iCallback) {
    this.entryPointCallbackList.push(iCallback);
  }

  this.Ownship = {
    location : [0.0, 0.0, 0.0],
    eulerAngle : [0.0, 0.0, 0.0],
    modelInfo : {
      modelPath: "https://wlee0515.github.io/site/pages/SimpleGame/Horse.glb",
      modelRotation: [0.0, 180.0, 0.0],
      modelOffset: [0.0, -0.05, 0.0],
      modelScale: [1.0, 1.0, 1.0],  
    },
    updateFlags : {
      position : true,
      model : true
    }
  }

  this.setOwnshipLocation = function(iLatitude,iLongitude, iAltitude){
    this.Ownship.location = [iLatitude,iLongitude, iAltitude];
    this.Ownship.updateFlags.position = true;
  } 
  
  this.setOwnshipEulerAngles = function( iRoll, iPitch, iYaw) {
    this.Ownship.eulerAngle = [iRoll, iPitch, iYaw];
    this.Ownship.updateFlags.position = true;
  }

  this.setOwnshipModelInfo = function(iModelPath, iRotation, iOffset, iScale) {
    this.Ownship.modelInfo.modelPath = iModelPath;
    this.Ownship.modelInfo.modelRotation = [iRotation[0],iRotation[1],iRotation[2]];
    this.Ownship.modelInfo.modelOffset = [iOffset[0],iOffset[1],iOffset[2]];
    this.Ownship.modelInfo.modelScale = [iScale[0],iScale[1],iScale[2]];
    this.Ownship.updateFlags.model = true;
  }

  this.startSimulation = function(){
    if(true == this.internalData.SimulationStarted) {
      return;
    }
    this.internalData.SimulationStarted = true;
    this.ViewPoint.WorldRenderer.bindEntityManager(this.providers.EntityManager);
    this.ViewPoint.WorldRenderer.setupViewPoint();
    this.ViewPoint.WorldRenderer.setupScene();

    this.internalData.LastTimeStamp = (new Date()).getTime();
    this.tick();
  }

  this.tick = function() {
    var wNewTime = (new Date()).getTime();
    var wTimeStep = (new Date()).getTime() - this.internalData.LastTimeStamp;
    this.internalData.LastTimeStamp = wNewTime;
    wTimeStep /= 1000;

    this.processTime(wTimeStep);
    window.requestAnimationFrame(this.tick.bind(this));
  }

  this.processTime = function(iDt) {
    for(var wi= 0; wi < this.entryPointCallbackList.length; ++wi) {
      if(null != this.entryPointCallbackList[wi]) {
        this.entryPointCallbackList[wi](iDt);
      }
    }
    this.updateEntities(iDt);
    this.ViewPoint.WorldRenderer.updateCameraOrigin(iDt, this.Ownship.location, this.Ownship.eulerAngle);
    this.ViewPoint.WorldRenderer.updateScene(iDt);
  }

  this.updateEntities = function(iDt) {

    if(this.Ownship.updateFlags.position || this.Ownship.updateFlags.model) {
      var wEntityList = [
        {
          id: "Ownship",
          time: (new Date()).getTime(),
          location: this.Ownship.location,
          eulerAngle: this.Ownship.eulerAngle,
          modelPath: this.Ownship.modelPath,
          modelRotation: this.Ownship.modelInfo.modelRotation,
          modelOffset: this.Ownship.modelInfo.modelOffset,
          modelScale: this.Ownship.modelInfo.modelScale
        }
      ]

      this.providers.WebRTI.setObject("EntityManager", "EntityList", wEntityList);  

      var wEntityId = this.providers.EntityManager.generateEntityIdString("self", "Ownship");
      if( true == this.Ownship.updateFlags.position ) 
      {
        this.Ownship.updateFlags.position = false;
        this.providers.EntityManager.setEntityPosition(wEntityId, this.Ownship.location, this.Ownship.eulerAngle);
      }

      if( true == this.Ownship.updateFlags.model ) 
      {
        this.Ownship.updateFlags.model = false;
        this.ViewPoint.WorldRenderer.setEntityModel(
          wEntityId
          , this.Ownship.modelInfo.modelPath
          , this.Ownship.modelInfo.modelRotation
          , this.Ownship.modelInfo.modelOffset
          , this.Ownship.modelInfo.modelScale);
      }
    }

    var wRemote = this.providers.WebRTI.getRemoteObjectList("EntityManager", "EntityList");

    if (null != wRemote) {
      var wEntries = Object.entries(wRemote);
      for (var wi = 0; wi < wEntries.length; ++wi) {
        var wRemoteList = wEntries[wi][1];
        for (var wj = 0; wj < wRemoteList.length; ++wj) {
          var wEntity = wRemoteList[wj];
          var wEntityId = this.providers.EntityManager.generateEntityIdString(wEntries[wi][0], wEntity.id);
          this.providers.EntityManager.setEntityPosition(wEntityId, wEntity.location, wEntity.eulerAngle);
          this.providers.ViewPoint.WorldRenderer.setEntityModel(wEntityId, wEntity.modelPath, wEntity.modelRotation, wEntity.modelOffset, wEntity.modelScale)
        }

      }
    }
    this.providers.EntityManager.removeNoneUpdated();
  }
}

export {
  SimulationMain
}
