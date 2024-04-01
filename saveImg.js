document.getElementById('saveImg').addEventListener('click', function() {
    html2canvas(document.querySelector("#captureArea"), {
        backgroundColor: null,
        scale: window.devicePixelRatio,
    }).then(canvas => {
        let domImage = canvas.toDataURL("image/png");
        let ctx = canvas.getContext('2d');

        canvas.width = window.innerWidth * window.devicePixelRatio;
        canvas.height = window.innerHeight * window.devicePixelRatio;

        function drawBg(ctx, elementId, width, height) {
            let element = document.getElementById(elementId);
    
            if (element.classList.contains("day-mode")) {
                ctx.fillStyle = "rgb(255, 255, 255)";
            } else if (element.classList.contains("night-mode")) {
                ctx.fillStyle = "rgb(20, 20, 20)";
            }
            ctx.fillRect(0, 0, width, height);
        }
        
        let img = new Image();
        img.src = domImage;

        drawBg(ctx, "bg", canvas.width, canvas.height);

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