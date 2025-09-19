document.addEventListener("DOMContentLoaded", () => {
const navbar = document.querySelector("nav");

document.addEventListener("scroll", () => {
if (window.scrollY > 50) {
navbar.classList.add("scrolled");
} else {
navbar.classList.remove("scrolled");
}
});
});
