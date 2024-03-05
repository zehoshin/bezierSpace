import * as THREE from './three.module.js'
import * as CANNON from './cannon-es.js'

import { bezierCnt, pointPos, ranColor } from './bezierText.js'

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x000000 );

const camera = new THREE.PerspectiveCamera( 10, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 6;

const radius = 0.1;

const light = new THREE.HemisphereLight( 0xffffff, 0x080820, 5 );
scene.add( light );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
const threeCanvas = document.getElementById('threeCanvas');

threeCanvas.appendChild( renderer.domElement );

const textureLoader = new THREE.CubeTextureLoader();
const environmentMapTexture = textureLoader.load([
    './sources/cubeMap/px.png',
    './sources/cubeMap/nx.png',
    './sources/cubeMap/py.png',
    './sources/cubeMap/ny.png',
    './sources/cubeMap/pz.png',
    './sources/cubeMap/nz.png'
])

let scaleFactor = window.innerWidth <= 600 ? 0.2 : 0.4;

const geometries = [
    new THREE.BoxGeometry(1 * scaleFactor, 1 * scaleFactor, 1 * scaleFactor), // 큐브
    new THREE.SphereGeometry(0.75 * scaleFactor, 60, 30), // 구
    new THREE.CylinderGeometry(1 * scaleFactor, 1 * scaleFactor, 0.02, 60), // 원판
];

const materials = [
    new THREE.MeshBasicMaterial(), // 원색
    new THREE.MeshStandardMaterial(), // Basic
    new THREE.MeshNormalMaterial(), // Normal
    (() => { const m = new THREE.MeshNormalMaterial(); m.flatShading = true; return m; })(), // Normal.flatShading
    (() => { const m = new THREE.MeshStandardMaterial({ color: 0xe0e0e0 }); m.roughness = 0.1; m.metalness = 1.0; m.envMap = environmentMapTexture; return m; })() // Metal
];

// cannon-es.js 물리 세계 생성
const world = new CANNON.World();
world.gravity.set(0,0,0);
world.broadphase = new CANNON.SAPBroadphase(world);
world.solver = new CANNON.GSSolver();

world.solver.iterations = 10;
world.solver.tolerance = 0.001;

function getShapeForGeometry(geometry, scale) {
    if (geometry instanceof THREE.BoxGeometry) {
        const size = geometry.parameters.width / 2;
        return new CANNON.Box(new CANNON.Vec3(size * scale, size * scale, size * scale));
    } else if (geometry instanceof THREE.SphereGeometry) {
        const radius = geometry.parameters.radius;
        return new CANNON.Sphere(radius * scale);
    } else if (geometry instanceof THREE.CylinderGeometry) {
        const radiusTop = geometry.parameters.radiusTop;
        const radiusBottom = geometry.parameters.radiusBottom;
        const height = geometry.parameters.height;
        return new CANNON.Cylinder(radiusTop * scale, radiusBottom * scale, height * scale, geometry.parameters.radialSegments);
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
let mesh;
const zPos = -2.4

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

    // bezierCnt에 따라 새로운 Mesh 생성 및 추가
    for (let i = 0; i < bezierCnt; i++) {
        let position, distanceSquared;
        do {
            // XYZ 좌표를 랜덤하게 선택합니다.
            position = new THREE.Vector3(
                (Math.random() - 0.5) * 2 * radius,
                (Math.random() - 0.5) * 2 * radius,
                (Math.random() - 0.5) * 2 * radius
            );
            // 중심에서 선택된 좌표까지의 거리의 제곱을 계산합니다.
            distanceSquared = position.x * position.x + position.y * position.y + position.z * position.z;
        } while (distanceSquared > radius * radius);

        const geometryIndex = Math.floor(Math.random() * geometries.length);
        const materialIndex = Math.floor(Math.random() * materials.length);
        const geometry = geometries[geometryIndex];
        let material;
        
        if (materialIndex === 0 || materialIndex === 1) {
            material = materialIndex === 0 ? 
                new THREE.MeshBasicMaterial({ color: ranColor() }) : 
                new THREE.MeshStandardMaterial({ color: ranColor() });
        } else {
            material = materials[materialIndex];
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z + zPos);

        const ranScale = Math.random() * 0.5 + 0.5;
        mesh.scale.set(ranScale, ranScale, ranScale);
        mesh.userData.initialScale = ranScale;

        // Mesh의 물리 바디 생성 및 설정
        const shape = getShapeForGeometry(geometry, ranScale);
        if (!shape) continue;
        
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

    if (meshes.length > 0) {
        mesh = meshes[0];
    }
}

const growDuration = 0.3;
const shrinkDuration = 0.9;
const scaleTo = -0.25;

function cubicBezier(t, p0, p1, p2, p3) {
    const C = (3 * p1) - (3 * p0) + p3 - p0;
    const B = (3 * p0) - (6 * p1) + (3 * p2);
    const A = (3 * p1) - (3 * p2);
    const D = p0;
    return ((A * t + B) * t + C) * t + D;
}

function animateMeshes() {
    const currentTime = (new Date()).getTime() / 1000;
    meshes.forEach(mesh => {
        if (!mesh.animation) {
            mesh.animation = {
                isAnimating: false,
                animationPhase: 0, // (0: no animation, 1: growing, 2: shrinking)
                animationStartTime: 0
            };
        }
        const animation = mesh.animation;

        if (pointPos >= 0.99 && animation.animationPhase === 0) {
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
                    scale = initialScale + cubicBezier(t, 0.15, 0.8, 0.6, 1) * scaleTo;
                } else {
                    animation.animationPhase = 2;
                    animation.animationStartTime = currentTime;
                }
            }

            else if (animation.animationPhase === 2) {
                if (elapsedTime <= shrinkDuration) {
                    const t = elapsedTime / shrinkDuration;
                    scale = (initialScale + scaleTo) - cubicBezier(t, 0.15, 0.8, 0.6, 1) * scaleTo;
                } else {
                    animation.isAnimating = false;
                    animation.animationPhase = 0;
                }
            }

            if (scale !== undefined) {
                mesh.scale.set(scale, scale, scale);
            }
        }
        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.01;
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
        
        radialVector.normalize(); // 방향만 유지
        const forceMagnitude = -0.025 * body.mass; // 힘의 크기 설정
        radialVector.x *= forceMagnitude;
        radialVector.y *= forceMagnitude;
        radialVector.z *= forceMagnitude; // 힘의 크기 조정
        body.applyForce(radialVector, body.position);
    });
}

function createBoxBoundary(width, height, depth) {
    const viewSize = getViewSizeAtDepth(camera.position.z);
    const wallThickness = 0.01;
    const halfWidth = width * viewSize.width / 2;
    const halfHeight = height * viewSize.height / 2;
    const halfDepth = depth / 2;

    // 육면체의 벽을 생성하는 함수
    function createWall(wallPosition, wallSize) {
        const shape = new CANNON.Box(new CANNON.Vec3(wallSize.x / 2, wallSize.y / 2, wallSize.z / 2));
        const wallBody = new CANNON.Body({ mass: 0 });
        wallBody.addShape(shape);
        wallBody.position.copy(wallPosition);
        world.addBody(wallBody);

        // 시각적으로 벽을 표현하기 위한 Three.js Mesh
        const geometry = new THREE.BoxGeometry(wallSize.x, wallSize.y, wallSize.z);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
        const wallMesh = new THREE.Mesh(geometry, material);
        wallMesh.position.copy(wallPosition);
        // scene.add(wallMesh);
    }

    // 상단, 하단
    createWall(new CANNON.Vec3(0, halfHeight, 0 + zPos), new CANNON.Vec3(width * viewSize.width, wallThickness, depth));
    createWall(new CANNON.Vec3(0, -halfHeight, 0 + zPos), new CANNON.Vec3(width * viewSize.width, wallThickness, depth));
    // 왼쪽, 오른쪽
    createWall(new CANNON.Vec3(-halfWidth, 0, 0 + zPos), new CANNON.Vec3(wallThickness, height * viewSize.height, depth));
    createWall(new CANNON.Vec3(halfWidth, 0, 0 + zPos), new CANNON.Vec3(wallThickness, height * viewSize.height, depth));
    // 전면, 후면
    createWall(new CANNON.Vec3(0, 0, halfDepth + zPos), new CANNON.Vec3(width * viewSize.width, height * viewSize.height, wallThickness));
    createWall(new CANNON.Vec3(0, 0, -halfDepth + zPos), new CANNON.Vec3(width * viewSize.width, height * viewSize.height, wallThickness));
}

// 카메라의 z 위치에서 볼 수 있는 뷰의 크기를 계산
function getViewSizeAtDepth(depth) {
    const fovInRadians = (camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fovInRadians / 2) * Math.abs(depth);
    const width = height * camera.aspect;
    return { width, height };
}
createBoxBoundary(1, 1, 5);

document.getElementById('ranDice').addEventListener('click', function() {
    updateScene();
});

let lastBezierCnt = -1;

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
    renderer.render(scene, camera);
}
animate();


//UI BUTTON------------------------------------------------------------
document.getElementById('toggleMode').addEventListener('click', function() {
    const body = document.body;
    const exScroll = document.getElementById('exScroll');
    const dayNight = document.getElementById('toggleMode');
    const ranDice = document.getElementById('ranDice');

    body.classList.toggle('day-mode');
    if (!body.classList.contains('day-mode')) {
        body.classList.add('night-mode');
        exScroll.style.mixBlendMode = 'screen';
        ranDice.src = 'sources/ranNight-Icon.svg';
        scene.background = new THREE.Color( 0x000000 );
    } else {
        body.classList.remove('night-mode');
        exScroll.style.mixBlendMode = 'multiply';
        ranDice.src = 'sources/ranDay-Icon.svg';
        scene.background = new THREE.Color( 0xFFFFFF );

    }

    if (dayNight.src.includes('sources/toDay-Icon.svg')) {
        dayNight.src = 'sources/toNight-Icon.svg';
    } else {
        dayNight.src = 'sources/toDay-Icon.svg';
    }
});