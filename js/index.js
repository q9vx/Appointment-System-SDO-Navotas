document.addEventListener("DOMContentLoaded", () => {
const navbar = document.querySelector("nav");

document.addEventListener("scroll", () => {
if (window.scrollY > 50) {
navbar.classList.add("scrolled");
} else {
navbar.classList.remove("scrolled");
}
});

function maximizeHeroImage() {
  const heroImg = document.querySelector('.hero-img');
  if (!heroImg) return;
  if (window.innerWidth <= 768) {
    heroImg.style.position = 'fixed';
    heroImg.style.top = '0';
    heroImg.style.left = '0';
    heroImg.style.width = '100vw';
    heroImg.style.height = '100vh';
    heroImg.style.objectFit = 'cover';
    heroImg.style.zIndex = '-1';
  } else {
    heroImg.style.position = '';
    heroImg.style.top = '';
    heroImg.style.left = '';
    heroImg.style.width = '';
    heroImg.style.height = '';
    heroImg.style.objectFit = '';
    heroImg.style.zIndex = '';
  }
}

window.addEventListener('resize', maximizeHeroImage);
maximizeHeroImage();
});
