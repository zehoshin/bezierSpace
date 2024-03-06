document.getElementById('saveImg').addEventListener('click', function() {
    html2canvas(document.querySelector("#captureArea"), {
        backgroundColor: null
    }).then(canvas => {
        var domImage = canvas.toDataURL("image/png");
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        function drawGradient(ctx, elementId, width, height) {
            var element = document.getElementById(elementId);
            var gradient = ctx.createLinearGradient(0, 0, 0, height);
    
            if (element.classList.contains("day-mode")) {
                gradient.addColorStop(0, "rgb(220, 220, 220)");
                gradient.addColorStop(0.2, "rgb(255, 255, 255)");
            } else if (element.classList.contains("night-mode")) {
                gradient.addColorStop(0, "rgb(0, 0, 0)");
                gradient.addColorStop(0.8, "rgb(55, 55, 55)");
            }
    
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
        }
        
        var img = new Image();
        img.src = domImage;

        drawGradient(ctx, "bg", canvas.width, canvas.height);

        img.onload = function() {
                ctx.drawImage(img, 0, 0);
                saveImage(canvas.toDataURL("image/png"), "merged-image.png");
        };
    });
    function saveImage(data, filename) {
        var link = document.createElement('a');
        link.download = filename;
        link.href = data;
        document.body.appendChild(link); // Firefox
        link.click();
        document.body.removeChild(link); // Firefox
    }
    
});
