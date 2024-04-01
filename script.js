import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Line2 } from "./lines/Line2.js";
import { LineMaterial } from "./lines/LineMaterial.js";
import { LineSegmentsGeometry } from "./lines/LineSegmentsGeometry.js";
import { bezierCnt, pointPos, ranNeon, ranTextAlign } from './bezierText.js';
import CannonDebugger from 'cannon-es-debugger';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 10, window.innerWidth / window.innerHeight, 0.1, 1000 );
const light = new THREE.HemisphereLight( 0xffffff, 0x000000, 1 );
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true, 
    preserveDrawingBuffer: true,
    powerPreference: "high-performance"  
}); 
const threeCanvas = document.getElementById('threeCanvas');
const world = new CANNON.World();
const cannonDebugger = new CannonDebugger( scene, world );

let extraCnt, radius, gravityResetTimer, 
    mesh, segments, audio, currentAudio, geometry, 
    material, ranScale, gravityPar; 

const exScroll = document.getElementById('exScroll');
const plusCnt = document.getElementById('plusCnt');
const minusCnt = document.getElementById('minusCnt');
const num = document.getElementById('num');
const chooseFile = document.getElementById('chooseFile');
const fileList = document.getElementById('fileList');
const textInput = document.getElementById('textInput');
const gravityForce = document.getElementById('gravityForce');
const camZpos = document.getElementById('camZpos');

let isDragging = false;

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
    'basicColor',
    'basicColor',
    'basicColor',
    'basicColor',
    'wireFrame',
    'metal',
];

const meshes = [];
const zPos = -2.4
let scaleTo = -0.15;

const imgMeshes = [];
let deleteImgList = [];
let deleteImg = [];

const Ding01 = new Audio('./sources/sound/Ding01.mp3');
const Ding02 = new Audio('./sources/sound/Ding02.mp3');
const Ding03 = new Audio('./sources/sound/Ding03.mp3');
const Ding04 = new Audio('./sources/sound/Ding04.mp3');
const audios = [Ding01, Ding02, Ding03, Ding04];
const growDuration = 0.24;
const shrinkDuration = 0.74;

let boundaryWalls = [];
let lastBezierCnt = -1;

init();
animate();

function init() {
    //렌더 세팅
    renderer.setClearColor( 0x000000, 0 );
    renderer.setPixelRatio( Math.min(window.devicePixelRatio, 2) );
    renderer.setSize( window.innerWidth, window.innerHeight );
    
    camera.position.z = 7;
    scene.add( light );

    //물리 세팅
    world.gravity.set(0, 0, 0);
    world.broadphase = new CANNON.SAPBroadphase(world);
    world.solver = new CANNON.GSSolver();
    world.solver.iterations = 10;
    world.solver.tolerance = 0.01;

    //개수 계산
    extraCnt = Number(num.innerHTML);
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

    //파일 로딩
    chooseFile.addEventListener('input', loadFile);

    //UI
    dayNight.addEventListener('click', function() {
        changeTheme();
        changeImgListUI();
    });

    //캔버스 세팅
    threeCanvas.appendChild( renderer.domElement );
    window.addEventListener( 'resize', onWindowResize );
    window.addEventListener( 'wheel', onWindowScroll );
    
    exScroll.addEventListener('mousedown', startScroll);
    exScroll.addEventListener('touchstart', startScroll);

    createBoundary(1, 1, 5);
    camZpos.addEventListener('input', function() {
        camera.position.z = camZpos.value;
        createBoundary(1, 1, 5);
    });
    gravityPar = 0.1;
    gravityForce.addEventListener('input', function() {
        gravityPar = gravityForce.value / 10;
        document.getElementById('grabityText').innerHTML = gravityForce.value * 5 + '%';
    });
}

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
    imgMeshes.forEach(function(imgMesh) {
        imgMesh.mesh.position.copy(imgMesh.mesh.body.position);
    });
    animateMeshes();

    // cannonDebugger.update(); 
    renderer.render( scene, camera );
}

function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    createBoundary(1, 1, 5);

    renderer.setSize( width, height );
}

function onWindowScroll() {
    clearTimeout(gravityResetTimer);
    if (event.deltaY < 0) {
        world.gravity.set(0, -0.8, 0);
    } else {
        world.gravity.set(0, 0.8, 0);
    }
    gravityResetTimer = setTimeout(() => {
        world.gravity.set(0, 0, 0);
    }, 1000);
}

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

function genRadius() {
    radius = (bezierCnt + extraCnt) / 40;
    radius.toFixed(3);
}

function addMesh() {
    genRadius();
    const position = getRandomPosition(radius);
    const materialIndex = Math.floor(Math.random() * materials.length);
    
    let scaleFactor = window.innerWidth <= 900 ? 0.2 : 0.4;
    let ranSizeX = Math.random() * 0.7 + 0.5; // 0.5 ~ 1.2
    let ranSizeY = Math.random() * 0.7 + 0.5; // 0.5 ~ 1.2
    let ranSizeZ = Math.random() * 0.7 + 0.5; // 0.5 ~ 1.2 
    let ranSizeH = Math.random() * 0.09 + 0.01; // 0.01 ~ 0.10 
    let ranSizeW = Math.random() * 0.4 + 0.2; // 0.2 ~ 0.6
    let ranSizeH2 = window.innerWidth <= 900 ? Math.random() * 0.3 + 0.3 : Math.random() * 0.7 + 0.5; 

    if (materials[materialIndex] === 'wireFrame') {
        segments = 10;
    } else {
        if ( window.innerWidth > 900 ) {
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

    geometry = geometries[geometryIndex];

    if (materials[materialIndex] === 'wireFrame') {
        const edges = new THREE.EdgesGeometry(geometry);
        const lineGeometry = new LineSegmentsGeometry().fromEdgesGeometry(edges);
        const lineMaterial = new LineMaterial({
            color: ranNeon(),
            linewidth: window.innerWidth <= 900 ? 2 : 2.5, 
        });

        const line = new Line2(lineGeometry, lineMaterial);
        line.computeLineDistances();
        mesh = line;

        lineMaterial.resolution.set(window.innerWidth, window.innerHeight);
    } else {
        if (materials[materialIndex] === '2dColor') {
            material = new THREE.MeshBasicMaterial({ 
                color: ranNeon() 
            });
        } else if (materials[materialIndex] === 'basicColor') {
            material = new THREE.MeshStandardMaterial({ 
                color: ranNeon(), 
                emissive: ranNeon() 
            });
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
        material: new CANNON.Material({
            friction: 0.1, 
            restitution: 0.9
        })
    });
    body.addShape(shape);
    body.position.set(mesh.position.x, mesh.position.y, mesh.position.z);
    
    setRanRotation(mesh, body);
    
    world.addBody(body);
    mesh.body = body;
    scene.add(mesh);
    meshes.push(mesh);
}

function removeMesh() {
    if (meshes.length > 0) {
        const meshToRemove = meshes.pop();
        scene.remove(meshToRemove);
        if (meshToRemove.body) {
            world.removeBody(meshToRemove.body);
        }
    }
}

function changeImgListUI() {
    deleteImgList = document.querySelectorAll('.deleteImgList');
    deleteImg = document.querySelectorAll('.deleteImg');

    if ( bg.classList.contains("day-mode") ) {
        deleteImgList.forEach(el => {
            el.style.backgroundColor = '#ffffff';
            el.style.color = 'black';
        });
        deleteImg.forEach(el => {
            el.style.background = 'url(./sources/icon/ICON_plusDay.svg)';
        });
    } else {
        deleteImgList.forEach(el => {
            el.style.backgroundColor = '#111111';
            el.style.color = 'white';
        });
        deleteImg.forEach(el => {
            el.style.background = 'url(./sources/icon/ICON_plusNight.svg)';
        });
    }
}

function loadFile(event) {
    const input = event.target;
    const file = event.target.files[0];

    if (input.files && input.files[0]) {
        let fileOnlyName = file.name.replace(/\.[^/.]+$/, "");
        let fileExtension = file.name.split('.').pop();
        let displayedName = fileOnlyName.length > 10
            ? `${fileOnlyName.substring(0, 10)}...${fileExtension}`
            : file.name;
        
        const deleteImgListDiv = document.createElement('div');
        deleteImgListDiv.className = 'deleteImgList';
        let timestamp = Date.now();
        let uniqueId = `${timestamp}`;
        deleteImgListDiv.id = uniqueId;

        const fileNameDiv = document.createElement('div');
        fileNameDiv.textContent = displayedName;
        
        const deleteImgDiv = document.createElement('div');
        deleteImgDiv.className = 'deleteImg';

        deleteImgListDiv.appendChild(fileNameDiv);
        deleteImgListDiv.appendChild(deleteImgDiv);
        fileList.appendChild(deleteImgListDiv);

        changeImgListUI();

        deleteImgListDiv.addEventListener('click', function() {
            removeImgMesh(uniqueId);
        });

        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const texture = new THREE.Texture(img);

                const aspectRatio = img.width / img.height;
                const scale = window.innerWidth <= 900 ? 0.35 : 0.4;
                const width = aspectRatio * scale;
                const height = 1 * scale;
                const geometry = new THREE.PlaneGeometry(width, height);
                const material = new THREE.MeshBasicMaterial({ 
                    color: new THREE.Color('#ffffff'),
                    map: texture,
                    reflectivity: 0,
                    lightMapIntensity : 0  
                });
                    
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.needsUpdate = true;
    
                const mesh = new THREE.Mesh(geometry, material);

                // 물리 바디 추가
                const radius = (Math.sqrt(width**2 + height**2))/2;
                const shape = new CANNON.Sphere(radius);

                const body = new CANNON.Body({ mass: 1 });
                body.addShape(shape);

                mesh.position.set(0, 0, -1.4);
                body.position.set(mesh.position.x, mesh.position.y, mesh.position.z);

                // 메시가 항상 카메라를 바라보도록 설정
                mesh.lookAt(camera.position);

                world.addBody(body);
                mesh.body = body;
                scene.add(mesh);
                imgMeshes.push({ id: uniqueId, mesh: mesh});
            }
            img.src = e.target.result; 
        }
        reader.readAsDataURL(file);
    }
    chooseFile.value = '';
}

function removeImgMesh(id) {
    const meshInfoIndex = imgMeshes.findIndex(meshInfo => meshInfo.id === id);
    if (meshInfoIndex !== -1) {
        const meshInfo = imgMeshes[meshInfoIndex];
        scene.remove(meshInfo.mesh);
        if (meshInfo.mesh.body) {
            world.removeBody(meshInfo.mesh.body); 
        }
        imgMeshes.splice(meshInfoIndex, 1); 
        const fileNameDiv = document.getElementById(id);
        if (fileNameDiv) {
            fileList.removeChild(fileNameDiv);
        }
    }
}

function updateScene() {
    // 현재 Scene 내의 모든 Mesh 삭제
    meshes.forEach(mesh => {
        scene.remove(mesh);
        if (mesh.body) {
            world.removeBody(mesh.body);
        }
    });
    meshes.length = 0; // Mesh 배열 비우기

    textInput.addEventListener('keyup', function() {
        if (bezierCnt === 0) {
            scene.remove(mesh);
            if (mesh.body) {
                world.removeBody(mesh.body);
            }
        }
    });

    for (let i = 0; i < bezierCnt + extraCnt; i++) {
        addMesh();
    }
    num.innerHTML = bezierCnt + extraCnt;
}

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

function cubicBezier(t, p0, p1, p2, p3) {
    const C = (3 * p1) - (3 * p0) + p3 - p0;
    const B = (3 * p0) - (6 * p1) + (3 * p2);
    const A = (3 * p1) - (3 * p2);
    const D = p0;
    return ((A * t + B) * t + C) * t + D;
}

function animateMeshes() {
    const currentTime = (new Date()).getTime() / 500;

    if (isranChecked === true && (Math.abs(pointPos - 0.99) < 0.01)) {
        soundPlay();
        updateScene();
        ranTextAlign();
        random.classList.add('rotate');
        setTimeout(() => {
            random.classList.remove('rotate');
        }, 1000);
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
        
        if (window.innerWidth > 900 && (Math.abs(pointPos - 0.99) < 0.01) && animation.animationPhase === 0) {
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
        radialVector.z -= 0;
        
        radialVector.normalize(); // 방향 유지
        const forceMagnitude = -1 * gravityPar * body.mass; // 힘 크기 설정
        radialVector.x *= forceMagnitude;
        radialVector.y *= forceMagnitude;
        radialVector.z *= forceMagnitude;
        body.applyForce(radialVector, body.position);
    });
}

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

function getViewSize(depth) {
    const fovInRadians = (camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fovInRadians / 2) * Math.abs(depth);
    const width = height * camera.aspect;
    return { width, height };
}