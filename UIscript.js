const headline = document.querySelectorAll('.headline');
const content = document.querySelectorAll('.content');
const hyperlink = document.querySelectorAll('.hyperlink');
const aboutContent = document.querySelectorAll('.aboutContent');
const iconText = document.getElementById('iconText');
const dayNight = document.getElementById('dayNight');
const boundBox = document.getElementById('boundBox');
const bg = document.getElementById('bg');
const controlPanel = document.getElementById('controlPanel');
const threeOpacity = document.getElementById('threeOpacity');
const textOpacity = document.getElementById('textOpacity');
const bezierCanvas = document.getElementById('bezierCanvas');
const cube = document.getElementById('cube');
const saveImg = document.getElementById('saveImg');
const settings = document.getElementById('settings');
const rangeInput = document.querySelectorAll('.rangeInput');
const setCircle = document.getElementById('setCircle');
const imgBtn = document.querySelectorAll('.imgBtn');
const aboutIcon = document.getElementById('aboutIcon');
const aboutDiv = document.getElementById('aboutDiv');
const allWithoutAbout = document.getElementById('allWithoutAbout');
const random = document.getElementById('random');
const textSizeText = document.getElementById('textSizeText')

let isNight = true;
let isranChecked = true;
let isAboutNone = true;
let isSettingsOff = true;

document.addEventListener("DOMContentLoaded", function() {
    underHeight750();
    window.addEventListener('resize', function() {
        underHeight750();
        initTextSize();
    });

    random.addEventListener('click', randomToggle);
    settings.addEventListener('click', openSettings);
    threeOpacity.addEventListener('input', changeThreeOP);
    textOpacity.addEventListener('input', changeTextOP);
    aboutIcon.addEventListener('click', aboutUI);

    //폰트 사이즈
    textSize.value = window.innerWidth <= 900 ? 36 : 100;
    textSize.addEventListener('input', changeTextSize);
    initTextSize();

    document.addEventListener('focusout', function() {
        window.scrollTo(0, 0);
    });
    document.getElementById('iframe').addEventListener('focusout', function() {
        window.scrollTo(0, 0);
    });
});

function underHeight750() {
    if (window.innerHeight < 750) {
        headline.forEach(el => {
            el.style.fontSize = '26px';
        });
        content.forEach(el => {
            el.style.fontSize = '17px';
        });
        hyperlink.forEach(el => {
            el.style.fontSize = '14px';
            el.style.lineHeight = '1.6';
        });
        aboutContent.forEach(el => {
            el.style.margin = '20px 0px 10px 0px';
        });
        iconText.style.fontSize = '14px';
        iconText.style.margin = '10px 0px 20px 0px';
    } else if ( window.innerHeight >= 750 && window.innerWidth <= 900 ) {
        headline.forEach(el => {
            el.style.fontSize = '36px';
        });
        content.forEach(el => {
            el.style.fontSize = '20px';
        });
        hyperlink.forEach(el => {
            el.style.fontSize = '15px';
            el.style.lineHeight = '1.6';
        });
        aboutContent.forEach(el => {
            el.style.margin = '60px 0px 20px 0px';
        });
        iconText.style.fontSize = '16px';
        iconText.style.margin = '20px 0px 40px 0px';
    } else if ( window.innerHeight >= 750 && window.innerWidth > 900 ) {
        headline.forEach(el => {
            el.style.fontSize = '72px';
        });
        content.forEach(el => {
            el.style.fontSize = '24px';
            el.style.lineHeight = '1.56';
        });
        hyperlink.forEach(el => {
            el.style.fontSize = '18px';
            el.style.lineHeight = '1.54';
        });
        aboutContent.forEach(el => {
            el.style.margin = '60px 0px 20px 0px';
        });
        iconText.style.fontSize = '16px';
        iconText.style.margin = '20px 0px 40px 0px';
    }
};

function changeTheme() {
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
        imgBtn.forEach(el => {
            el.style.backgroundColor = '#ffffff';
            el.style.color = 'black';
        });
        dayNight.src = 'sources/icon/ICON_dayMode.svg';
        random.src = 'sources/icon/ICON_ranNight.svg';
        minusCnt.src = 'sources/icon/ICON_minusNight.svg';
        cube.src = 'sources/icon/ICON_cntNight.svg';
        plusCnt.src = 'sources/icon/ICON_plusNight.svg';
        saveImg.src = 'sources/icon/ICON_imgNight.svg';
        settings.src = 'sources/icon/ICON_settingNight.svg';
        rangeInput.forEach(el => el.style.accentColor = 'white');
        num.style.color = 'white';
        num.style.fontWeight = '700';
        aboutIcon.src = 'sources/icon/ICON_aboutNight.svg';

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
        imgBtn.forEach(el => {
            el.style.backgroundColor = '#111111';
            el.style.color = 'white';
        });
        dayNight.src = 'sources/icon/ICON_nightMode.svg';
        random.src = 'sources/icon/ICON_ranDay.svg';
        minusCnt.src = 'sources/icon/ICON_minusDay.svg';
        cube.src = 'sources/icon/ICON_cntDay.svg';
        plusCnt.src = 'sources/icon/ICON_plusDay.svg';
        saveImg.src = 'sources/icon/ICON_imgDay.svg';
        settings.src = 'sources/icon/ICON_settingDay.svg';
        rangeInput.forEach(el => el.style.accentColor = '#111111');
        num.style.color = '#111111';
        num.style.fontWeight = '800';
        aboutIcon.src = 'sources/icon/ICON_aboutDay.svg';

        isNight = true;
    }
};

function randomToggle() {
    if (isranChecked === true) {
        random.style.opacity = 0.3;
        isranChecked = false;
    } else {
        random.style.opacity = 1.0;
        isranChecked = true;
    }
}

function openSettings() {
    if ( isSettingsOff === true ) {
        controlPanel.style.display = 'flex';
        setCircle.style.display = 'block';
        isSettingsOff = false;
    } else {
        controlPanel.style.display = 'none';
        setCircle.style.display ='none';
        isSettingsOff = true;
    }
};

function changeThreeOP() {
    let opacityValue = threeOpacity.value / 10;
    threeCanvas.style.opacity = opacityValue;

    const threeOpacityText = document.getElementById('threeOpacityText')
    threeOpacityText.innerHTML = (opacityValue * 100) + '%';
    
    if (opacityValue == 0) {
        threeCanvas.style.display = 'none';
    } else {
        threeCanvas.style.display = 'block';
    }
};

function changeTextOP() {
    let opacityValue = textOpacity.value / 10;
    bezierCanvas.style.opacity = opacityValue;
    boundBox.style.opacity = opacityValue;
    textInput.style.opacity = opacityValue;

    const textOpacityText = document.getElementById('textOpacityText')
    textOpacityText.innerHTML = (opacityValue * 100) + '%';
};

function changeTextSize() {
    boundBox.style.fontSize = textSize.value + 'pt';
    document.querySelectorAll('.textCircle').forEach(el => {
        el.style.transform = window.innerWidth <= 900 ?
        'translate(5px,' + 
        (26 - (( 36 - textSize.value ) * 0.84)) 
        + 'px)' :
        'translateY(' + 
        (80 - (( 100 - textSize.value ) * 0.9)) 
        + 'px)'
    });
    if (textSize.value > 90){
        boundBox.style.letterSpacing = '-3px'
    } else {
        boundBox.style.letterSpacing = '0px'
    }
    textSizeText.innerHTML = textSize.value + 'pt';
}

function initTextSize() {
    if (window.innerWidth > 900) {
        textSize.max = 150;
        textSize.min = 25;
        if (textSize.value > 150 || textSize.value < 25) {
            textSize.value = 100;
        }
    } else {
        textSize.max = 56;
        textSize.min = 18;
        if (textSize.value > 56 || textSize.value < 18) {
            textSize.value = 36;
        }
    }
    changeTextSize(); //538px 57pt
}

function aboutUI() {
    if ( isAboutNone === true ) {
        aboutIcon.src = 'sources/icon/ICON_closeNight.svg';
        aboutDiv.style.display = 'flex';
        allWithoutAbout.style.filter = 'blur(3px)';
        isAboutNone = false;
    } else {
        if ( isNight === true ) {
            aboutIcon.src = 'sources/icon/ICON_aboutDay.svg';
        } else {
            aboutIcon.src = 'sources/icon/ICON_aboutNight.svg';
        }
        aboutDiv.style.display = 'none';
        allWithoutAbout.style.filter = 'blur(0px)';
        isAboutNone = true;
    }
}
