import * as THREE from './three.module.js'
import * as CANNON from './cannon.js'

import { bezierCnt, pointPos, ranColor } from './bezierText.js'
//필요->>>>bezierCnt 수에 따라 geometry를 scene에 생성

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xFFFFFF );

const camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 1;

const light = new THREE.HemisphereLight( 0xffffff, 0x080820, 5 );
scene.add( light );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
const threeCanvas = document.getElementById('threeCanvas');

threeCanvas.appendChild( renderer.domElement );

const textureLoader = new THREE.CubeTextureLoader();
const environmentMapTexture = textureLoader.load([
    '/sources/cubeMap/px.png',
    '/sources/cubeMap/nx.png',
    '/sources/cubeMap/py.png',
    '/sources/cubeMap/ny.png',
    '/sources/cubeMap/pz.png',
    '/sources/cubeMap/nz.png'
])

const scaleFactor = 0.25;

const geometries = [
    new THREE.BoxGeometry(1 * scaleFactor, 1 * scaleFactor, 1 * scaleFactor), // 큐브
    new THREE.SphereGeometry(0.75 * scaleFactor, 60, 30), // 구
    new THREE.TorusGeometry(0.6 * scaleFactor, 0.06, 30, 100), // 도넛
    new THREE.OctahedronGeometry(1 * scaleFactor, 0), // Octahedron
    new THREE.CylinderGeometry(1 * scaleFactor, 1 * scaleFactor, 0.02, 60), // 원판
    new THREE.ConeGeometry(0.75 * scaleFactor, 0.4, 5) // 오각뿔
];

const materials = [
    new THREE.MeshBasicMaterial({ color: ranColor() }), // 원색
    new THREE.MeshStandardMaterial({ color: ranColor() }), // Basic
    new THREE.MeshNormalMaterial(), // Normal
    (() => { const m = new THREE.MeshNormalMaterial(); m.flatShading = true; return m; })(), // Normal.flatShading
    (() => { const m = new THREE.MeshStandardMaterial({ color: 0xe0e0e0 }); m.roughness = 0.1; m.metalness = 1.0; m.envMap = environmentMapTexture; return m; })() // Metal
];

const meshes = [];
let mesh;

function updateScene() {
    // 현재 Scene 내의 모든 Mesh 삭제
    meshes.forEach(mesh => {
        scene.remove(mesh);
    });
    meshes.length = 0; // Mesh 배열 비우기

    if (bezierCnt === 0) {
        scene.remove(mesh);
    }

    // bezierCnt에 따라 새로운 Mesh 생성 및 추가
    for (let i = 0; i < bezierCnt; i++) {
        const geometry = geometries[Math.floor(Math.random() * geometries.length)];
        const material = materials[Math.floor(Math.random() * materials.length)];
        const newMesh = new THREE.Mesh(geometry, material);
        newMesh.position.set(0,0,0);
        scene.add(newMesh);
        meshes.push(newMesh);
    }
    if (meshes.length > 0) {
        mesh = meshes[0];
    }
}

const growDuration = 0.3;
const shrinkDuration = 0.9;
const scaleTo = 0.25;

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

            if (animation.animationPhase === 1) {
                if (elapsedTime <= growDuration) {
                    const t = elapsedTime / growDuration;
                    scale = 1 + cubicBezier(t, 0.15, 0.8, 0.6, 1) * scaleTo;
                } else {
                    animation.animationPhase = 2;
                    animation.animationStartTime = currentTime;
                }
            }

            else if (animation.animationPhase === 2) {
                if (elapsedTime <= shrinkDuration) {
                    const t = elapsedTime / shrinkDuration;
                    scale = (1 + scaleTo) - cubicBezier(t, 0.15, 0.8, 0.6, 1) * scaleTo;
                } else {
                    animation.isAnimating = false;
                    animation.animationPhase = 0;
                }
            }

            if (scale !== undefined) {
                mesh.scale.set(scale, scale, scale);
            }
        }

        // 메쉬 회전 (선택적)
        mesh.rotation.x += 0.005;
        mesh.rotation.y += 0.005;
        mesh.rotation.z += 0.005;
    });
}

let lastBezierCnt = -1;

function animate() {
    requestAnimationFrame(animate);
    if (bezierCnt !== lastBezierCnt) {
        updateScene();
        lastBezierCnt = bezierCnt;
    }
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

    body.classList.toggle('night-mode');
    if (!body.classList.contains('night-mode')) {
        body.classList.add('day-mode');
        exScroll.style.mixBlendMode = 'multiply';
        ranDice.src = 'sources/ranDay-Icon.svg';
        scene.background = new THREE.Color( 0xFFFFFF );

    } else {
        body.classList.remove('day-mode');
        exScroll.style.mixBlendMode = 'screen';
        ranDice.src = 'sources/ranNight-Icon.svg';
        scene.background = new THREE.Color( 0x000000 );
    }

    if (dayNight.src.includes('sources/toNight-Icon.svg')) {
        dayNight.src = 'sources/toDay-Icon.svg';
    } else {
        dayNight.src = 'sources/toNight-Icon.svg';
    }
});