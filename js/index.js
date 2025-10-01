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
              const tokenParts = result.token.split(".");
              const payload = JSON.parse(atob(tokenParts[1])); // contains _id, role

              console.log("Decoded payload:", payload);
              // console.log("Decoded User:", req.user);


                 // ✅ check role before allowing login
        if (payload.role === "super_admin" ) {
            // save token + ids in localStorage
            localStorage.setItem("key", result.token);
            localStorage.setItem("customerloginid", result._id);

            const currentId = localStorage.getItem('customerloginid');
            const previousId = localStorage.getItem('customerid');

            if (previousId && previousId !== currentId) {
                Swal.fire({
                    icon: 'info',
                    text: `You’re logging in with a different account`,
                    confirmButtonColor: "#2D85DE"
                });
            }

            Swal.fire({
                icon: 'success',
                text: `Login Successful`,
                confirmButtonColor: "#2D85DE"
            });

            // save permanent customer id
            localStorage.setItem("customerid", currentId);

            // ✅ redirect distributor / super_admin to dashboard
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 2000);

        } else {
            // ❌ role not allowed
            Swal.fire({
                icon: 'error',
                text: 'Access denied: Only Super Admins can login here ',
                confirmButtonColor: "#2D85DE"
            });
            spinItem.style.display = "none";
        }

    } else {
        Swal.fire({
            icon: 'info',
            text: result.message || 'Login Failed',
            confirmButtonColor: "#2D85DE"
        });
        spinItem.style.display = "none";
    }
})
    }

}


// function addProducts(event) {
//   event.preventDefault();

//   const productName = document.getElementById('prodName').value;
//   const productImage = document.getElementById('productImage').value; // ✅ fixed typo
//   const productDescription = document.getElementById('prodDecsription').value;
//   const productPrice = document.getElementById('prodPrice').value;
//   const productInStock = document.getElementById('prodStock').value;
//   const productCategory = document.getElementById('categorySelect').value;

//   if (!productName || !productImage || !productDescription || !productPrice || !productInStock || !productCategory) {
//     Swal.fire({
//       icon: 'info',
//       text: 'All fields are required!',
//       confirmButtonColor: "#2D85DE"
//     });
//     return;
//   }

//   const token = localStorage.getItem("key");

//   fetch("http://localhost:3001/amazon/document/api/products", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "Authorization": `Bearer ${token}`
//     },
//     body: JSON.stringify({
//       name: productName,
//       image: productImage,
//       price: productPrice,
//       description: productDescription,
//       numberInStock: parseInt(productInStock, 10),
//       categoryId: productCategory
//     })
//   })
//     .then(res => res.json())
//     .then(result => {
//       console.log(result);
//       if (result._id) {
//         localStorage.setItem("prodId", result._id)
//         Swal.fire({
//             icon: 'success',
//             title: "Import Successful",
//             text: `Added new products to your store`,
//             confirmButtonColor: "#00A859"
//         })
//         setTimeout(() => {
//           location.reload();
//         }, 4000)
//       }
//     })
//     .catch(err => {
//       console.error("❌ Error creating product:", err);
//     });
// }

function addProducts(event) {
  event.preventDefault();

  const productName = document.getElementById('prodName').value;
  const productImage = document.getElementById('productImage').value; 
  const productDescription = document.getElementById('prodDecsription').value;
  const productPrice = document.getElementById('prodPrice').value;
  const productInStock = document.getElementById('prodStock').value;
  const productVariety = document.getElementById('variety').value;
  const productBenefits = document.getElementById('benefits').value;
  const productIngredients = document.getElementById('ingredients').value;
  const productCategory = document.getElementById('categorySelect').value;

  if (!productName || !productImage || !productDescription || !productPrice || !productInStock || !productCategory || !productVariety || !productBenefits || !productIngredients) {
    Swal.fire({
      icon: 'info',
      text: 'All fields are required!',
      confirmButtonColor: "#2D85DE"
    });
    return;
  }

  const productImages = productImage.split(",").map(i => i.trim()).filter(i => i);
  const productIngredientsArr = productIngredients.split(",").map(i => i.trim()).filter(i => i);
  const productVarietyArr = productVariety.split(",").map(i => i.trim()).filter(i => i);
  

  const token = localStorage.getItem("key");
  if (!token) {
    Swal.fire({
      icon: 'error',
      text: 'You must be logged in as Super Admin to add products',
      confirmButtonColor: "#2D85DE"
    });
    return;
  }

  // ✅ Decode token payload (role check)
  const tokenParts = token.split(".");
  const payload = JSON.parse(atob(tokenParts[1]));

  if (payload.role !== "super_admin") {
    Swal.fire({
      icon: 'error',
      text: 'Access denied: Only Super Admins can add products',
      confirmButtonColor: "#2D85DE"
    });
    return;
  }

  // ✅ Now allow product creation
  fetch("http://localhost:3001/amazon/document/api/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      name: productName,
      image: productImages,
      price: productPrice,
      description: productDescription,
      numberInStock: parseInt(productInStock, 10),
      categoryId: productCategory,
      variety: productVarietyArr,
      benefits: productBenefits,
      ingredients: productIngredientsArr
    })
  })
    .then(res => res.json())
    .then(result => {
      console.log(result);
      if (result._id) {
        localStorage.setItem("prodId", result._id);
        Swal.fire({
          icon: 'success',
          title: "Import Successful",
          text: `Added new product to your store`,
          confirmButtonColor: "#00A859"
        });
        setTimeout(() => {
          location.reload();
        }, 4000);
      } else {
        Swal.fire({
          icon: 'error',
          text: result.message || "Failed to add product",
          confirmButtonColor: "#2D85DE"
        });
      }
    })
    .catch(err => {
      console.error("❌ Error creating product:", err);
      Swal.fire({
        icon: 'error',
        text: "Server error while creating product",
        confirmButtonColor: "#2D85DE"
      });
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
       spinItem.style.display = "none";
        return;
  }

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

function updateCategory(id, newName) {
  const token = localStorage.getItem("key");

  fetch(`http://localhost:3001/amazon/document/api/categories/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-auth-token": token
    },
    body: JSON.stringify({ name: newName })
  })
    .then(res => res.json())
    .then(result => {
      console.log("Updated:", result);
      Swal.fire({
        icon: "success",
        title: "Updated successfully",
        text: `Category renamed to ${result.name}`,
        confirmButtonColor: "#00A859"
      });
    })
    .catch(err => {
      console.error("❌ Error updating category:", err);
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





function logOut() {
  Swal.fire({
    title: 'Are you sure?',
    text: "You will be logged out of your account.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085D6',
    confirmButtonText: 'Yes, log me out',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      // :siren: Clear stored login data
      localStorage.removeItem("key");
      localStorage.removeItem("role");
      localStorage.removeItem("customerid");
      localStorage.removeItem("customerloginid");
      Swal.fire({
        icon: 'success',
        title: 'Logged out',
        text: 'You have been successfully logged out.',
        confirmButtonColor: '#28A745'
      }).then(() => {
        location.href = "index.html"; // redirect to login page
      });
    }
  });
}







  // Bootstrap modal instances
  // const updateModal = new bootstrap.Modal(document.getElementById("updateModal"));
  // const deleteModal = new bootstrap.Modal(document.getElementById("deleteModal"));

  // // Handle Update button click
  // document.addEventListener("click", (e) => {
  //   if (e.target.classList.contains("update-btn")) {
  //     const id = e.target.dataset.id;
  //     const product = products.find(p => p._id === id);

  //     if (!product) return;

  //     // Prefill form
  //     document.getElementById("updateProductId").value = product._id;
  //     document.getElementById("updateName").value = product.name;
  //     document.getElementById("updatePrice").value = product.price;
  //     document.getElementById("updateStock").value = product.numberInStock;
  //     document.getElementById("updateCategory").value = product.category?.name || "";
  //     document.getElementById("updateDescription").value = product.description;
  //     document.getElementById("updateImages").value = product.image?.join(", ") || "";
  //     document.getElementById("updateVariety").value = product.variety?.join(", ") || "";
  //     document.getElementById("updateBenefits").value = product.benefits || "";
  //     document.getElementById("updateIngredients").value = product.ingredients?.join(", ") || "";

  //     updateModal.show();
  //   }
  // });

  // // Submit Update form
  // document.getElementById("updateForm").addEventListener("submit", async (e) => {
  //   e.preventDefault();
  //   const id = document.getElementById("updateProductId").value;
  //   const token = localStorage.getItem("key");

  //   try {
  //     const res = await fetch(`http://localhost:3001/amazon/document/api/products/${id}`, {
  //       method: "PUT",
  //       headers: {
  //         "Content-Type": "application/json",
  //         "Authorization": `Bearer ${token}`
  //       },
  //       body: JSON.stringify({
  //         name: document.getElementById("updateName").value,
  //         price: parseFloat(document.getElementById("updatePrice").value),
  //         numberInStock: parseInt(document.getElementById("updateStock").value, 10),
  //         description: document.getElementById("updateDescription").value,
  //         category: document.getElementById("updateCategory").value,
  //         image: document.getElementById("updateImages").value.split(",").map(i => i.trim()).filter(i => i),
  //         variety: document.getElementById("updateVariety").value.split(",").map(v => v.trim()).filter(v => v),
  //         benefits: document.getElementById("updateBenefits").value,
  //         ingredients: document.getElementById("updateIngredients").value.split(",").map(i => i.trim()).filter(i => i)
  //       })
  //     });
  //     const result = await res.json();

  //     if (result._id) {
  //       Swal.fire({ icon: "success", text: "Product updated successfully!" });
  //       updateModal.hide();
  //       fetchProducts(); // refresh table
  //     } else {
  //       Swal.fire({ icon: "error", text: result.message || "Failed to update product" });
  //     }
  //   } catch (err) {
  //     console.error(err);
  //     Swal.fire({ icon: "error", text: "Server error during update" });
  //   }
  // });

  // // Handle Delete button click
  // document.addEventListener("click", (e) => {
  //   if (e.target.classList.contains("delete-btn")) {
  //     const id = e.target.dataset.id;
  //     const product = products.find(p => p._id === id);

  //     if (!product) return;

  //     document.getElementById("deleteProductId").value = product._id;
  //     document.getElementById("deleteMessage").innerText =
  //       `Are you sure you want to delete "${product.name}"?`;

  //     deleteModal.show();
  //   }
  // });

  // // Confirm Delete
  // document.getElementById("confirmDelete").addEventListener("click", async () => {
  //   const id = document.getElementById("deleteProductId").value;
  //   const token = localStorage.getItem("key");

  //   try {
  //     const res = await fetch(`http://localhost:3001/amazon/document/api/products/${id}`, {
  //       method: "DELETE",
  //       headers: { "Authorization": `Bearer ${token}` }
  //     });
  //     const result = await res.json();

  //     if (result.success) {
  //       Swal.fire({ icon: "success", text: "Product deleted successfully!" });
  //       deleteModal.hide();
  //       products = products.filter(p => p._id !== id);
  //       filteredProducts = filteredProducts.filter(p => p._id !== id);
  //       renderTable();
  //     } else {
  //       Swal.fire({ icon: "error", text: result.message || "Failed to delete product" });
  //     }
  //   } catch (err) {
  //     console.error(err);
  //     Swal.fire({ icon: "error", text: "Server error during deletion" });
  //   }
  // });
