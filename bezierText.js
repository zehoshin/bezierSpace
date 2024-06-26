import { Bezier } from "./bezier.js";

const textInput = document.getElementById('textInput');
const fakeTextInput = document.getElementById('fakeTextInput');
const container = document.getElementById('container');
const canvas = document.getElementById('bezierCanvas');
const tempoRange = document.getElementById('tempo');
const exScroll = document.getElementById('exScroll');

const ctx = canvas.getContext('2d');
const widthPixelRatio = window.innerWidth * window.devicePixelRatio;
const heightPixelRatio = window.innerHeight * window.devicePixelRatio;
const endXFactor = -20;
const textAlignMap = {};
const DRAG_THRESHOLD = 0.1;
const OVERSHOOT_DISTANCE = 0.05;
const ELASTICITY = 0.2;
const ANIMATION_DURATION = 10;

let bezierCnt, pointPos;
let bezierCurveData = [];
let seconds = 3;
let isDragging = false;
let scrollUpd = false;
let animationFrameId = null; 
let dragging = false;
let draggingPoint = null; // 드래그 중인 제어점 정보

init();
export { bezierCnt, pointPos, ranNeon, ranTextAlign };

function init() {
    tempoRange.addEventListener('input', function() {
        let tempoValue = tempoRange.value;
        if (tempoValue == 1) {
            seconds = 1.01;
        } else {
        seconds = tempoValue;
        }
        const tempoText = document.getElementById('tempoText')
        tempoText.innerHTML = parseFloat(tempoValue).toFixed(1) + 'sec';
        updateSpeedForAllCurves();
    });

    // 초기 div 생성 및 화면 표시
    setTimeout(typeText, 500);
    onTextInput(); 
    
    textInput.addEventListener('keyup', function() {
        fakeTextInput.value = "";
    });
    textInput.addEventListener('keyup', onTextInput);
    
    document.body.addEventListener('wheel', handleScroll);
    container.addEventListener('touchmove', handleScroll); 
    exScroll.addEventListener('mousedown', startScroll);
    exScroll.addEventListener('touchstart', startScroll);
    
    window.addEventListener('resize', function() {
        textJustify();
        updateScrollShape();
        updateScrollPos();
        updateBezierCurvePos();
    });
    
    // 내용 변경 감지 및 스크롤바 업데이트
    const observer = new MutationObserver(function() {
        updateScrollShape();
        updateScrollPos();
    });
    observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true 
    });
    
    updateScrollShape();
    animate();
    addEventListeners();
}

function updateSpeedForAllCurves() {
    const newSpeed = setSpeed();
    bezierCurveData.forEach(curve => {
        curve.speed = newSpeed;
    });
}

function textJustify() {
    if (container.scrollHeight > container.clientHeight) {
        container.style.justifyContent = 'flex-start';
    } else {
        container.style.justifyContent = 'center';
    }
}

function onTextInput() {
    let textValue = textInput.value;
    let textArray = textValue.split(' ');

    let fakeTextValue = fakeTextInput.value;
    let fakeTextArray = fakeTextValue.split(' ');

    let currentCircleNums = new Set();

    // div 초기화
    let existingDivs = document.querySelectorAll('.textDiv');
    existingDivs.forEach(function(div) {
        div.remove();
    });

    // div 생성
    textArray.forEach(function(text, index) {
        if (text.trim() !== '') { //값이 있을 때 실행
            
            let textDiv = document.createElement('div');
            textDiv.className = 'textDiv';          

            // 앞 원 생성 및 번호 할당
            createCircle(textDiv, index * 2 + 1);

            // 텍스트 추가
            let textNode = document.createTextNode(text);
            textDiv.appendChild(textNode);

            // 뒤 원 생성 및 번호 할당
            createCircle(textDiv, index * 2 + 2);
                            
            container.appendChild(textDiv);

            if (index === 0) {
                textDiv.style.textAlign = 'center';
            } else {
                const circleNum = index * 2 + 2; // 뒤에 오는 circle 기준
                currentCircleNums.add(`textCircleNum${circleNum}`);
                const textAlignValue = getTextAlignValue(circleNum, index);
                textDiv.style.textAlign = textAlignValue;
            }
        }
    });
    // div 생성
    fakeTextArray.forEach(function(text, index) {
        if (text.trim() !== '') { //값이 있을 때 실행
            
            let textDiv = document.createElement('div');
            textDiv.className = 'textDiv';          

            // 앞 원 생성 및 번호 할당
            createCircle(textDiv, index * 2 + 1);

            // 텍스트 추가
            let textNode = document.createTextNode(text);
            textDiv.appendChild(textNode);

            // 뒤 원 생성 및 번호 할당
            createCircle(textDiv, index * 2 + 2);
                            
            container.appendChild(textDiv);

            if (index === 0) {
                textDiv.style.textAlign = 'center';
            } else {
                const circleNum = index * 2 + 2; // 뒤에 오는 circle 기준
                currentCircleNums.add(`textCircleNum${circleNum}`);
                const textAlignValue = getTextAlignValue(circleNum, index);
                textDiv.style.textAlign = textAlignValue;
            }
        }
    });
    Object.keys(textAlignMap).forEach(key => {
        if (!currentCircleNums.has(key)) {
            delete textAlignMap[key];
        }
    });
    textJustify();
    genBezierCurve(); 
    bezierCnt = bezierCurveData.length;
}

function createCircle(parentDiv, circleNum) {
    let circleDiv = document.createElement('div');
    circleDiv.className = `textCircle textCircleNum${circleNum}`;
    parentDiv.appendChild(circleDiv);
}

function getTextAlignValue(circleNum) {
    const key = `textCircleNum${circleNum}`;
    if (!textAlignMap[key]) {
        const options = ['left', 'center', 'right'];
        textAlignMap[key] = options[Math.floor(Math.random() * options.length)];
    }
    return textAlignMap[key];
}

function typeText() {
    fakeTextInput.addEventListener('th.afterType', onTextInput);
    TypeHangul.type('#fakeTextInput', {
        text: "영상으로 경험을 이야기합니다.",
        intervalType: 90,
    });
}

function ranTextAlign() {
    document.querySelectorAll('.textDiv').forEach((div, index) => {
        const textAlignValue = ['left', 'center', 'right'][Math.floor(Math.random() * 3)];
        div.style.textAlign = textAlignValue;

        const circleNum = index * 2 + 2; // 뒤에 오는 circle 기준
        textAlignMap[`textCircleNum${circleNum}`] = textAlignValue;
    });
    genBezierCurve();
}

//스크롤바-------------------------------------------------------------
container.addEventListener('scroll', function() {
    if (!scrollUpd) {
        requestAnimationFrame(function() {
            updateBezierCurvePos(); // 베지어 곡선 위치 업데이트 함수
            scrollUpd = false;
        });
        scrollUpd = true;
    }
});

function handleScroll(e) {
    const scrollAmount = e.deltaY || e.touches[0].pageY; // 마우스 휠 또는 터치 이동 거리
    const maxScroll = container.scrollHeight - container.clientHeight;
    // 스크롤 위치 업데이트
    container.scrollTop += scrollAmount * 0.5;

    // 스크롤 위치 제한
    if (container.scrollTop < 0) {
        container.scrollTop = 0;
    } else if (container.scrollTop > maxScroll) {
        container.scrollTop = maxScroll;
    }
    updateScrollPos();
}

// 스크롤바 모양과 위치 업데이트 함수들
function updateScrollShape() {
    const scrollRatio = container.clientHeight / container.scrollHeight;
    const scrollbarHeight = Math.max(scrollRatio * container.clientHeight - 20, 20);
    exScroll.style.height = `${scrollbarHeight}px`;
    exScroll.style.display = scrollRatio >= 1 ? 'none' : 'block';
}

function updateScrollPos() {
    const scrollPer = container.scrollTop / (container.scrollHeight - container.clientHeight);
    const topPosition = scrollPer * (container.clientHeight - exScroll.offsetHeight);
    exScroll.style.top = `${topPosition}px`;
}

function startScroll(e) {
    isDragging = true;
    const startY = e.pageY || e.touches[0].pageY; // 마우스 또는 터치 시작 Y 위치
    const startTop = parseFloat(exScroll.style.top) || 0;
    const maxTop = container.clientHeight - exScroll.offsetHeight;

    function onScroll(e) {
        if (!isDragging) return;
        let deltaY = (e.pageY || e.touches[0].pageY) - startY; // 마우스 또는 터치 이동 거리
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
    }

    document.addEventListener('mousemove', onScroll);
    document.addEventListener('mouseup', stopScroll);
    document.addEventListener('touchmove', onScroll);
    document.addEventListener('touchend', stopScroll);

    e.preventDefault();
}

//Bezier Curve 생성-----------------------------------------------------
// 랜덤
function ranNeon() {
    const hue = Math.floor((Math.random() * 36) * 10);
    const saturation = 100;
    const lightness = 50;

    function hslToRgb(h, s, l) {
        s /= 100;
        l /= 100;
        let c = (1 - Math.abs(2 * l - 1)) * s,
            x = c * (1 - Math.abs((h / 60) % 2 - 1)),
            m = l - c/2,
            r = 0,
            g = 0,
            b = 0;
        if (0 <= h && h < 60) {
            r = c; g = x; b = 0;
        } else if (60 <= h && h < 120) {
            r = x; g = c; b = 0;
        } else if (120 <= h && h < 180) {
            r = 0; g = c; b = x;
        } else if (180 <= h && h < 240) {
            r = 0; g = x; b = c;
        } else if (240 <= h && h < 300) {
            r = x; g = 0; b = c;
        } else if (300 <= h && h < 360) {
            r = c; g = 0; b = x;
        }
        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);
        return {r, g, b};
    }

    function rgbToHex(r, g, b) {
        return "#" + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    const {r, g, b} = hslToRgb(hue, saturation, lightness);
    return rgbToHex(r, g, b);
}

function ranLineWidth() {
    if (window.innerWidth <= 900) {
        return Math.floor(Math.random() * 2) + 3;
    } else {
        return Math.floor(Math.random() * 3) + 5;
    }
}

function ranRadius() {
    let lineWidth = ranLineWidth();
    return lineWidth + 5;
}

function ranShape() {
    const shapes = ['circle', 'square'];
    const ranIndex = Math.floor(Math.random() * shapes.length);
    return shapes[ranIndex];
}

function ranPoint(circleNum, refPoint) {
    let MAX_DISTANCE = window.innerWidth <= 900 ? 250 : 750;
    let minY = 0;
    let maxY = window.innerHeight;

    let prevCircle = document.querySelector(`.textCircleNum${circleNum - 2}`);
    if (!prevCircle) {
        prevCircle = document.querySelector(`.textCircleNum${circleNum - 1}`);
    }
    if (prevCircle) {
        const rect = prevCircle.getBoundingClientRect();
        minY = rect.top + window.scrollY;
    }

    let nextCircle = document.querySelector(`.textCircleNum${circleNum + 3}`);
    if (!nextCircle) {
        nextCircle = document.querySelector(`.textCircleNum${circleNum}`); 
    }
    if (nextCircle) {
        const rect = nextCircle.getBoundingClientRect();
        maxY = rect.top + window.scrollY;
    }

    let x = Math.random() * (window.innerWidth - window.innerWidth * 0.2) + window.innerWidth * 0.1;
    let y = minY + Math.random() * (maxY - minY);

    const dx = x - refPoint.x;
    const dy = y - refPoint.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > MAX_DISTANCE) {
        const angle = Math.atan2(dy, dx);
        x = refPoint.x + Math.cos(angle) * MAX_DISTANCE * (Math.random() - 0.5) * 2;
        y = refPoint.y + Math.sin(angle) * MAX_DISTANCE * (Math.random() - 0.5) * 2;

        // 최대 범위를 벗어나지 않도록  조정
        x = Math.max(window.innerWidth * 0.1, Math.min(x, window.innerWidth - window.innerWidth * 0.2));
        y = Math.max(minY, Math.min(y, maxY));
    }
    return { x, y };
}

function setSpeed() {
    const framesPerSecond = 60;
    const framesForDesiredMove = framesPerSecond * seconds;
    const newSpeed = 1 / framesForDesiredMove;
    return newSpeed;
}

// 제어점, 제어선, 베지어 곡선 
function drawControlPoints(curve) {
    ctx.fillStyle = curve.color;
    curve.points.forEach(function(point, index) {

        let size = curve.radius * 0.9;
        if (index === 0 || index === 3) { // 시작점 또는 끝점
            size = curve.lineWidth * 1;
        }
        switch (curve.shape) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(point.x, point.y, size, 0, 2 * Math.PI);
                ctx.fill();
                break;
            case 'square':
                ctx.beginPath();
                size *= 0.9;
                ctx.rect(point.x - size, point.y - size, size * 2, size * 2);
                ctx.fill();
                break;
        }
    });
}

function drawControlLines(curve) {
    if (curve.points.length < 2) return; 
    ctx.beginPath();
    ctx.moveTo(curve.points[0].x, curve.points[0].y);
    ctx.lineTo(curve.points[1].x, curve.points[1].y);
    ctx.moveTo(curve.points[2].x, curve.points[2].y);
    ctx.lineTo(curve.points[3].x, curve.points[3].y);

    ctx.strokeStyle = curve.color;
    ctx.lineWidth = curve.lineWidth;
    ctx.antialias = true

    // if (curve.lineStyle === 'dashed') {
    //     ctx.setLineDash([curve.lineWidth, curve.lineWidth]);
    // } else {
    //     ctx.setLineDash([]);
    // }
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawBezierCurve(curve) {
    if (curve.points.length < 4) return; // 제어점이 4개 미만이면 곡선X

    ctx.beginPath();
    ctx.moveTo(curve.points[0].x, curve.points[0].y);
    let bezier = new Bezier(curve.points);
    let points = bezier.getLUT(200);
    for (let i = 0; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = curve.color;
    ctx.lineWidth = curve.lineWidth;
    
    if (curve.lineStyle === 'dashed') {
        ctx.setLineDash([curve.lineWidth, curve.lineWidth]);
    } else {
        ctx.setLineDash([]);
    }
    ctx.stroke();
    ctx.setLineDash([]);
}

function getStartEndPos(circleNum) {
    const circle = document.querySelector(`.textCircleNum${circleNum}`);
    if (!circle) return null;

    const rect = circle.getBoundingClientRect();
    const x = rect.left + window.scrollX + (rect.width / 2);
    const y = rect.top + window.scrollY + (rect.height / 2);

    return { x, y };
}

// 베지어 곡선 생성
function genBezierCurve() {
    let circles = document.querySelectorAll('[class*="textCircleNum"]');
    let controlPoints = [];
    let newControlPointsAdded = false;

    let hasTextCircleNum3 = document.querySelector('.textCircleNum3') !== null;
    if (circles.length === 0 || !hasTextCircleNum3) {
        bezierCurveData = [];
        bezierCurveData.length = 0;
        redraw(); 
        return; 
    }

    circles.forEach(function(circle, index) {
        const num = parseInt(circle.className.match(/textCircleNum(\d+)/)[1]);
        const pos = getStartEndPos(num);
        if (!pos) return; 

        // 짝수 번째 textCircleNum을 시작점으로, 홀수 번째를 끝점으로 설정
        if ((index + 1) % 2 === 0) { // 짝수
            controlPoints[0] = pos;
        } else if (controlPoints.length === 1) { // 홀수
            controlPoints[3] = { x: pos.x + endXFactor, y: pos.y }
            
            controlPoints[1] = ranPoint(((index + 1) - 1), controlPoints[0]);
            controlPoints[2] = ranPoint(((index + 1) + 1), controlPoints[3]);

            let relativePositions = {
                cp1: {
                    dx: controlPoints[1].x - controlPoints[0].x, dy: controlPoints[1].y - controlPoints[0].y 
                },
                cp2: {
                    dx: controlPoints[2].x - controlPoints[3].x, dy: controlPoints[2].y - controlPoints[3].y 
                }
            };
        
            bezierCurveData.push({
                startCircleNum: (index + 1) - 1, 
                endCircleNum: (index + 1),
                relativePositions: relativePositions,
                points: controlPoints,
                shape: ranShape(),
                color: ranNeon(),
                lineWidth: ranLineWidth(),
                // lineStyle: Math.random() < 0.4 ? 'dashed' : 'solid',
                radius: ranRadius(),
                currentPoint: 0, 
                direction: 1,
                speed: setSpeed(),
            });

            newControlPointsAdded = true;
            controlPoints = [];
        }
    });

    // 최대 곡선 개수 제한
    const maxCurvesCount = Math.floor((Math.max(...Array.from(circles).map(circle => 
        parseInt(circle.className.match(/textCircleNum(\d+)/)[1], 10))) - 2) / 2);

    // 최신 곡선만 유지
    if (bezierCurveData.length > maxCurvesCount) {
        bezierCurveData = bezierCurveData.slice(-maxCurvesCount);
    }
    if (newControlPointsAdded) {
        redraw(); // 모든 곡선 다시 그리기
    }
    // console.log(bezierCurveData);
}

function updateBezierCurvePos() {
    bezierCurveData.forEach(function(curve) {
        const startPos = getStartEndPos(curve.startCircleNum);
        const endPos = getStartEndPos(curve.endCircleNum);    

        if (startPos && endPos) {
            curve.points[0] = startPos;
            curve.points[3] = endPos;
            curve.points[1] = {
                x: startPos.x + curve.relativePositions.cp1.dx, 
                y: startPos.y + curve.relativePositions.cp1.dy
            };
            curve.points[2] = {
                x: endPos.x + curve.relativePositions.cp2.dx,
                y: endPos.y + curve.relativePositions.cp2.dy
            };
        }
    });
}

function updateStartEndPos() {
    const circleElements = document.querySelectorAll('[class*="textCircleNum"]');
    circleElements.forEach(circle => {
        const num = parseInt(circle.className.match(/textCircleNum(\d+)/)[1]);
        const pos = getStartEndPos(num);

        if (pos) {
            bezierCurveData.forEach(curve => {
                if (curve.startCircleNum === num) {
                    curve.points[0] = pos;
                } else if (curve.endCircleNum === num) {
                    curve.points[3] = {
                        x: pos.x + endXFactor,
                        y: pos.y 
                    };
                }
            });
        }
    });
}

function redraw() {
    canvas.width = widthPixelRatio;
    canvas.height = heightPixelRatio;
    ctx.clearRect(0, 0, canvas.width, canvas.height); 

    bezierCurveData.forEach(function(curve) {
        drawBezierCurve(curve);
        drawControlPoints(curve); 
        drawControlLines(curve);
    });
}

//원형 애니메이션---------------------------------------
function easeInOut(currentPoint) {
    if (window.innerWidth <= 900) {
        return 0.9 + 1.5 * Math.sin(currentPoint * Math.PI);
    } else {
        return 0.9 + 2.1 * Math.sin(currentPoint * Math.PI);
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateStartEndPos();
    redraw();

    bezierCurveData.forEach(function(curve) {
        let bezier = new Bezier(curve.points);
        pointPos = curve.currentPoint;
        let point = bezier.get(pointPos);
        let derivative = bezier.derivative(pointPos);
        let angle = Math.atan2(derivative.y, derivative.x);

        let scaleFactor = easeInOut(curve.currentPoint);
        let size = curve.lineWidth * scaleFactor;

        if (curve.shape === 'circle') {
            // 원
            ctx.beginPath();
            ctx.arc(point.x, point.y, size, 0, 2 * Math.PI);
            ctx.fillStyle = curve.color;
            ctx.fill();
        } else if (curve.shape === 'square') {
            size *= 1.5;
            // 사각형
            ctx.save();
            ctx.translate(point.x, point.y);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.rect(-size / 2, -size / 2, size, size);
            ctx.fillStyle = curve.color;
            ctx.fill();
            ctx.restore();
        }

        // 위치 및 방향 업데이트
        curve.currentPoint += curve.speed * curve.direction;

        if (curve.points.length >= 4 && Math.abs(curve.currentPoint - 0.99) < 0.01) {
            if (!curve.animationTriggered) {
                document.querySelectorAll('.textDiv').forEach(div => {
                    div.classList.add('bouncing');
                    setTimeout(() => {
                        div.classList.remove('bouncing');
                    }, 1000); // CSS 애니메이션 지속 시간에 맞춰 클래스 삭제
                });
                curve.animationTriggered = true;
            }
        } else {
            curve.animationTriggered = false;
        }
        if (curve.currentPoint >= 1 || curve.currentPoint <= 0) {
            curve.currentPoint = Math.min(0, Math.min(curve.currentPoint, 1));
        }
    });
    // 다음 프레임 요청
    animationFrameId = requestAnimationFrame(animate);
}

//마우스 드래그 이벤트---------------------------------------------
// 드래그 시작 검사
function checkDragStart(x, y) {
    bezierCurveData.forEach((curve, curveIndex) => {
        curve.points.forEach((point, pointIndex) => {
            if (Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2) < curve.radius) {
                if (pointIndex === 0 || pointIndex === 3) return;
                dragging = true;
                draggingPoint = { curveIndex, pointIndex };
            }
        });
    });
}

// 드래그 중 제어점 위치 업데이트
function updatePointPos(x, y) {
    const { curveIndex, pointIndex } = draggingPoint;
    const controlPoint = bezierCurveData[curveIndex].points[pointIndex];
    controlPoint.x = x;
    controlPoint.y = y;
    redraw();
}

function addEventListeners() {
    canvas.addEventListener('mousedown', startDrag);
    canvas.addEventListener('mousemove', drag);
    canvas.addEventListener('mouseup', endDrag);
    canvas.addEventListener('touchstart', startDrag);
    canvas.addEventListener('touchmove', drag);
    canvas.addEventListener('touchend', endDrag);
}

function startDrag(e) {
    e.preventDefault(); // 기본 터치 이벤트 방지
    let x, y;
    if (e.type === 'touchstart') {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
    } else { // 'mousedown'
        x = e.offsetX;
        y = e.offsetY;
    }
    dragging = false;
    checkDragStart(x, y);
}

function drag(e) {
    if (!dragging || draggingPoint === null) return;
    let x, y;
    if (e.type === 'touchmove') {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
    } else { // 'mousemove'
        x = e.offsetX;
        y = e.offsetY;
    }
    updatePointPos(x, y);
}

function endDrag(e) {
    if (!dragging || draggingPoint === null) return;
    calElastic();
    dragging = false;
    draggingPoint = null;
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
    }
    animate();
}

// Elastic 계산
function calElastic() {
    const { curveIndex, pointIndex } = draggingPoint;
    const curve = bezierCurveData[curveIndex];
    const controlPoint = curve.points[pointIndex];
    updateRelativePos(curve, pointIndex);

    const fixedPoint = curve.points[pointIndex === 1 ? 0 : 3];
    const directionX = controlPoint.x - fixedPoint.x;
    const directionY = controlPoint.y - fixedPoint.y;
    const overshootX = controlPoint.x + directionX * OVERSHOOT_DISTANCE;
    const overshootY = controlPoint.y + directionY * OVERSHOOT_DISTANCE;

    withElasticity(curveIndex, 
                   pointIndex, 
                   controlPoint.x, 
                   controlPoint.y, 
                   overshootX, 
                   overshootY
                   );
}

// 상대적 위치
function updateRelativePos(curve, pointIndex) {
    const fixedPointIndex = pointIndex === 1 ? 0 : 3;
    const controlPoint = curve.points[pointIndex];
    const fixedPoint = curve.points[fixedPointIndex];

    curve.relativePositions[`cp${pointIndex}`] = {
        dx: controlPoint.x - fixedPoint.x,
        dy: controlPoint.y - fixedPoint.y
    };
}

// Elastic 움직임
function withElasticity(curveIndex, 
                        pointIndex, 
                        targetX, 
                        targetY, 
                        overshootX, 
                        overshootY
                        ) {
    const controlPoint = bezierCurveData[curveIndex].points[pointIndex];
    // 이전 애니메이션 프레임 취소
    if (controlPoint.animationFrameId !== null) {
        cancelAnimationFrame(controlPoint.animationFrameId);
    }

    let elapsedTime = 0;
    const animateElastic = () => {
        elapsedTime += 1;
        if (elapsedTime <= ANIMATION_DURATION) {
            // 오버슈트 위치까지 이동
            controlPoint.x += (overshootX - controlPoint.x) * ELASTICITY;
            controlPoint.y += (overshootY - controlPoint.y) * ELASTICITY;
        } else {
            // 목표 위치로 복귀 시작
            controlPoint.x += (targetX - controlPoint.x) * ELASTICITY;
            controlPoint.y += (targetY - controlPoint.y) * ELASTICITY;
        }
        redraw();

        // 목표 위치에 도달했는지 검사
        const dx = targetX - controlPoint.x;
        const dy = targetY - controlPoint.y;
        if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD && elapsedTime > ANIMATION_DURATION) {
            // 최종 위치에서 캔버스 다시 그리기
            controlPoint.x = targetX;
            controlPoint.y = targetY;
            redraw();
            controlPoint.animationFrameId = null; // 애니메이션 종료
        } else {
            controlPoint.animationFrameId = requestAnimationFrame(animateElastic);
        }
    };
    controlPoint.animationFrameId = requestAnimationFrame(animateElastic);
}

