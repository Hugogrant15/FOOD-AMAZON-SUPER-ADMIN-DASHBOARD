 function toggleNotification(event) {
    event.preventDefault();
    const notificationPopUp = document.getElementById('notificationPopUp');
    // notificationPopUp.style.display = "block";

    if (notificationPopUp.style.display === 'none' || notificationPopUp.style.display === '') {
        notificationPopUp.style.display = 'block';
    } else {
        notificationPopUp.style.display = 'none';
    }
}

const searchInput = document.getElementById("searchInput");
const searchIcon = document.querySelector(".search-icon");

searchIcon.addEventListener("click", () => {
  if (window.innerWidth < 768) { // only apply expand/collapse on small screens
    searchInput.classList.toggle("show");
    if (searchInput.classList.contains("show")) {
      searchInput.focus();
    }
  }
});



