function adminLogin(event) {
  event.preventDefault();
  const getEmail = document.getElementById('adminEmail').value;
  const getPassword = document.getElementById('adminPassword').value;

  if (getEmail === '' || getPassword === '') {
    Swal.fire({
      icon: 'info',
      text: 'All fields are required!',
      confirmButtonColor: "#2D85DE"
    })
    // spinItem.style.display = "none";
    return;
  }

  else {
         const signData = {
            email: getEmail,
            password: getPassword
        }
     
        // request method
        const signMethod = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(signData)
        }
        // endpoint
        const url = 'http://localhost:3001/amazon/document/api/login';
        // callimg the api
        fetch(url, signMethod)
        .then(response => response.json())
        .then(result => {
            console.log(result)
           
           console.log(result)
            if (result.success || result.token ) {
                localStorage.setItem("key", result.token)
                localStorage.setItem("customerloginid", result._id)
                const currentId = localStorage.getItem('customerloginid')
                const previousId = localStorage.getItem('customerid')

                if( previousId !== currentId) {
                    Swal.fire({
                    icon: 'info',
                    text: `Youre Logging In With a Different Account`,
                    confirmButtonColor: "#2D85DE"
                })
                setTimeout(() => {
                    
                }, 1000)
                }

                Swal.fire({
                    icon: 'success',
                    text: `Login Sucessful`,
                    confirmButtonColor: "#2D85DE"
                })
                setTimeout(() => {
                    location.href = "dashboard.html";
                }, 3000)
                localStorage.setItem("customerid", currentId );
            }
            else {
                Swal.fire({
                    icon: 'info',
                    text: result.message || 'Registration Failed',
                    confirmButtonColor: "#2D85DE"
                })
                spinItem.style.display = "none";
            }
        })
        .catch(error => {
            console.log('error', error)
            Swal.fire({
                icon: 'info',
                text: `Something Went wrong, Try Again`,
                confirmButtonColor: "#2D85DE"
            })
            spinItem.style.display = "none";
        });
    }

}


function addProducts(event) {
  event.preventDefault();

  const productName = document.getElementById('prodName').value;
  const productImage = document.getElementById('productImage').value; // ✅ fixed typo
  const productDescription = document.getElementById('prodDecsription').value;
  const productPrice = document.getElementById('prodPrice').value;
  const productInStock = document.getElementById('prodStock').value;

  if (!productName || !productImage || !productDescription || !productPrice || !productInStock) {
    Swal.fire({
      icon: 'info',
      text: 'All fields are required!',
      confirmButtonColor: "#2D85DE"
    });
    return;
  }

  const token = localStorage.getItem("key");

  fetch("http://localhost:3001/amazon/document/api/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      name: productName,
      image: productImage,
      price: productPrice,
      description: productDescription,
      numberInStock: parseInt(productInStock, 10)
    })
  })
    .then(res => res.json())
    .then(result => {
      console.log(result);
      if (result._id) {
        localStorage.setItem("prodId", result._id)
        Swal.fire({
            icon: 'success',
            title: "Import Successful",
            text: `Added new products to your store`,
            confirmButtonColor: "#00A859"
        })
        setTimeout(() => {
          location.reload();
        }, 4000)
      }
    })
    .catch(err => {
      console.error("❌ Error creating product:", err);
    });
}

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


function createCategory(event) {
  event.preventDefault();

  const spinItem = document.querySelector('.spin2');
  spinItem.style.display = "inline-block";

  const catName = document.getElementById('cat').value;

  if (catName === '') {
    Swal.fire({
      icon: 'info',
      text: 'All fields are required!',
      confirmButtonColor: "#2D85DE"
    });
    return;
  }
  spinItem.style.display = "none";

  const token = localStorage.getItem("key");

  fetch("http://localhost:3001/amazon/document/api/categories", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-auth-token": token
    },
    body: JSON.stringify({
      name: catName,
    })
  })
    .then(res => res.json())
    .then(result => {
      console.log(result);
      if (result._id) {
        localStorage.setItem("catId", result._id)
        Swal.fire({
            icon: 'success',
            title: "Created successfully",
            text: `Added new Category to your store`,
            confirmButtonColor: "#00A859"
        })
        setTimeout(() => {
          location.reload();
        }, 4000)
      }
    })
    .catch(err => {
      console.error("❌ Error creating product:", err);
    });
}

// function createCategory(event) {
//   event.preventDefault();

//   const spinItem = document.querySelector('.spin2');
//   if (spinItem) spinItem.style.display = "inline-block";

//   const catName = document.getElementById('cat').value.trim();

//   if (!catName) {
//     Swal.fire({
//       icon: 'info',
//       text: 'All fields are required!',
//       confirmButtonColor: "#2D85DE"
//     });
//     return;
    
//   }
//   spinItem.style.display = "none";

//   const token = localStorage.getItem("key");

//   fetch("http://localhost:3001/amazon/document/api/categories", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "x-auth-token": token
//     },
//     body: JSON.stringify({ name: catName })
//   })
//     .then(res => res.json().then(data => ({ status: res.status, body: data })))
//     .then(({ status, body }) => {
//       console.log(body);

//       if (status === 401 || status === 403) {
//         Swal.fire({
//           icon: 'error',
//           title: "Unauthorized",
//           text: body.message || "Only superadmins can create categories",
//           confirmButtonColor: "#E63946"
//         });
//         return;
//       }

//       if (body._id) {
//         localStorage.setItem("catId", body._id);
//         Swal.fire({
//           icon: 'success',
//           title: "Created successfully",
//           text: `Added new Category to your store`,
//           confirmButtonColor: "#00A859"
//         });
//         setTimeout(() => location.reload(), 3000);
//       }
//     })
//     .catch(err => {
//       console.error("❌ Error creating category:", err);
//       Swal.fire({
//         icon: 'error',
//         title: "Oops!",
//         text: "Something went wrong while creating category.",
//         confirmButtonColor: "#E63946"
//       });
//     })
//     .finally(() => {
//       if (spinItem) spinItem.style.display = "none";
//     });
// }



async function loadCategories() {
  try {
    const response = await fetch("http://localhost:3001/amazon/document/api/categories"); 
    if (!response.ok) throw new Error("Failed to fetch categories");

    const categories = await response.json(); 
    const select = document.getElementById("categorySelect");

    // Clear old options (except first one)
    select.innerHTML = `<option value="">-- Select a Category --</option>`;

    categories.forEach(category => {
      const option = document.createElement("option");
      option.value = category._id;  // assuming your API returns MongoDB _id
      option.textContent = category.name; // or category.title depending on schema
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading categories:", error);
  }
}
document.addEventListener("DOMContentLoaded", loadCategories);

