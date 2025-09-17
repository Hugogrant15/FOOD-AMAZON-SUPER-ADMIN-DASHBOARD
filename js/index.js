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

// Small screen toggle
document.getElementById("searchBtn").addEventListener("click", function () {
  const input = document.getElementById("searchInput");
  input.classList.toggle("expanded");
  input.focus();
});
