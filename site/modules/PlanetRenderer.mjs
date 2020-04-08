import * as mod_utility from "./utility.mjs";
import * as mod_PlanetModel from "./PlanetModel.mjs";
import * as THREE from '../javascript/threejs/three.mjs';
import { GLTFLoader } from '../javascript/threejs/jsm/loaders/GLTFLoader.mjs';

const gDegToRad = Math.PI / 180;

function compareVector(iVector1, iVector2) {
  if (iVector1.length == iVector2.length) {
    for (var wi = 0; wi < iVector1.length; ++wi) {
      if (iVector1[wi] != iVector1[wi]) {
        return false;
      }
    }
    return true;
  }
  return false;
}

function getEulerQuaternion (iLatitude, iLongitude, iRoll, iPitch, iYaw ) {

  var wQuat1 = new THREE.Quaternion();
  var wRefEuler = new THREE.Euler(-iLatitude*gDegToRad + Math.PI/2, iLongitude*gDegToRad, 0, "ZYX" );
  wQuat1.setFromEuler(wRefEuler);

  var wQuat2 = new THREE.Quaternion();
  var wLocalEuler = new THREE.Euler( iPitch*gDegToRad, -iYaw*gDegToRad, -iRoll*gDegToRad, "YXZ" );
  wQuat2.setFromEuler(wLocalEuler);

  wQuat1.multiply(wQuat2);
  
  return wQuat1;
}

function PlanetRenderer(iOutputCanvasId, iPlanetDrawRadius) {
  
  this.InternalData = {
    CanvasId : iOutputCanvasId,
    Scene : null,
    Camera : null,
    CameraPositionOffset : [-500.0,0.0,-500.0],
    CameraAngleOffset : [0.0,-20.0,0.0],
    Renderer : null,
    LoaderList : [],
    MixerList : [],
    x_rotateElements : [],
    y_rotateElements : [],
    z_rotateElements : [],
    DrawRadius : iPlanetDrawRadius,
    GLTFloader : new GLTFLoader()
  }
  
  this.InternalData.GLTFloader.crossOrigin = true;

  this.Images = {
    Textures : {
      Ring : "../images/ribbon_white_d3.png",
      Ground : "../images/ground_01.png",
      Water : "../images/water_01.png",
    }
  },
  this.mEntityManagerList = [];

  this.entityCreationFunction = function (iEntityId, iEntity) {
    var wGeometry = new THREE.BoxGeometry(1, 1, 1);
    var wMaterial = new THREE.MeshLambertMaterial({ color: mod_utility.hashCode(iEntityId) });
    var wMesh = new THREE.Mesh(wGeometry, wMaterial);
    var wGroup = new THREE.Group();
    wGroup.add(wMesh);
    this.InternalData.Scene.add(wGroup);

    iEntity.metadata = {
      geometry: wGeometry,
      material: wMaterial,
      mesh: wMesh,
      model: null,
      group: wGroup,
      modelPath: "",
      modelRotation: [0.0, 0.0, 0.0],
      modelOffset: [0.0, 0.0, 0.0],
      modelScale: [1.0, 1.0, 1.0]
    }

  }

  this.entityDeletionFunction = function (iEntityId, iEntity) {

    this.InternalData.Scene.remove(iEntity.metadata.mesh);
    iEntity.metadata.geometry.dispose();
    iEntity.metadata.material.dispose();

    if (null != iEntity.metadata.group) {
      this.InternalData.Scene.remove(iEntity.metadata.group);
    }
  }


  this.entitySetPositionFunction = function (iEntity, iLocation, iEuler) {

    var wConversion = mod_PlanetModel.dimensionConversion(this.InternalData.DrawRadius);
    var wPosition = mod_PlanetModel.convertGeoCoordinateToGeoCentric(iLocation[0], iLocation[1], iLocation[2]);
    var wDrawPosition = [wPosition.x * wConversion, wPosition.y * wConversion, wPosition.z * wConversion]

    var wEulerQuat = getEulerQuaternion(iLocation[0], iLocation[1], iEuler[0], iEuler[1], iEuler[2]);

    iEntity.metadata.group.position.set(wDrawPosition[0], wDrawPosition[1], wDrawPosition[2]);
    iEntity.metadata.group.rotation.setFromQuaternion(wEulerQuat);
  }


  this.setEntityModel = function (iEntityId, iModelPath, iRotation, iOffset, iScale) {
    var wEntity = null;
    for(var wi = 0; wi < this.mEntityManagerList.length ; ++wi) {
      wEntity = this.mEntityManagerList[wi].findEntity(iEntityId);
      if(null != wEntity) {
        break;
      }
    }

    if (null == wEntity) {
      return;
    }

    if (compareVector(wEntity.metadata.modelRotation, iRotation)) {
      wEntity.metadata.modelRotation = [iRotation[0], iRotation[1], iRotation[2]];
      if (null != wEntity.model) {
        wEntity.metadata.model.rotation.set(
          wEntity.metadata.modelRotation[0] * gDegToRad,
          wEntity.metadata.modelRotation[1] * gDegToRad,
          wEntity.metadata.modelRotation[2] * gDegToRad);

      }
    }

    if (compareVector(wEntity.metadata.modelOffset, iOffset)) {
      wEntity.metadata.modelOffset = [iOffset[0], iOffset[1], iOffset[2]];
      if (null != wEntity.model) {
        wEntity.metadata.model.position.set(
          wEntity.metadata.modelOffset[0],
          wEntity.metadata.modelOffset[1],
          wEntity.metadata.modelOffset[2]);
      }
    }

    if (compareVector(wEntity.metadata.modelScale, iOffset)) {
      wEntity.metadata.modelScale = [iScale[0], iScale[1], iScale[2]];
      if (null != wEntity.model) {

        var wModelScale = mod_PlanetModel.dimensionConversion(this.InternalData.DrawRadius);
        wEntity.metadata.model.scale.set(
          wEntity.metadata.modelScale[0] * wModelScale,
          wEntity.metadata.modelScale[1] * wModelScale,
          wEntity.metadata.modelScale[2] * wModelScale);
      }
    }

    if (wEntity.metadata.modelPath != iModelPath) {
      wEntity.metadata.modelPath = iModelPath;

      var wViewPoint = this.InternalData;
      this.InternalData.GLTFloader.load(iModelPath, function (iModelData) {
        if (0 != iModelData.animations.length) {
          var wMixer = new THREE.AnimationMixer(iModelData.scene);
          var wAction = wMixer.clipAction(iModelData.animations[0]);
          wAction.play();
          wViewPoint.MixerList.push(wMixer);
        }

        if (null != this.metadata.model) {
          this.metadata.model.dispose();
        }

        this.metadata.model = iModelData.scene;

        this.metadata.model.rotation.set(
          this.metadata.modelRotation[0] * gDegToRad,
          this.metadata.modelRotation[1] * gDegToRad,
          this.metadata.modelRotation[2] * gDegToRad);

        this.metadata.model.position.set(
          this.metadata.modelOffset[0],
          this.metadata.modelOffset[1],
          this.metadata.modelOffset[2]);


        var wModelScale = mod_PlanetModel.dimensionConversion(wViewPoint.DrawRadius);
        this.metadata.model.scale.set(
          this.metadata.modelScale[0] * wModelScale,
          this.metadata.modelScale[1] * wModelScale,
          this.metadata.modelScale[2] * wModelScale);

        this.metadata.group.add(this.metadata.model);
        this.metadata.mesh.visible = false;

      }.bind(wEntity))

    }
  }

  this.bindEntityManager = function (iEntityManager) {
    this.mEntityManagerList.push(iEntityManager);
    iEntityManager.EntityCreationFunction = this.entityCreationFunction.bind(this);
    iEntityManager.EntityDeletionFunction = this.entityDeletionFunction.bind(this);
    iEntityManager.EntitySetPositionFunction = this.entitySetPositionFunction.bind(this);
  }

  this.setupViewPoint = function () {
    this.InternalData.Scene = new THREE.Scene();
    this.InternalData.Camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 100000 );
    this.InternalData.Camera.position.set( 0, 0, 20 );
    this.InternalData.Camera.lookAt( 0, 0, 0 );

    var wCanvasDOM = document.getElementById(this.InternalData.CanvasId);
    if (null != wCanvasDOM) {
      this.InternalData.Renderer = new THREE.WebGLRenderer({antialias: true, canvas:  wCanvasDOM,  alpha: true });
    }
    else {
      this.InternalData.Renderer = new THREE.WebGLRenderer({antialias: true,  alpha: true });
      document.body.appendChild( this.InternalData.Renderer.domElement );
    }
    this.InternalData.Renderer.setClearColor( 0x000000, 0.0 );
    this.InternalData.Renderer.setPixelRatio( window.devicePixelRatio );

    this.InternalData.Renderer.toneMapping = THREE.LinearToneMapping;
    this.InternalData.Renderer.toneMappingExposure = Math.pow( 0.94, 5.0 );
    this.InternalData.Renderer.shadowMap.enabled = true;
    this.InternalData.Renderer.shadowMap.type = THREE.PCFShadowMap;

    var resizeFunction = function(){

      if (null != this.InternalData.Renderer) {
        var wWidth = window.innerWidth;
        var wHeight = window.innerHeight;
        var wCanvasDOM = document.getElementById(this.InternalData.CanvasId);
        if (null != wCanvasDOM) {
          wWidth = wCanvasDOM.width = wCanvasDOM.parentNode.clientWidth;
          wHeight = wCanvasDOM.height = wCanvasDOM.parentNode.clientHeight;
        }
        this.InternalData.Renderer.setSize(wWidth, wHeight);

        if (null != this.InternalData.Camera) {
          this.InternalData.Camera.aspect = wWidth / wHeight;
          this.InternalData.Camera.updateProjectionMatrix();
        }
      }
    }.bind(this)
    
    resizeFunction();
    window.addEventListener("resize", resizeFunction);
  }
  
  this.setupScene = function () {
      
    var light = new THREE.PointLight( 0xffffcc, 10, 50, 2 );
    light.position.set( 4, 30, -20 );
    this.InternalData.Scene.add( light );

    var light2 = new THREE.AmbientLight( 0x20202A, 10 );
    light2.position.set( 30, -10, 30 );
    this.InternalData.Scene.add( light2 );

    this.InternalData.Scene.add( new THREE.HemisphereLight( 0xffffbb, 0x080820, 0.01 ) );
    this.InternalData.Scene.add( new THREE.DirectionalLight( 0xffffff, 0.1 ));
    

    // Setup Planet     
    
    var wPlanetGroup = new THREE.Group();
    wPlanetGroup.name = "Planet";
    this.InternalData.Scene.add( wPlanetGroup );
    
    var wPlanetTexture = new THREE.TextureLoader().load(this.Images.Textures.Water);
    wPlanetTexture.magFilter = THREE.NearestFilter;
    wPlanetTexture.minFilter = THREE.NearestMipmapLinearFilter;
    //wPlanetTexture.anisotropy = 16;
    wPlanetTexture.wrapS = THREE.RepeatWrapping;
    wPlanetTexture.wrapT = THREE.RepeatWrapping;
    wPlanetTexture.repeat.set( 360*60/5, 180*60/5 );

    var wPlanetGeometry = new THREE.SphereGeometry( this.InternalData.DrawRadius, 360, 180 );
    var wPlanetMaterial = new THREE.MeshLambertMaterial( {map: wPlanetTexture , transparent: true , opacity: 1.0 ,color: 0xffffff, depthTest: true } );
    var wPlanet = new THREE.Mesh( wPlanetGeometry, wPlanetMaterial );
    wPlanet.name = "PlanetWater";
    wPlanetGroup.add( wPlanet );


    // load a texture, set wrap mode to repeat
    //var wRingTexture = new THREE.TextureLoader().load( "./images/ribbon.png" );
    var wRingTexture = new THREE.TextureLoader().load( this.Images.Textures.Ring, function ( texture ) {

      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestMipmapLinearFilter;
      texture.anisotropy = 2;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;

      var wPixelPerMeter = 20;
      var wRibbonRadius = this.InternalData.DrawRadius + 150;
      var wRibbonLength = wRibbonRadius*2*Math.PI;

      var wImageWidth = texture.image.width / wPixelPerMeter;
      var wImageHeight = texture.image.height / wPixelPerMeter;
      var wVCount = 1;
      var wHCount = Math.ceil(wRibbonLength/(wImageWidth));
      var wScale = (wRibbonLength/wHCount)/wImageWidth;
      var wRibbonWidth = wScale*wVCount*wImageHeight;
      texture.repeat.set( -wHCount, wVCount );

      var points = [];
      for (var i = -1; i <= 1; i++) {
        points.push(new THREE.Vector2(wRibbonRadius, i * wRibbonWidth / 2));
      }
      
      var wRingGeometry = new THREE.LatheGeometry( points , 360);
      var wRingMaterial = new THREE.MeshBasicMaterial( { map: wRingTexture  , transparent: true , opacity: 1.0 ,color: 0xffffff, depthTest: true , side : THREE.DoubleSide} ); 

      
      var wShiftArray = [
        [0.0,0.0,0.0], 
        [0.0,0.0,5.0], 
        [0.0,30.0,10.0],
        [0.0,60.0,15.0], 
        [0.0,90.0,20.0],
        [0.0,120.0,25.0], 
        [0.0,150.0,30.0],
        [0.0,180.0,35.0], 
        [0.0,210.0,45.0], 
        [0.0,240.0,50.0], 
        [0.0,270.0,55.0], 
        [0.0,300.0,60.0], 
        [0.0,330.0,65.0], 
   //     [0.0,180.0,5.0],
     //   [0.0,240.0,-5.0], 
    //    [0.0,90.0,-45.0], 
    //    [0.0,0.0,90.0],   
    //    [0.0,90.0,90.0],  
      ]
      for (var wi = 0; wi < wShiftArray.length; ++wi) {
        var wRing = new THREE.Mesh(wRingGeometry, wRingMaterial);
        this.InternalData.y_rotateElements.push([wRing, Math.pow(-1, wi) * 0.005]);
          
        var wRingContainer = new THREE.Group();
        wRingContainer.add(wRing);
        wRingContainer.rotation.x = wShiftArray[wi][0]*gDegToRad;
        wRingContainer.rotation.y = wShiftArray[wi][1]*gDegToRad;
        wRingContainer.rotation.z = wShiftArray[wi][2]*gDegToRad;
        wScale = Math.pow(-1, wi)*0.001 + 1;
        wRingContainer.scale.z = wScale;
        wRingContainer.scale.x = wScale;
        wPlanetGroup.add(wRingContainer);
      }
    }.bind(this));
  }

  this.updateScene = function (iDt) {
      
    for (var wi = 0; wi < this.InternalData.MixerList.length; ++wi) {
      this.InternalData.MixerList[wi].update(iDt);
    }
    
    for (var wi = 0; wi < this.InternalData.MixerList.length; ++wi) {
      this.InternalData.MixerList[wi].update(iDt);
    }
    
    for (var wi = 0; wi < this.InternalData.x_rotateElements.length; ++wi) {
      this.InternalData.x_rotateElements[wi][0].rotation.x += iDt*this.InternalData.x_rotateElements[wi][1];        
    }
    
    for (var wi = 0; wi < this.InternalData.y_rotateElements.length; ++wi) {
      this.InternalData.y_rotateElements[wi][0].rotation.y += iDt*this.InternalData.y_rotateElements[wi][1];        
    }
    
    for (var wi = 0; wi < this.InternalData.z_rotateElements.length; ++wi) {
      this.InternalData.z_rotateElements[wi][0].rotation.z += iDt*this.InternalData.z_rotateElements[wi][1];        
    }

    this.InternalData.Renderer.render(this.InternalData.Scene, this.InternalData.Camera);
  }
  
  
  this.updateCameraOrigin = function (iDt, iGeoCoordinate, iEulerAngle) {

    var wNewPosition = mod_PlanetModel.addBodyVectorToGeoLocation(
      iGeoCoordinate[0]
    , iGeoCoordinate[1]
    , iGeoCoordinate[2]
    , iEulerAngle[0]
    , iEulerAngle[1]
    , iEulerAngle[2]
    , this.InternalData.CameraPositionOffset);

    var wPosition = mod_PlanetModel.convertGeoCoordinateToGeoCentric(wNewPosition.latitude,wNewPosition.longitude,wNewPosition.altitude);
    
    var wEuler = [ iEulerAngle[0] + this.InternalData.CameraAngleOffset[0]
                ,  iEulerAngle[1] + this.InternalData.CameraAngleOffset[1]
                ,  iEulerAngle[2] + this.InternalData.CameraAngleOffset[2]];

    var wEulerQuat = getEulerQuaternion(wNewPosition.latitude,wNewPosition.longitude, wEuler[0],wEuler[1],wEuler[2]);
    
    var wConversion = mod_PlanetModel.dimensionConversion(this.InternalData.DrawRadius);
    this.InternalData.Camera.position.set(wPosition.x*wConversion,wPosition.y*wConversion,wPosition.z*wConversion);
    this.InternalData.Camera.rotation.setFromQuaternion(wEulerQuat);
  }

}

export {
  PlanetRenderer
}

