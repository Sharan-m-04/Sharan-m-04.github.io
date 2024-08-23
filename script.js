//Return to top

let rToTop = document.getElementById("rToTop");

window.onscroll = function () {
    scrollFunction();
};

function scrollFunction() {
    if (document.body.scrollTop > 50 || document.documentElement.scrollTop > 50) {
        rToTop.style.display = "block";
    }
    else {
        rToTop.style.display = "none";
    }
}

rToTop.addEventListener("click", backToTop);
function backToTop() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}

//Navigation Burgur

burger = document.querySelector('.burger');
navig = document.querySelector('.navig');
navul = document.querySelector('.navul');

burger.addEventListener('click', () => {
    navig.classList.toggle('h-nav-resp');
    navul.classList.toggle('v-class-resp');
});

// Navigation: Profile button

function profileBtn() {
    window.location.href = "https://sharan-m-04.github.io/";
}

// Home: paralax effect

var getParallaxContainer = document.querySelector(".home-background");

function handleMousemove() {
    var maxWidth = 906;

    if (window.innerWidth <= maxWidth) {
        getParallaxContainer.addEventListener("mousemove", function (e) {
            let x = e.pageX / window.innerWidth;
            let y = e.pageY / window.innerHeight;

            this.style.transform = `translate(${0}%, ${0}%)`;
        });
    } else {
        getParallaxContainer.addEventListener("mousemove", function (e) {
            let x = e.pageX / window.innerWidth;
            let y = e.pageY / window.innerHeight;

            this.style.transform = `translate(${x * 2}%, ${y * 2}%)`;
        });
    }
}
handleMousemove();
window.addEventListener('resize', handleMousemove);


// Home: Typing effect

var TxtType = function (el, toRotate, period) {
    this.toRotate = toRotate;
    this.el = el;
    this.loopNum = 0;
    this.period = parseInt(period, 10) || 2000;
    this.txt = '';
    this.tick();
    this.isDeleting = false;
};

TxtType.prototype.tick = function () {
    var i = this.loopNum % this.toRotate.length;
    var fullTxt = this.toRotate[i];

    if (this.isDeleting) {
        this.txt = fullTxt.substring(0, this.txt.length - 1);
    } else {
        this.txt = fullTxt.substring(0, this.txt.length + 1);
    }

    this.el.innerHTML = '<span class="wrap">' + this.txt + '</span>';

    var that = this;
    var delta = 200 - Math.random() * 100;

    if (this.isDeleting) { delta /= 2; }

    if (!this.isDeleting && this.txt === fullTxt) {
        delta = this.period;
        this.isDeleting = true;
    } else if (this.isDeleting && this.txt === '') {
        this.isDeleting = false;
        this.loopNum++;
        delta = 500;
    }

    setTimeout(function () {
        that.tick();
    }, delta);
};

window.onload = function () {
    var elements = document.getElementsByClassName('typewrite');
    for (var i = 0; i < elements.length; i++) {
        var toRotate = elements[i].getAttribute('data-type');
        var period = elements[i].getAttribute('data-period');
        if (toRotate) {
            new TxtType(elements[i], JSON.parse(toRotate), period);
        }
    }
    var css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML = ".typewrite > .wrap { border-right: 2px solid #000;}";
    document.body.appendChild(css);
};

//Home: Download Button

function resumeBtn() {
    window.location.href = "/Downloads/SharanResume.pdf";
}

//About: Contact Button

function contactBtn() {
    window.location.href = "#contact-me";
}

//Project: Open Projects

function inventoryProject() {
    window.open(
        "https://github.com/Sharan-m-04/Inventory-Management-System", "_blank");
}

function ignytBeerStationProject() {
    window.open(
        "https://github.com/Sharan-m-04/Ignyt-Beer-Station", "_blank");
}

function portfolioProject() {
    window.open(
        "https://github.com/Sharan-m-04/Sharan-m-04.github.io", "_blank");
}

function BMIcalcProject() {
    window.open(
        "https://github.com/Sharan-m-04/BMI-Calculator", "_blank");
}

function CATexamEvaluationSystemProject() {
    window.open(
        "https://github.com/Sharan-m-04/CAT-Exam-Evaluation-System", "_blank");
}

function PDFmergerProject() {
    window.open(
        "https://github.com/Sharan-m-04/PDF-Merger", "_blank");
}

function DigitalStenoProject() {
    window.open(
        "https://github.com/Sharan-m-04/Digital_Steno", "_blank");
}

function SkeezyProject() {
    window.open(
        "https://www.figma.com/file/GalviVgIyYuSJoSV6ezBDs/Hackathon-22", "_blank");
}

//Skills: Category Filter

filterSelection("all")
function filterSelection(c) {
    var x, i;
    x = document.getElementsByClassName("skill-card");
    if (c == "all") c = "";
    for (i = 0; i < x.length; i++) {
        RemoveClass(x[i], "show");
        if (x[i].className.indexOf(c) > -1) AddClass(x[i], "show");
    }
}

function AddClass(element, name) {
    var i, arr1, arr2;
    arr1 = element.className.split(" ");
    arr2 = name.split(" ");
    for (i = 0; i < arr2.length; i++) {
        if (arr1.indexOf(arr2[i]) == -1) { element.className += " " + arr2[i]; }
    }
}

function RemoveClass(element, name) {
    var i, arr1, arr2;
    arr1 = element.className.split(" ");
    arr2 = name.split(" ");
    for (i = 0; i < arr2.length; i++) {
        while (arr1.indexOf(arr2[i]) > -1) {
            arr1.splice(arr1.indexOf(arr2[i]), 1);
        }
    }
    element.className = arr1.join(" ");
}

var btnContainer = document.getElementById("skill-chips-div");
var btns = btnContainer.getElementsByClassName("skill-chip");
for (var i = 0; i < btns.length; i++) {
    btns[i].addEventListener("click", function (event) {
        var current = btnContainer.getElementsByClassName("active");
        for (var j = 0; j < current.length; j++) {
            current[j].classList.remove("active");
        }
        event.target.classList.add("active");
    });
}

//Awards: Opening image in new tab

function TechKritiCertificate() {
    const show_certificate0 = window.open("", "_blank");
    show_certificate0.document.write(`
        <html>
        <head>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #2f3030;
                }
                
                .certificate-img {
                    width: 694px;
                    height: 491px;
                    background: url('Images/techkritiCertificate.png');
                    background-size: cover;
                    background-repeat: no-repeat;
                    background-position: 50% 50%;
                    border-radius: 10px;
                }
            </style>
        </head>
        <body>
            <div class="certificate-img"></div>
        </body>
        </html>
    `);
}

function TechConnectCertificate() {
    const show_certificate1 = window.open("", "_blank");
    show_certificate1.document.write(`
        <html>
        <head>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #3662a9;
                }
                
                .certificate-img {
                    width: 694px;
                    height: 491px;
                    background: url('Images/TechConnectCertificate.jpg');
                    background-size: cover;
                    background-repeat: no-repeat;
                    background-position: 50% 50%;
                    border-radius: 10px;
                }
            </style>
        </head>
        <body>
            <div class="certificate-img"></div>
        </body>
        </html>
    `);
}

function CodeKazeCertificate() {
    const show_certificate2 = window.open("", "_blank");
    show_certificate2.document.write(`
        <html>
        <head>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #0b0c08;
                }
                
                .certificate-img {
                    width: 450px;
                    height: 800px;
                    background: url('Images/code-kaze-certificate.jpg');
                    background-size: cover;
                    background-repeat: no-repeat;
                    background-position: 50% 50%;
                    border-radius: 10px;
                }
            </style>
        </head>
        <body>
            <div class="certificate-img"></div>
        </body>
        </html>
    `);
}

function UI_UX_HackathonCertificate() {
    const show_certificate3 = window.open("", "_blank");
    show_certificate3.document.write(`
        <html>
        <head>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #14140f;
                }
                
                .certificate-img {
                    width: 444px;
                    height: 313px;
                    background: url('Images/ui-uxHackathonCertificate.jpg');
                    background-size: cover;
                    background-repeat: no-repeat;
                    background-position: 50% 50%;
                    border-radius: 10px;
                }
            </style>
        </head>
        <body>
            <div class="certificate-img"></div>
        </body>
        </html>
    `);
}

// Animations

// Pop Scroll Animation

function reveal() {
    var reveals = document.querySelectorAll(".reveal");

    for (var i = 0; i < reveals.length; i++) {
        var windowHeight = window.innerHeight;
        var elementTop = reveals[i].getBoundingClientRect().top;
        var elementVisible = 150;

        if (elementTop < windowHeight - elementVisible) {
            reveals[i].classList.add("active");
        } else {
            reveals[i].classList.remove("active");
        }
    }
}

window.addEventListener("scroll", reveal);


// Fade left Scroll Animation

function reveal_left() {
    var reveals = document.querySelectorAll(".reveal-left");

    for (var i = 0; i < reveals.length; i++) {
        var windowHeight = window.innerHeight;
        var elementTop = reveals[i].getBoundingClientRect().top;
        var elementVisible = 150;

        if (elementTop < windowHeight - elementVisible) {
            reveals[i].classList.add("active");
        } else {
            reveals[i].classList.remove("active");
        }
    }
}

window.addEventListener("scroll", reveal_left);

// Fade Right Scroll Animation

function reveal_right() {
    var reveals = document.querySelectorAll(".reveal-right");

    for (var i = 0; i < reveals.length; i++) {
        var windowHeight = window.innerHeight;
        var elementTop = reveals[i].getBoundingClientRect().top;
        var elementVisible = 150;

        if (elementTop < windowHeight - elementVisible) {
            reveals[i].classList.add("active");
        } else {
            reveals[i].classList.remove("active");
        }
    }
}

window.addEventListener("scroll", reveal_right);


// Normal Fade Scroll Animation

function normal_fade() {
    var reveals = document.querySelectorAll(".fade");

    for (var i = 0; i < reveals.length; i++) {
        var windowHeight = window.innerHeight;
        var elementTop = reveals[i].getBoundingClientRect().top;
        var elementVisible = 150;

        if (elementTop < windowHeight - elementVisible) {
            reveals[i].classList.add("active");
        } else {
            reveals[i].classList.remove("active");
        }
    }
}

window.addEventListener("scroll", normal_fade);

