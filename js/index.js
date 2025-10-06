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

// UPDATE AND DELETE PRODUCTS API
document.addEventListener("DOMContentLoaded", () => {
const spinner = document.getElementById("loadingSpinner");
const tableBody = document.getElementById("productsTableBody");
const searchInput = document.getElementById("searchInput");
const pageSizeSelect = document.getElementById("pageSize");
const pagination = document.getElementById("pagination");

const updateModal = new bootstrap.Modal(document.getElementById("updateModal"));
const deleteModal = new bootstrap.Modal(document.getElementById("deleteModal"));

let products = [];
let filteredProducts = [];
let currentPage = 1;
let pageSize = parseInt(pageSizeSelect.value);

// ------------------- Fetch Products -------------------
async function fetchProducts() {
    spinner.style.display = "block";
    const token = localStorage.getItem("key");
    if (!token) {
    Swal.fire({ icon: "error", text: "Unauthorized" });
    spinner.style.display = "none";
    return;
    }
    try {
    const res = await fetch("http://localhost:3001/amazon/document/api/products", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("Invalid response");
    products = data;
    filteredProducts = [...products];
    renderTable();
    } catch (e) {
    console.error(e);
    Swal.fire({ icon: "error", text: "Failed to load products" });
    } finally {
    spinner.style.display = "none";
    }
}

// ------------------- Render Table -------------------
function renderTable() {
    tableBody.innerHTML = "";
    const query = searchInput.value.toLowerCase();
    filteredProducts = products.filter(p => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query));
    const totalPages = Math.ceil(filteredProducts.length / pageSize);
    if (currentPage > totalPages) currentPage = totalPages || 1;
    const start = (currentPage - 1) * pageSize;
    const paginated = filteredProducts.slice(start, start + pageSize);

    paginated.forEach(p => {
    const firstImage = p.image?.[0] || "https://via.placeholder.com/50";
    const varietyBadges = (p.variety || []).map(v => `<span class="badge bg-info me-1">${v}</span>`).join("");
    const ingredientBadges = (p.ingredients || []).map(i => `<span class="badge bg-secondary me-1">${i}</span>`).join("");
    const row = `
        <tr>
        <td>${p.name}</td>
        <td><img src="${firstImage}" class="img-thumbnail" style="width:50px;height:50px;object-fit:cover;"></td>
        <td>${p.description}</td>
        <td class="text-center">₦${Number(p.price).toLocaleString("en-NG")}</td>
        <td>${p.numberInStock}</td>
        <td>${p.category?.name || "N/A"}</td>
        <td>${varietyBadges}</td>
        <td>${p.benefits || ""}</td>
        <td>${ingredientBadges}</td>
        <td>
            <button class="btn btn-sm btn-warning me-1 update-btn" data-id="${p._id}">Update</button>
            <button class="btn btn-sm btn-danger delete-btn" data-id="${p._id}">Delete</button>
        </td>
        </tr>`;
    tableBody.insertAdjacentHTML("beforeend", row);
    });

    renderPagination(Math.ceil(filteredProducts.length / pageSize));
}

// ------------------- Pagination -------------------
function renderPagination(totalPages) {
    pagination.innerHTML = "";
    if (totalPages <= 1) return;
    const prevDisabled = currentPage === 1 ? "disabled" : "";
    const nextDisabled = currentPage === totalPages ? "disabled" : "";
    pagination.insertAdjacentHTML("beforeend", `<li class="page-item ${prevDisabled}"><a class="page-link" href="#" onclick="changePage(${currentPage-1})">Previous</a></li>`);
    for (let i = 1; i <= totalPages; i++) {
    const active = i === currentPage ? "active" : "";
    pagination.insertAdjacentHTML("beforeend", `<li class="page-item ${active}"><a class="page-link" href="#" onclick="changePage(${i})">${i}</a></li>`);
    }
    pagination.insertAdjacentHTML("beforeend", `<li class="page-item ${nextDisabled}"><a class="page-link" href="#" onclick="changePage(${currentPage+1})">Next</a></li>`);
}
window.changePage = (page) => { if (page >= 1) { currentPage = page; renderTable(); } };
searchInput.addEventListener("input", () => { currentPage = 1; renderTable(); });
pageSizeSelect.addEventListener("change", () => { pageSize = parseInt(pageSizeSelect.value); currentPage = 1; renderTable(); });

// ------------------- Load Categories -------------------
async function loadCategories() {
    const categorySelect = document.getElementById("updateCategory");
    categorySelect.innerHTML = `<option value="">Select category</option>`;
    try {
    const token = localStorage.getItem("key");
    const res = await fetch("http://localhost:3001/amazon/document/api/categories", {
        headers: { Authorization: `Bearer ${token}` }
    });
    const categories = await res.json();
    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat._id;
        option.textContent = cat.name;
        categorySelect.appendChild(option);
    });
    } catch (err) {
    console.error(err);
    Swal.fire({ icon: "error", text: "Failed to load categories" });
    }
}

// ------------------- Update & Delete Button Logic -------------------
document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("update-btn")) {
    const id = e.target.dataset.id;
    const p = products.find(x => x._id === id);
    if (!p) return;

    document.getElementById("updateProductId").value = p._id;
    document.getElementById("updateName").value = p.name;
    document.getElementById("updatePrice").value = p.price;
    document.getElementById("updateStock").value = p.numberInStock;
    document.getElementById("updateDescription").value = p.description;
    document.getElementById("updateImages").value = p.image?.join(", ") || "";
    document.getElementById("updateVariety").value = p.variety?.join(", ") || "";
    document.getElementById("updateBenefits").value = p.benefits || "";
    document.getElementById("updateIngredients").value = p.ingredients?.join(",") || "";

    await loadCategories();
    document.getElementById("updateCategory").value = p.category?._id || "";

    updateModal.show();
    }

    if (e.target.classList.contains("delete-btn")) {
    const id = e.target.dataset.id;
    const p = products.find(x => x._id === id);
    if (!p) return;
    document.getElementById("deleteProductId").value = p._id;
    document.getElementById("deleteMessage").innerText = `Are you sure you want to delete "${p.name}"?`;
    deleteModal.show();
    }
});

// ------------------- Submit Update -------------------
// ------------------- Submit Update Form -------------------
document.getElementById("updateForm").addEventListener("submit", async e => {
    e.preventDefault();
    const id = document.getElementById("updateProductId").value;
    const token = localStorage.getItem("key");

    try {
        const res = await fetch(`http://localhost:3001/amazon/document/api/products/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                name: document.getElementById("updateName").value,
                price: document.getElementById("updatePrice").value.trim(),
                numberInStock: parseInt(document.getElementById("updateStock").value, 10),
                description: document.getElementById("updateDescription").value,
                categoryId: document.getElementById("updateCategory").value.trim(),  // ✅ send _id as categoryId
                image: document.getElementById("updateImages").value
                        .split(",")
                        .map(i => i.trim())
                        .filter(i => i),
                variety: document.getElementById("updateVariety").value
                        .split(",")
                        .map(i => i.trim())
                        .filter(i => i),
                benefits: document.getElementById("updateBenefits").value,
                ingredients: document.getElementById("updateIngredients").value
                        .split(",")
                        .map(i => i.trim())
                        .filter(i => i)
            })
        });

        const result = await res.json();

        if (result._id) {
            Swal.fire({ icon: "success", text: "Product updated!" });
            updateModal.hide();
            fetchProducts(); // refresh table
        } else {
            Swal.fire({ icon: "error", text: result.message || "Failed to update" });
        }
    } catch (err) {
        console.error(err);
        Swal.fire({ icon: "error", text: "Server error" });
    }
});


// ------------------- Confirm Delete -------------------
document.getElementById("confirmDelete").addEventListener("click", async () => {
    const id = document.getElementById("deleteProductId").value;
    const token = localStorage.getItem("key");
    try {
    const res = await fetch(`http://localhost:3001/amazon/document/api/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
    });
    const result = await res.json();
    if (res.ok) {
    Swal.fire({ icon: "success", text: "Deleted!" });
    deleteModal.hide();
    products = products.filter(p => p._id !== id);
    renderTable();
} else {
    const data = await res.json();
    Swal.fire({ icon: "error", text: data.message || "Failed to delete" });
}

    } catch (err) {
    console.error(err);
    Swal.fire({ icon: "error", text: "Server error" });
    }
});

fetchProducts();
});
    

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
  const catImg = document.getElementById('catImg').value;

  if (catName === '' || catImg === '') {
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
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      name: catName,
      image: catImg
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

// load categories API
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

// Fuction get all orders API(to Table)
async function loadOrders() {
  try {
    const res = await fetch("http://localhost:3001/amazon/document/api/orders");
    const orders = await res.json();
    const tbody = document.getElementById("ordersTableBody");
    tbody.innerHTML = "";
    if (!orders.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center">No orders found</td></tr>`;
      return;
    }
    orders.forEach(order => {
      const fullName = `${order.customerSnapshot?.firstName || ""} ${order.customerSnapshot?.lastName || ""}`.trim();
      const row = `
        <tr style="cursor:pointer" onclick="showOrderDetails(${JSON.stringify(order).replace(/"/g, '&quot;')})">
          <td>${order.transactionId || "N/A"}</td>
          <td>${new Date(order.createdAt).toLocaleString()}</td>
          <td>${fullName || "Unknown"}</td>
          <td>
            <span class="badge ${order.paymentStatus === "paid" ? "bg-success" : "bg-danger"}">
              ${order.paymentStatus}
            </span>
          </td>
          <td>
            <span class="badge ${order.deliveryStatus === "deliverd" ? "bg-success" : "bg-warning"}">
              ${order.deliveryStatus}
            </span>
          </td>
          <td>₦${order.totalAmount.toLocaleString()}</td>
        </tr>
      `;
      tbody.insertAdjacentHTML("beforeend", row);
    });
  } catch (err) {
    console.error("Error loading orders:", err);
  }
}

function showOrderDetails(order) {
  const fullName = `${order.customerSnapshot?.firstName || ""} ${order.customerSnapshot?.lastName || ""}`.trim();
  // Order items
  const itemsHtml = order.items.map(item => `
    <div class="col-md-6 mb-3">
      <div class="card card-one p-2">
        <img src="${item.image || 'https://via.placeholder.com/150'}" class="card-img-top rounded" style = "object-fit: cover; width: 100%; height: 272px;"  alt="${item.name}">
        <div class="card-body">
          <h6 class="card-title">${item.name}</h6>
         <div class= "d-flex  justify-content-between">
          <p>Quantity: ${item.quantity}</p>
          <p class="text-success fw-bold">₦${(item.price * item.quantity).toLocaleString()}</p>
         </div>
        </div>
      </div>
    </div>
  `).join("");
  const customer = order.customerSnapshot || {};
  const content = `
    <h5> #${order.transactionId}</h5>
    <div class="row">
      <div class="col-md-8">
        <div class="row">${itemsHtml}</div>
      </div>
      <div class="col-md-4">
        <div class="card p-3">
          <h6>Customer Information</h6>
          <img src="https://ui-avatars.com/api/?name=${fullName}" class="rounded-circle mb-2" width="100" height="100">
          <p><strong>${fullName}</strong></p>
          <p>${customer.email || ""}</p>
          <p>${customer.phone || ""}</p>
          <hr>
          <h6>Shipping Address</h6>
          <p>${customer.address || ""}, ${customer.city || ""}, ${customer.state || ""}</p>
        </div>
      </div>
    </div>
  `;
  document.getElementById("orderDetailsContent").innerHTML = content;
  new bootstrap.Modal(document.getElementById("orderDetailsModal")).show();
}
// Call function when page loads
document.addEventListener("DOMContentLoaded", loadOrders);






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







