import * as THREE from './three.module.js';
import * as CANNON from './cannon-es.js';
import { Line2 } from "./lines/Line2.js";
import { LineMaterial } from "./lines/LineMaterial.js";
import { LineSegmentsGeometry } from "./lines/LineSegmentsGeometry.js";

import { EffectComposer } from './postprocessing/EffectComposer.js';
import { RenderPass } from './postprocessing/RenderPass.js';
import { UnrealBloomPass } from './postprocessing/UnrealBloomPass.js';
import { OutputPass } from './postprocessing/OutputPass.js';

import { bezierCnt, pointPos, ranNeon, ranTextAlign } from './bezierText.js';
import CannonDebugger from './cannon-es-debugger.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 10, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 7;

let extraCnt, radius, composer; 

function genRadius() {
    if ( bezierCnt + extraCnt > 5 ) {
        radius = window.innerWidth <= 600 ? 0.3 : 0.5;
    } else {
        radius = window.innerWidth <= 600 ? 0.1 : 0.2;
    }
}

const light = new THREE.HemisphereLight( 0xffffff, 0x000000, 1 );
scene.add( light );

const renderer = new THREE.WebGLRenderer( { 
    antialias: true,
    alpha: true, 
    preserveDrawingBuffer: true } ); 
renderer.setClearColor( 0x000000, 0 );
renderer.setPixelRatio( Math.min(window.devicePixelRatio, 2) );
renderer.setSize( window.innerWidth, window.innerHeight );
const threeCanvas = document.getElementById('threeCanvas');

threeCanvas.appendChild( renderer.domElement );

init();

function init() {
    const size = renderer.getDrawingBufferSize( new THREE.Vector2() );
    const renderTarget = new THREE.WebGLRenderTarget( size.width, size.height, { samples: 8, type: THREE.HalfFloatType } );

    const renderScene = new RenderPass( scene, camera );

    const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
    bloomPass.threshold = 0.1;
    bloomPass.strength = 0.14;
    bloomPass.radius = 1.5;

    const outputPass = new OutputPass();

    composer = window.innerWidth <= 600 ? new EffectComposer( renderer ) : new EffectComposer( renderer, renderTarget );
    composer.addPass( renderScene );
    // composer.addPass( bloomPass );
    composer.addPass( outputPass );
    composer.setSize( window.innerWidth, window.innerHeight );
    window.addEventListener( 'resize', onWindowResize );
}

let panelAnimation = true;

function onWindowResize() {

    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    createBoundary(1, 1, 5);

    renderer.setSize( width, height );
    composer.setSize( width, height );

    if (panelAnimation === true) {
        panelAll.style.top = window.innerWidth <= 600 ? '-210px' : '-520px';
    } else {
        panelAll.style.top = window.innerWidth <= 600 ? '-2px' : '-22px';
    }
    
}

// cannon-es.js 물리 세계 생성
const world = new CANNON.World();
world.gravity.set(0, 0, 0);
world.broadphase = new CANNON.SAPBroadphase(world);
world.solver = new CANNON.GSSolver();

world.solver.iterations = 10;
world.solver.tolerance = 0.01;

let cannonDebugger = new CannonDebugger( scene, world );

//중력 이벤트----------------------------------------------------------
let gravityResetTimer;

window.addEventListener('wheel', function(event) {
    clearTimeout(gravityResetTimer);
    if (event.deltaY < 0) {
        world.gravity.set(0, -0.8, 0);
    } else {
        world.gravity.set(0, 0.8, 0);
    }
    gravityResetTimer = setTimeout(() => {
        world.gravity.set(0, 0, 0);
    }, 1000);
});

const exScroll = document.getElementById('exScroll');
let isDragging = false;

exScroll.addEventListener('mousedown', startScroll);
exScroll.addEventListener('touchstart', startScroll);

function startScroll(e) {
    isDragging = true;
    const startY = e.pageY || e.touches[0].pageY;
    const startTop = parseFloat(exScroll.style.top) || 0;
    const maxTop = container.clientHeight - exScroll.offsetHeight;

    function onScroll(e) {
        if (!isDragging) return;
        let currentY = e.pageY || e.touches[0].pageY;
        let deltaY = currentY - startY;

        if (deltaY < 0) {
            world.gravity.set(0, -1.6, 0);
        } else if (deltaY > 0) {
            world.gravity.set(0, 1.6, 0);
        }

        let newTop = Math.min(maxTop, Math.max(0, startTop + deltaY));
        exScroll.style.top = `${newTop}px`;

        const scrollPer = newTop / maxTop;
        container.scrollTop = scrollPer * (container.scrollHeight - container.clientHeight);
    }

    function stopScroll() {
        isDragging = false;
        document.removeEventListener('mousemove', onScroll);
        document.removeEventListener('mouseup', stopScroll);
        document.removeEventListener('touchmove', onScroll);
        document.removeEventListener('touchend', stopScroll);

        world.gravity.set(0, 0, 0);
    }

    document.addEventListener('mousemove', onScroll);
    document.addEventListener('mouseup', stopScroll);
    document.addEventListener('touchmove', onScroll);
    document.addEventListener('touchend', stopScroll);

    e.preventDefault();
}

//MESH----------------------------------------------------------
const textureLoader = new THREE.CubeTextureLoader();
const envSky = textureLoader.load([
    './sources/cubeMap/sky/px.jpg',
    './sources/cubeMap/sky/nx.jpg',
    './sources/cubeMap/sky/py.jpg',
    './sources/cubeMap/sky/ny.jpg',
    './sources/cubeMap/sky/pz.jpg',
    './sources/cubeMap/sky/nz.jpg'
])

const fake_Color = new THREE.TextureLoader().load( "" );
const fake_Normal = new THREE.TextureLoader().load( "" );
const fake_Roughness = new THREE.TextureLoader().load( "" );

const materials = [
    // '2dColor',
    // '2dColor',
    'basicColor',
    'basicColor',
    'basicColor',
    'basicColor',
    'wireFrame',
    // (() => { const m = new THREE.MeshNormalMaterial(); m.flatShading = false; return m; })(), // Normal.flatShading
    'metal',
];

function getShapeForGeometry(geometry, scale) {
    if (geometry instanceof THREE.BoxGeometry) {
        const sizeX = geometry.parameters.width / 2 * scale;
        const sizeY = geometry.parameters.height / 2 * scale;
        const sizeZ = geometry.parameters.depth / 2 * scale;
        return new CANNON.Box(new CANNON.Vec3(sizeX, sizeY, sizeZ));
    } else if (geometry instanceof THREE.SphereGeometry) {
        const radius = geometry.parameters.radius * scale;
        return new CANNON.Sphere(radius);
    } else if (geometry instanceof THREE.CylinderGeometry) {
        const radiusTop = geometry.parameters.radiusTop * scale;
        const radiusBottom = geometry.parameters.radiusBottom * scale;
        const height = geometry.parameters.height * scale;
        
        const shape = new CANNON.Cylinder(radiusTop, radiusBottom, height, geometry.parameters.radialSegments);

        return shape;
    }
}

function setRanRotation(mesh, body) {
    mesh.rotation.x = Math.random() * Math.PI * 2;
    mesh.rotation.y = Math.random() * Math.PI * 2;
    mesh.rotation.z = Math.random() * Math.PI * 2;

    const quaternion = new THREE.Quaternion();
    quaternion.setFromEuler(new THREE.Euler(mesh.rotation.x, mesh.rotation.y, mesh.rotation.z));

    body.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
}

const meshes = [];
const zPos = -2.4
let mesh;
let scaleTo = -0.15;

function getRandomPosition(radius) {
    let position, distanceSquared;
    do {
        position = new THREE.Vector3(
            (Math.random() - 0.5) * 2 * radius,
            (Math.random() - 0.5) * 2 * radius,
            (Math.random() - 0.5) * 2 * radius
        );
        distanceSquared = position.x ** 2 + position.y ** 2 + position.z ** 2;
    } while (distanceSquared > radius ** 2);
    return position;
}

let segments;

function addMesh() {
    genRadius();
    const position = getRandomPosition(radius);
    const materialIndex = Math.floor(Math.random() * materials.length);
    
    let scaleFactor = window.innerWidth <= 600 ? 0.2 : 0.4;
    let ranSizeX = Math.random() * 0.7 + 0.5; // 0.5 ~ 1.2
    let ranSizeY = Math.random() * 0.7 + 0.5; // 0.5 ~ 1.2
    let ranSizeZ = Math.random() * 0.7 + 0.5; // 0.5 ~ 1.2 
    let ranSizeH = Math.random() * 0.09 + 0.01; // 0.01 ~ 0.10 
    let ranSizeW = Math.random() * 0.4 + 0.2; // 0.2 ~ 0.6
    let ranSizeH2 = window.innerWidth <= 600 ? Math.random() * 0.3 + 0.3 : Math.random() * 0.7 + 0.5; 

    if (materials[materialIndex] === 'wireFrame') {
        segments = 10;
    } else {
        if ( window.innerWidth > 600 ) {
            segments = 60;
        } else {
            segments = 30;
        }
    }
    
    const geometries = [
        new THREE.BoxGeometry(ranSizeX * scaleFactor, ranSizeY * scaleFactor, ranSizeZ * scaleFactor), // 0 큐브
        new THREE.SphereGeometry(0.75 * scaleFactor, segments, segments), // 1 구
        new THREE.CylinderGeometry(ranSizeX * scaleFactor, ranSizeX * scaleFactor, ranSizeH, segments), // 2 원판
        new THREE.CylinderGeometry(ranSizeW * scaleFactor, ranSizeW * scaleFactor, ranSizeH2, segments), // 3 원기둥
    ];

    const geometryIndex = Math.floor(Math.random() * geometries.length);

    let geometry = geometries[geometryIndex];
    let material;
    let ranScale;

    if (materials[materialIndex] === 'wireFrame') {
        const edges = new THREE.EdgesGeometry(geometry);
        const lineGeometry = new LineSegmentsGeometry().fromEdgesGeometry(edges);
        const lineMaterial = new LineMaterial({
            color: ranNeon(),
            linewidth: window.innerWidth <= 600 ? 2 : 2.5, 
        });

        const line = new Line2(lineGeometry, lineMaterial);
        line.computeLineDistances();
        mesh = line;

        lineMaterial.resolution.set(window.innerWidth, window.innerHeight);
    } else {
    
        if (materials[materialIndex] === '2dColor') {
            material = new THREE.MeshBasicMaterial({ color: ranNeon() });
        } else if (materials[materialIndex] === 'basicColor') {
            material = new THREE.MeshStandardMaterial({ 
                color: ranNeon(), emissive: ranNeon() });
        } else if (materials[materialIndex] === 'metal') {
            material = new THREE.MeshStandardMaterial({ 
                color: ranNeon(),
                emissive: ranNeon(),
                emissiveIntensity: 1,
                envMap: envSky,
                map: fake_Color, 
                normalMap: fake_Normal,
                roughnessMap: fake_Roughness,
            });
        } else {
            material = materials[materialIndex];
        }
    
    mesh = new THREE.Mesh(geometry, material);

    }

    mesh.position.set(position.x, position.y, position.z + zPos);
    ranScale = Math.random() * 0.75 + 0.5; // 0.5 ~ 1.25
    mesh.scale.set(ranScale, ranScale, ranScale);
    mesh.userData.initialScale = ranScale;

    const shape = getShapeForGeometry(geometry, ranScale);
    
    const body = new CANNON.Body({
        mass: 1, 
        material: new CANNON.Material({friction: 0.1, restitution: 0.9})
    });
    body.addShape(shape);
    body.position.set(mesh.position.x, mesh.position.y, mesh.position.z);
    
    setRanRotation(mesh, body);
    
    world.addBody(body);
    mesh.body = body;
    scene.add(mesh);
    meshes.push(mesh);
}

const plusCnt = document.getElementById('plusCnt');
const minusCnt = document.getElementById('minusCnt');
const num = document.getElementById('num');
extraCnt = Number(num.innerHTML);

function removeMesh() {
    if (meshes.length > 0) {
        const meshToRemove = meshes.pop();
        scene.remove(meshToRemove);
        if (meshToRemove.body) {
            world.removeBody(meshToRemove.body);
        }
    }
}

plusCnt.addEventListener('click', function() {
    extraCnt += 1;
    num.innerHTML = bezierCnt + extraCnt;
    addMesh();
});

minusCnt.addEventListener('click', function() {
    if (bezierCnt + extraCnt > 0) {
        extraCnt -= 1;
        num.innerHTML = bezierCnt + extraCnt;
        removeMesh();
    }
});

function updateScene() {
    // 현재 Scene 내의 모든 Mesh 삭제
    meshes.forEach(mesh => {
        scene.remove(mesh);
        if (mesh.body) {
            world.removeBody(mesh.body);
        }
    });
    meshes.length = 0; // Mesh 배열 비우기

    if (bezierCnt === 0) {
        scene.remove(mesh);
        if (mesh.body) {
            world.removeBody(mesh.body);
        }
    }

    for (let i = 0; i < bezierCnt + extraCnt; i++) {
        addMesh();
    }
    num.innerHTML = bezierCnt + extraCnt;
    // console.log(bezierCnt, extraCnt, meshes.length)
}

const Ding01 = new Audio('./sources/sound/Ding01.mp3');
const Ding02 = new Audio('./sources/sound/Ding02.mp3');
const Ding03 = new Audio('./sources/sound/Ding03.mp3');
const Ding04 = new Audio('./sources/sound/Ding04.mp3');

let audios = [Ding01, Ding02, Ding03, Ding04];
let audio;
let currentAudio;

function soundPlay() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }
    audio = audios[Math.floor(Math.random() * audios.length)];
    audio.volume = 0.2;
    audio.play();
    currentAudio = audio;
}

const growDuration = 0.24;
const shrinkDuration = 0.74;

function cubicBezier(t, p0, p1, p2, p3) {
    const C = (3 * p1) - (3 * p0) + p3 - p0;
    const B = (3 * p0) - (6 * p1) + (3 * p2);
    const A = (3 * p1) - (3 * p2);
    const D = p0;
    return ((A * t + B) * t + C) * t + D;
}

const random = document.getElementById('random');
let ranChecked = true;

random.addEventListener('click', function() {
    if (ranChecked === true) {
        random.style.opacity = 0.3;
        ranChecked = false;
    } else {
        random.style.opacity = 1.0;
        ranChecked = true;
    }
});

function animateMeshes() {
    const currentTime = (new Date()).getTime() / 500;

    if (ranChecked === true && (Math.abs(pointPos - 0.99) < 0.01)) {
        soundPlay();
        updateScene();
        ranTextAlign();
    }


    meshes.forEach(mesh => {
        if (!mesh.animation) {
            mesh.animation = {
                isAnimating: false,
                animationPhase: 0, // (0: no animation, 1: growing, 2: shrinking)
                animationStartTime: 0,
            };
        }
        const animation = mesh.animation;
        
        if (window.innerWidth > 600 && (Math.abs(pointPos - 0.99) < 0.01) && animation.animationPhase === 0) {
            animation.isAnimating = true;
            animation.animationPhase = 1;
            animation.animationStartTime = currentTime;
        }

        if (animation.isAnimating) {
            const elapsedTime = currentTime - animation.animationStartTime;
            let scale;
            const initialScale = mesh.userData.initialScale;

            if (animation.animationPhase === 1) {
                if (elapsedTime <= growDuration) {
                    const t = elapsedTime / growDuration;
                    scale = initialScale + cubicBezier(t, 0.1, 0.8, 0.6, 1) * scaleTo;
                } else {
                    animation.animationPhase = 2;
                    animation.animationStartTime = currentTime;
                }
            }
            else if (animation.animationPhase === 2) {
                if (elapsedTime <= shrinkDuration) {
                    const t = elapsedTime / shrinkDuration;
                    scale = (initialScale + scaleTo) - cubicBezier(t, 0.1, 0.8, 0.6, 1) * scaleTo;
                } else {
                    animation.isAnimating = false;
                    animation.animationPhase = 0;
                }
            }
            if (scale !== undefined) {
                mesh.scale.set(scale, scale, scale);
            }
        }
        // mesh.rotation.x += 0.01;
        // mesh.rotation.y += 0.01;
        mesh.rotation.z += 0.01;

        const quaternion = new THREE.Quaternion();
        quaternion.setFromEuler(new THREE.Euler(mesh.rotation.x, mesh.rotation.y, mesh.rotation.z));
        mesh.body.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
    });
}

function applyRadialForces() {
    world.bodies.forEach(body => {
        const radialVector = new CANNON.Vec3(body.position.x, body.position.y, body.position.z);
        radialVector.x -= 0;
        radialVector.y -= 0;
        radialVector.z -= 0; // 중심점(0, 0, 0)에서 벡터를 뺌
        
        radialVector.normalize(); // 방향 유지
        const forceMagnitude = -0.1 * body.mass; // 힘 크기 설정
        radialVector.x *= forceMagnitude;
        radialVector.y *= forceMagnitude;
        radialVector.z *= forceMagnitude;
        body.applyForce(radialVector, body.position);
    });
}

let boundaryWalls = [];

function createOrUpdateWall(index, wallPosition, wallSize) {
    let shape = new CANNON.Box(new CANNON.Vec3(wallSize.x / 2, wallSize.y / 2, wallSize.z / 2));
    let wallBody;

    if (index < boundaryWalls.length) {
        // 기존 벽 업데이트
        wallBody = boundaryWalls[index];
        wallBody.position.copy(wallPosition);
        wallBody.shapes[0] = shape;
    } else {
        // 새 벽 생성
        wallBody = new CANNON.Body({ mass: 0 });
        wallBody.addShape(shape);
        wallBody.position.copy(wallPosition);
        world.addBody(wallBody);
        boundaryWalls.push(wallBody);
    }
}

function createBoundary(width, height, depth) {

    const viewSize = getViewSize(camera.position.z);
    const wallThickness = 0.01;
    const halfWidth = width * viewSize.width / 2;
    const halfHeight = height * viewSize.height / 2;
    const halfDepth = depth / 2;

    // 벽 생성 또는 업데이트
    createOrUpdateWall(0, new CANNON.Vec3(0, halfHeight, 0 + zPos), new CANNON.Vec3(width * viewSize.width, wallThickness, depth));
    createOrUpdateWall(1, new CANNON.Vec3(0, -halfHeight, 0 + zPos), new CANNON.Vec3(width * viewSize.width, wallThickness, depth));
    createOrUpdateWall(2, new CANNON.Vec3(-halfWidth, 0, 0 + zPos), new CANNON.Vec3(wallThickness, height * viewSize.height, depth));
    createOrUpdateWall(3, new CANNON.Vec3(halfWidth, 0, 0 + zPos), new CANNON.Vec3(wallThickness, height * viewSize.height, depth));
    createOrUpdateWall(4, new CANNON.Vec3(0, 0, halfDepth + zPos), new CANNON.Vec3(width * viewSize.width, height * viewSize.height, wallThickness));
    createOrUpdateWall(5, new CANNON.Vec3(0, 0, -halfDepth + zPos), new CANNON.Vec3(width * viewSize.width, height * viewSize.height, wallThickness));
}

// 카메라의 z 위치에서 볼 수 있는 뷰의 크기 계산
function getViewSize(depth) {
    const fovInRadians = (camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fovInRadians / 2) * Math.abs(depth);
    const width = height * camera.aspect;
    return { width, height };
}
createBoundary(1, 1, 5);

let lastBezierCnt = -1;
const camZpos = document.getElementById('camZpos');

camZpos.addEventListener('input', function() {
    camera.position.z = camZpos.value;
    createBoundary(1, 1, 5);
});

function animate() {
    requestAnimationFrame(animate);
   
    applyRadialForces();
    if (bezierCnt !== lastBezierCnt) {
        updateScene();
        lastBezierCnt = bezierCnt;
    }

    // 물리 업데이트
    world.step(1 / 60);

    // Mesh를 물리 바디 상태로 업데이트
    meshes.forEach(mesh => {
        mesh.position.copy(mesh.body.position);
        mesh.quaternion.copy(mesh.body.quaternion);
    });
    animateMeshes();

    // cannonDebugger.update(); 
    composer.render();
}
animate();

//UI BUTTON------------------------------------------------------------
const dayNight = document.getElementById('dayNight');

const boundBox = document.getElementById('boundBox');
const bg = document.getElementById('bg');
const textInput = document.getElementById('textInput');
const controlPanel = document.getElementById('controlPanel');
const threeOpacity = document.getElementById('threeOpacity');
const textOpacity = document.getElementById('textOpacity');
const bezierCanvas = document.getElementById('bezierCanvas')
const panelAll = document.getElementById('panelAll');

const cube = document.getElementById('cube');
const saveImg = document.getElementById('saveImg');
const settings = document.getElementById('settings');
const rangeInput = document.querySelectorAll ('.rangeInput');
const setCircle = document.getElementById('setCircle');

let isNight = true;

dayNight.addEventListener('click', function() {
    if ( isNight === true ) {
        bg.classList.add('night-mode');
        bg.classList.remove('day-mode');
        boundBox.classList.remove('blackText');
        boundBox.classList.add('whiteText');
        exScroll.style.mixBlendMode = 'screen';
        textInput.style.backgroundColor = 'white';
        textInput.style.color = '#111111';

        controlPanel.style.color = 'white';
        controlPanel.style.border = '2px #ffffff solid';
        controlPanel.style.fontWeight = '450';
        controlPanel.style.backgroundColor ='rgba(0, 0, 0, 0.66)';
        setCircle.style.border = controlPanel.style.border;
        setCircle.style.backgroundColor = controlPanel.style.backgroundColor;
        
        dayNight.src = 'sources/ICON_dayMode.svg';
        random.src = 'sources/ICON_ranNight.svg';
        minusCnt.src = 'sources/ICON_minusNight.svg';
        cube.src = 'sources/ICON_cntNight.svg';
        plusCnt.src = 'sources/ICON_plusNight.svg';
        saveImg.src = 'sources/ICON_imgNight.svg';
        settings.src = 'sources/ICON_settingNight.svg';
        rangeInput.forEach(el => el.style.accentColor = 'white');
        num.style.color = 'white';
        num.style.fontWeight = '700';

        isNight = false;
    } else {
        bg.classList.add('day-mode');
        bg.classList.remove('night-mode');
        boundBox.classList.remove('whiteText');
        boundBox.classList.add('blackText');
        exScroll.style.mixBlendMode = 'multiply';
        textInput.style.backgroundColor = '#111111';
        textInput.style.color = 'white';

        controlPanel.style.color = 'black';
        controlPanel.style.border = '2px #111111 solid';
        controlPanel.style.fontWeight = '700';
        controlPanel.style.backgroundColor ='rgba(255, 255, 255, 0.66)';
        setCircle.style.border = controlPanel.style.border;
        setCircle.style.backgroundColor = controlPanel.style.backgroundColor;

        dayNight.src = 'sources/ICON_nightMode.svg';
        random.src = 'sources/ICON_ranDay.svg';
        minusCnt.src = 'sources/ICON_minusDay.svg';
        cube.src = 'sources/ICON_cntDay.svg';
        plusCnt.src = 'sources/ICON_plusDay.svg';
        saveImg.src = 'sources/ICON_imgDay.svg';
        settings.src = 'sources/ICON_settingDay.svg';
        rangeInput.forEach(el => el.style.accentColor = '#111111');
        num.style.color = '#111111';
        num.style.fontWeight = '800';

        isNight = true;
    }
});

let isSettingsOff = true;
settings.addEventListener('click', function() {
    if ( isSettingsOff === true ) {
        controlPanel.style.display = 'flex';
        setCircle.style.display = 'block';
        isSettingsOff = false;
    } else {
        controlPanel.style.display = 'none';
        setCircle.style.display ='none';
        isSettingsOff = true;
    }
});

threeOpacity.addEventListener('input', function() {
    let opacityValue = threeOpacity.value / 10;
    threeCanvas.style.opacity = opacityValue;

    const threeOpacityText = document.getElementById('threeOpacityText')
    threeOpacityText.innerHTML = (opacityValue * 100) + '%';
    
    if (opacityValue == 0) {
        threeCanvas.style.display = 'none';
    } else {
        threeCanvas.style.display = 'block';
    }
});

textOpacity.addEventListener('input', function() {
    let opacityValue = textOpacity.value / 10;
    bezierCanvas.style.opacity = opacityValue;
    boundBox.style.opacity = opacityValue;
    textInput.style.opacity = opacityValue;

    const textOpacityText = document.getElementById('textOpacityText')
    textOpacityText.innerHTML = (opacityValue * 100) + '%';
    
    if (opacityValue == 0) {
        bezierCanvas.style.display = 'none';
    } else {
        bezierCanvas.style.display = 'block';
    }
});

