import { Bezier } from "./bezier.js";

document.addEventListener('DOMContentLoaded', function() {
    var canvas = document.getElementById('bezierCanvas');
    var ctx = canvas.getContext('2d');

    // 초기 제어점 위치
    var controlPoints = [{x: 933.765625, y: 407.171875}, {x: 200, y: 500}, {x: 500, y: 700}, {x: 320.4375, y: 540.5}];
    var radius = 30; // 제어점의 반지름
    var uniColor = '#ff0000'
    var circleColor = uniColor;
    var lineColor = uniColor;
    var controlLineColor = uniColor;
    var lineBold = 40;
    var controlLineBold = 20;
    var draggingPointId = null;

    function drawControlPoints() {
        ctx.fillStyle = circleColor;
        controlPoints.forEach(function(point) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, radius, 0, Math.PI * 2, false);
            ctx.fill();
            ctx.closePath();
        });
    }

    function drawCurve() {
        var curve = new Bezier(controlPoints.map(p => ({x: p.x, y: p.y})));
        var points = curve.getLUT(100);
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.forEach(function(point) {
            ctx.lineTo(point.x, point.y);
        });
        ctx.lineWidth = lineBold;
        ctx.strokeStyle = lineColor;
        ctx.stroke();
    }

    function drawControlLines() {
        ctx.lineWidth = controlLineBold;
        ctx.strokeStyle = controlLineColor;

        ctx.beginPath();
        ctx.moveTo(controlPoints[0].x, controlPoints[0].y);
        ctx.lineTo(controlPoints[1].x, controlPoints[1].y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(controlPoints[controlPoints.length - 2].x, controlPoints[controlPoints.length - 2].y);
        ctx.lineTo(controlPoints[controlPoints.length - 1].x, controlPoints[controlPoints.length - 1].y);
        ctx.stroke();
    }

    function redraw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawCurve();
        drawControlLines();
        drawControlPoints();
    }

    function pointHitTest(point, x, y) {
        return Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2) < radius;
    }

    canvas.addEventListener('mousedown', function(e) {
        var x = e.offsetX, y = e.offsetY;
        controlPoints.forEach(function(point, index) {
            if (pointHitTest(point, x, y)) {
                draggingPointId = index;
            }
        });
    });

    canvas.addEventListener('mousemove', function(e) {
        if (draggingPointId !== null) {
            controlPoints[draggingPointId].x = e.offsetX;
            controlPoints[draggingPointId].y = e.offsetY;
            redraw();
        }
    });

    canvas.addEventListener('mouseup', function() {
        draggingPointId = null;
    });

    redraw();
});