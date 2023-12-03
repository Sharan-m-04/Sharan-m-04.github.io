// Home background paralax effect

var getParallaxContainer = document.querySelector(".home-background");
// var getParallaxContent = document.querySelector(".home-content");

getParallaxContainer.addEventListener("mousemove", function (e) {
    let x = e.pageX / window.innerWidth;
    let y = e.pageY / window.innerHeight;

    this.style.transform = `translate(${x * 2}%, ${y * 2}%)`;
    //   getParallaxContent.style.transform = `translate(${-x * 8}%, ${-y * 8}%)`;
});


// Home text typing effect
const carouselText = [
    { text: "Computer Science Student.", color: "black" },
    { text: "Web Developer.", color: "black" },
    { text: "UI/UX Designer.", color: "black" },
    { text: "Android Developer.", color: "black" }
]

$(document).ready(async function () {
    carousel(carouselText, "#feature-text")
});

async function typeSentence(sentence, eleRef, delay = 100) {
    const letters = sentence.split("");
    let i = 0;
    while (i < letters.length) {
        await waitForMs(delay);
        $(eleRef).append(letters[i]);
        i++;
    }
    return;
}

async function deleteSentence(eleRef) {
    const sentence = $(eleRef).html();
    const letters = sentence.split("");
    let i = 0;
    while (letters.length > 0) {
        await waitForMs(100);
        letters.pop();
        $(eleRef).html(letters.join(""));
    }
}

async function carousel(carouselList, eleRef) {
    var i = 0;
    while (true) {
        updateFontColor(eleRef, carouselList[i].color)
        await typeSentence(carouselList[i].text, eleRef);
        await waitForMs(1500);
        await deleteSentence(eleRef);
        await waitForMs(500);
        i++;
        if (i >= carouselList.length) { i = 0; }
    }
}

function updateFontColor(eleRef, color) {
    $(eleRef).css('color', color);
}

function waitForMs(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

//Home: Download Button
function resumeBtn() {
    window.location.href = "/Downloads/Sharan's Resume.pdf";
}