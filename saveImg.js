document.getElementById('saveImg').addEventListener('click', function() {
    html2canvas(document.querySelector("#captureArea"), {
        backgroundColor: null,
        scale: 1,
    }).then(canvas => {
        let domImage = canvas.toDataURL("image/png");
        let ctx = canvas.getContext('2d');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        function drawGradient(ctx, elementId, width, height) {
            let element = document.getElementById(elementId);
            let gradient = ctx.createLinearGradient(0, 0, 0, height);
    
            if (element.classList.contains("day-mode")) {
                gradient.addColorStop(0, "rgb(220, 220, 220)");
                gradient.addColorStop(0.2, "rgb(255, 255, 255)");
            } else if (element.classList.contains("night-mode")) {
                gradient.addColorStop(0.8, "rgb(0, 0, 0)");
                gradient.addColorStop(1, "rgb(55, 55, 55)");
            }
    
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
        }
        
        let img = new Image();
        img.src = domImage;

        drawGradient(ctx, "bg", canvas.width, canvas.height);

        img.onload = function() {
                ctx.drawImage(img, 0, 0);
                saveImage(canvas.toDataURL("image/png"), "BezierSpace.png");
        };
    });
    function saveImage(data, filename) {
        let link = document.createElement('a');
        link.download = filename;
        link.href = data;
        document.body.appendChild(link); // Firefox
        link.click();
        document.body.removeChild(link); // Firefox
    }
});

//CAPTURE VIDEO
const bodyElement = document.querySelector('body');
const videoNone = document.getElementById('videoNone');

document.getElementById('record').addEventListener('click', function() {

    if (window.isRecording) {
        // 녹화 중지
        window.mediaRecorder.stop();
        window.isRecording = false;

    } else {
        // 화면 공유를 위한 사용자의 동의 요청
        navigator.mediaDevices.getDisplayMedia({
            video: {frameRate: 60, cursor: "never"}, 
            preferCurrentTab: "true",
            
        }).then(stream => {
            // 녹화 시작
            // bodyElement.style.cursor = 'none';
            // videoNone.style.display = 'none';
        
            window.mediaRecorder = new MediaRecorder(stream);
            window.chunks = [];
            window.isRecording = true;

            window.mediaRecorder.ondataavailable = function(e) {
                window.chunks.push(e.data);
            };

            window.mediaRecorder.onstop = function() {
                // 녹화 중지 후 비디오 파일 생성 및 다운로드 링크 제공
                const blob = new Blob(window.chunks, {'type': 'video/mp4'});
                window.chunks = [];
                const videoURL = URL.createObjectURL(blob);
                downloadVideo(videoURL);
            };

            window.mediaRecorder.start();
        }).catch(err => console.error("Error during getDisplayMedia()", err));
    }
});

function downloadVideo(url) {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recordedVideo.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // bodyElement.style.cursor = 'default';
    // videoNone.style.display = 'block';

}

