export function EntityManager() {
  this.EntityList = {};

  this.EntityCreationFunction = null;
  this.EntityDeletionFunction = null;
  this.EntitySetPositionFunction = null;

  this.generateEntityIdString = function (iSource, id) {
    return iSource + ' - ' + id;
  }

  this.createEntity = function (iEntityId) {
    if (null == this.EntityList[iEntityId]) {
      var wEntity = {
        isUpdated: false,
      };

      if (null != this.EntityCreationFunction) {
        this.EntityCreationFunction(iEntityId, wEntity);
      }
      this.EntityList[iEntityId] = wEntity;
    }
  }

  this.removeEntity = function (iEntityId) {
    var wEntity = this.EntityList[iEntityId];
    if (null != wEntity) {

      if (null != this.EntityDeletionFunction) {
        this.EntityDeletionFunction(iEntityId, wEntity);
      }
    }
  }


  this.getEntity = function (iEntityId) {
    this.createEntity(iEntityId);
    return this.EntityList[iEntityId];
  }

  this.removeNoneUpdated = function () {
    var wEntries = Object.entries(this.EntityList);
    for (var wi = 0; wi < wEntries.length; ++wi) {
      var wEntry = wEntries[wi];
      if (true == wEntry[1].isUpdated) {
        wEntry[1].isUpdated = false;
      }
      else {
        this.removeEntity(wEntry[0]);
      }
    }
  }

  this.setEntityPosition = function (iEntityId, iLocation, iEuler) {
    var wEntity = this.getEntity(iEntityId);
    if(null != this.EntitySetPositionFunction) {
      this.EntitySetPositionFunction(wEntity, iLocation, iEuler);
    }
    
    wEntity.isUpdated = true;
  }

  this.setEntityModel = function (iEntityId, iModelPath, iRotation, iOffset, iScale) {

    var wEntity = this.EntityList[iEntityId];
    if (null == wEntity) {
      return;
    }

    wEntity.isUpdated = true;

    if ((wEntity.modelRotation[0] != iRotation[0]) || (wEntity.modelRotation[1] != iRotation[1]) || (wEntity.modelRotation[2] != iRotation[2])) {
      wEntity.modelRotation = [iRotation[0], iRotation[1], iRotation[2]];
      if (null != wEntity.model) {
        wEntity.model.rotation.set(wEntity.modelRotation[0] * gDegToRad, wEntity.modelRotation[1] * gDegToRad, wEntity.modelRotation[2] * gDegToRad);
      }
    }

    if ((wEntity.modelOffset[0] != iOffset[0]) || (wEntity.modelOffset[1] != iOffset[1]) || (wEntity.modelOffset[2] != iOffset[2])) {
      wEntity.modelOffset = [iOffset[0], iOffset[1], iOffset[2]];
      if (null != wEntity.model) {
        wEntity.model.position.set(wEntity.modelOffset[0], wEntity.modelOffset[1], wEntity.modelOffset[2]);
      }
    }

    if ((wEntity.modelScale[0] != iScale[0]) || (wEntity.modelScale[1] != iScale[1]) || (wEntity.modelScale[2] != iScale[2])) {
      wEntity.modelScale = [iScale[0], iScale[1], iScale[2]];
      if (null != wEntity.model) {
        var wModelScale = gGlobal.Planet.DrawRadius / gGlobal.Planet.Radius;
        wEntity.model.scale.set(wEntity.modelScale[0] * wModelScale, wEntity.modelScale[1] * wModelScale, wEntity.modelScale[2] * wModelScale);
      }
    }

    if (wEntity.modelPath == iModelPath) {
      return;
    }

    var wEntityId = iEntityId;
    wEntity.modelPath = iModelPath;

    gGlobal.ViewPoint.LoaderList["gltf"].load(iModelPath, function (iModelData) {
      if (0 != iModelData.animations.length) {
        var wMixer = new THREE.AnimationMixer(iModelData.scene);
        var wAction = wMixer.clipAction(iModelData.animations[0]);
        wAction.play();
        gGlobal.ViewPoint.MixerList.push(wMixer);
      }

      var wEntity = this.EntityList[wEntityId];

      if (null != wEntity) {

        if (null != wEntity.model) {
          wEntity.model.dispose();
        }

        wEntity.model = iModelData.scene;

        var wModelScale = gGlobal.Planet.DrawRadius / gGlobal.Planet.Radius;

        wEntity.model.rotation.set(wEntity.modelRotation[0] * gDegToRad, wEntity.modelRotation[1] * gDegToRad, wEntity.modelRotation[2] * gDegToRad);
        wEntity.model.position.set(wEntity.modelOffset[0], wEntity.modelOffset[1], wEntity.modelOffset[2]);
        wEntity.model.scale.set(wEntity.modelScale[0] * wModelScale, wEntity.modelScale[1] * wModelScale, wEntity.modelScale[2] * wModelScale);

        wEntity.group.add(wEntity.model);
        wEntity.mesh.visible = false;
      }
      else {
        iModelData.dispose();
      }
    }.bind(this))
  }
}


export default {
  EntityManager: EntityManager
}