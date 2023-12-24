//Navigation Burgur

burger = document.querySelector('.burger');
navig = document.querySelector('.navig');
navul = document.querySelector('.navul');

burger.addEventListener('click', () => {
    navig.classList.toggle('h-nav-resp');
    navul.classList.toggle('v-class-resp');
    // setTimeout(()=> {
    // navul.classList.toggle('v-class-resp');
    // } , 150);
});

// Home: paralax effect

var getParallaxContainer = document.querySelector(".home-background");
// var getParallaxContent = document.querySelector(".home-content");

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
            // getParallaxContent.style.transform = `translate(${-x * 8}%, ${-y * 8}%)`;
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
    window.location.href = "/Downloads/Sharan's Resume.pdf";
}

//About: Contact Button

function contactBtn() {
    window.location.href = "#contact-me";
}

//About: Scroll Animation

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
