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
            localStorage.setItem("role", payload.role);
            localStorage.setItem("name", result.name || "super_admin");

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
  event.stopPropagation(); // stop bubbling

  const isMobile = window.innerWidth < 768;
  const popup = document.getElementById(isMobile ? 'notificationPopUp1' : 'notificationPopUp');
  const otherPopup = document.getElementById(isMobile ? 'notificationPopUp' : 'notificationPopUp1');

  // Hide the other popup (if open)
  if (otherPopup) otherPopup.style.display = 'none';

  // Toggle visibility
  const isVisible = popup.style.display === 'block';
  popup.style.display = isVisible ? 'none' : 'block';

  // ✅ If it's just opened → mark notifications as seen
  if (!isVisible) {
    const badges = [
      document.getElementById("notificationBadge"),
      document.getElementById("notificationBadge1"),
    ];

    badges.forEach((badge) => {
      if (badge) badge.style.display = "none";
    });

    localStorage.setItem("lastSeenAdminOrderTime", new Date().toISOString());
  }
}

document.addEventListener("click", (e) => {
  if (!e.target.closest("#notificationPopUp") &&
      !e.target.closest("#notificationPopUp1") &&
      !e.target.closest(".btnSharp")) {
    document.getElementById("notificationPopUp").style.display = "none";
    document.getElementById("notificationPopUp1").style.display = "none";
  }
});



const searchInput = document.getElementById("searchInput");
const searchIcon = document.querySelector(".search-icon");

// searchIcon.addEventListener("click", () => {
//   if (window.innerWidth < 768) { // only apply expand/collapse on small screens
//     searchInput.classList.toggle("show");
//     if (searchInput.classList.contains("show")) {
//       searchInput.focus();
//     }
//   }
// });

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
    if (!select) return;

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

// async function loadCategories() {
//   try {
//     const response = await fetch("http://localhost:3001/amazon/document/api/categories"); 
//     if (!response.ok) throw new Error("Failed to fetch categories");

//     const categories = await response.json(); 
//     const select = document.getElementById("categorySelect");

//     if (!select) return; // 🔹 Prevent error if element not found

//     // Clear old options (except first one)
//     select.innerHTML = `<option value="">-- Select a Category --</option>`;

//     categories.forEach(category => {
//       const option = document.createElement("option");
//       option.value = category._id;  
//       option.textContent = category.name; 
//       select.appendChild(option);
//     });
//   } catch (error) {
//     console.error("Error loading categories:", error);
//   }
// }
// document.addEventListener("DOMContentLoaded", loadCategories);

// Fuction get all orders API(to Table)

document.addEventListener("DOMContentLoaded", async function () {
  async function loadOrders() {
    try {
      const res = await fetch("http://localhost:3001/amazon/document/api/orders");
      const orders = await res.json();
      const tbody = document.getElementById("ordersTableBody");
      if (!tbody) return; // guard if table not present

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

  // ✅ Run after DOM is ready
  loadOrders();
});



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

// LOAD TOP SELLING PRODUCTS BY UNIT SOLD API
document.addEventListener("DOMContentLoaded", () => {
  async function loadTopProducts() {
    try {
      const res = await fetch("http://localhost:3001/amazon/document/api/orders");
      if (!res.ok) throw new Error("Failed to fetch orders");
      const orders = await res.json();

      // Aggregate products
      const productMap = {};

      orders.forEach(order => {
        order.items?.forEach(item => {
          if (!productMap[item.name]) {
            productMap[item.name] = {
              name: item.name,
              price: item.price,
              image: item.image || "https://via.placeholder.com/50",
              units: 0
            };
          }
          productMap[item.name].units += item.quantity;
        });
      });

      // Sort by units sold (descending) & limit to top 5
      const topProducts = Object.values(productMap)
        .sort((a, b) => b.units - a.units)
        .slice(0, 5);

      // Render table
      const tbody = document.getElementById("topProductsBody");
      tbody.innerHTML = "";

      topProducts.forEach(p => {
        const row = `
          <tr>
            <td>
              <div class="d-flex align-items-center">
                <img src="${p.image}" alt="${p.name}" 
                     class="rounded me-2" 
                     style="width:40px; height:40px; object-fit:cover;">
                ${p.name}
              </div>
            </td>
            <td>₦${p.price.toLocaleString()}</td>
            <td>${p.units}</td>
          </tr>
        `;
        tbody.insertAdjacentHTML("beforeend", row);
      });

    } catch (err) {
      console.error("Error loading top products:", err);
    }
  }

  // Call function when DOM ready
  loadTopProducts();
});




// SHOW CURRENT ACTIVE PAGE IN SIDEBAR
document.addEventListener("DOMContentLoaded", () => {
  const currentPage = window.location.pathname.split("/").pop();
  const links = document.querySelectorAll(".sidebar .nav-link");

  links.forEach(link => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
    }
  });
});



// SHOW NOTIFICATIONS ON DASHBOARD 
let lastSeenAdminOrderTime = localStorage.getItem("lastSeenAdminOrderTime") 
  ? new Date(localStorage.getItem("lastSeenAdminOrderTime")) 
  : new Date(0);

document.addEventListener("DOMContentLoaded", () => {
  loadAllOrdersFeed();

  // ✅ Mark as seen when bell clicked
  document.body.addEventListener("click", (e) => {
    if (e.target.closest(".btnSharp")) {
      const badges = [
        document.getElementById("notificationBadge"),
        document.getElementById("notificationBadge1"),
      ];
      badges.forEach((badge) => {
        if (badge) badge.style.display = "none";
      });
      localStorage.setItem("lastSeenAdminOrderTime", new Date().toISOString());
    }
  });

  // 🔁 Auto-refresh every 30s
  setInterval(loadAllOrdersFeed, 30000);
});

async function loadAllOrdersFeed() {
  try {
    const res = await fetch("http://localhost:3001/amazon/document/api/orders");
    const orders = await res.json();

    // ✅ Sort newest → oldest
    const sortedOrders = orders.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const feeds = [
      document.getElementById("activityFeed"),
      document.getElementById("activityFeed1"),
    ];

    feeds.forEach((feed) => {
      if (!feed) return;
      feed.innerHTML = "";

      if (sortedOrders.length === 0) {
        feed.innerHTML = `<li class="text-muted text-center">No recent orders</li>`;
        return;
      }

      // ✅ Show 5 latest orders
      sortedOrders.slice(0, 5).forEach((order) => {
        const firstName = order.customerSnapshot?.firstName || "Unknown";
        const lastName = order.customerSnapshot?.lastName
          ? order.customerSnapshot.lastName.charAt(0) + "."
          : "";
        const city = order.customerSnapshot?.city || "N/A";
        const total = order.totalAmount
          ? order.totalAmount.toLocaleString()
          : "0";
        const payment = order.paymentStatus || "pending";
        const createdAt = new Date(order.createdAt);
        const timeAgo = formatTimeAgo(createdAt);

        const badgeClass =
          payment.toLowerCase() === "paid"
            ? "bg-success-subtle text-success"
            : payment.toLowerCase() === "failed"
            ? "bg-danger-subtle text-danger"
            : "bg-warning-subtle text-warning";

        const avatar = `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`;

        feed.insertAdjacentHTML(
          "beforeend",
          `
          <li class="d-flex align-items-center mb-3 border-bottom pb-2">
            <img src="${avatar}" class="rounded-circle me-3" width="40" height="40" alt="${firstName}">
            <div class="flex-grow-1">
              <div class="d-flex justify-content-between">
                <strong>${firstName} ${lastName}</strong>
                <small class="text-muted">${timeAgo}</small>
              </div>
              <div class="text-muted small">
                Ordered from <b>${city}</b> • ₦${total}
              </div>
            </div>
            <span class="badge rounded-pill ${badgeClass}">${payment}</span>
          </li>
          `
        );
      });

      // ✅ Footer
      feed.insertAdjacentHTML(
        "beforeend",
        `
        <li class="text-center mt-2">
          <button class="btn btn-success w-100 fw-semibold"
            onclick="window.location.href='notifications.html'">
            View all notifications
          </button>
        </li>
        `
      );
    });

    // ✅ Badge logic for unseen orders
    const newOrders = sortedOrders.filter(
      (o) => new Date(o.createdAt) > lastSeenAdminOrderTime
    );
    updateNotificationBadge(newOrders.length);
  } catch (err) {
    console.error("Error loading all orders feed:", err);
  }
}

// 🕒 Helper
function formatTimeAgo(date) {
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "min", seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1)
      return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

// 🔔 Update badge
function updateNotificationBadge(count) {
  const badges = [
    document.getElementById("notificationBadge"),
    document.getElementById("notificationBadge1"),
  ];

  badges.forEach((badge) => {
    if (!badge) return;
    if (count > 0) {
      badge.style.display = "inline-block";
      badge.textContent = count > 9 ? "9+" : count;
    } else {
      badge.style.display = "none";
    }
  });
}


// PASSWORD EYE ICON TOGGLE 
document.addEventListener("DOMContentLoaded", () => {
  const passwordInput = document.getElementById("adminPassword");
  const eyeIcon = document.getElementById("eyeicon");
  const toggleButton = document.querySelector(".signupAbsolute");

  if (!passwordInput || !eyeIcon || !toggleButton) return;

  toggleButton.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";

    // 🔥 Reset full class each time (prevents mismatch)
    eyeIcon.className = isPassword
      ? "fa-solid fa-eye"
      : "fa-solid fa-eye-slash";
  });
});

// LAST 7 DAYS CHART ON DASHBOARD 
document.addEventListener("DOMContentLoaded", async () => {
  const ctx = document.getElementById("salesBarChart").getContext("2d");
  const itemsSoldEl = document.getElementById("itemsSold");
  const revenueEl = document.getElementById("revenue");

  try {
    const res = await fetch("http://localhost:3001/amazon/document/api/orders");
    if (!res.ok) throw new Error("Failed to fetch orders");
    const orders = await res.json();

    const today = new Date();
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - (6 - i));
      return d;
    });

    const labels = last7Days.map(d => d.toLocaleDateString("en-US", { day: "numeric" }));
    const dailyItems = Array(7).fill(0);
    const dailyRevenue = Array(7).fill(0);

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      last7Days.forEach((day, i) => {
        if (orderDate.toDateString() === day.toDateString()) {
          let items = 0;
          order.items.forEach(item => items += item.quantity || 0);
          dailyItems[i] += items;
          dailyRevenue[i] += order.totalAmount || 0;
        }
      });
    });

    const totalItems = dailyItems.reduce((a, b) => a + b, 0);
    const totalRevenue = dailyRevenue.reduce((a, b) => a + b, 0);
    itemsSoldEl.textContent = totalItems.toLocaleString();
    revenueEl.textContent = `₦${totalRevenue.toLocaleString()}`;

    new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Items Sold",
            data: dailyItems,
            backgroundColor: "#00C26F",
            yAxisID: "y",
          },
          {
            label: "Revenue",
            data: dailyRevenue,
            backgroundColor: "#007BFF",
            yAxisID: "y1",
          },
        ],
      },
      options: {
        responsive: true,
        interaction: { mode: "index", intersect: false },
        scales: {
          y: {
            beginAtZero: true,
            position: "left",
            title: { display: true, text: "Items Sold" },
          },
          y1: {
            beginAtZero: true,
            position: "right",
            title: { display: true, text: "Revenue (₦)" },
            grid: { drawOnChartArea: false },
          },
        },
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed.y;
                return ctx.dataset.label === "Revenue"
                  ? `₦${val.toLocaleString()}`
                  : `${val.toLocaleString()} items`;
              },
            },
          },
          datalabels: {
            anchor: "end",
            align: "end",
            formatter: (value, ctx) => {
              return ctx.dataset.label === "Revenue"
                ? `₦${value.toLocaleString()}`
                : value.toLocaleString();
            },
          },
        },
      },
      plugins: [ChartDataLabels],
    });
  } catch (err) {
    console.error("Error loading 7-day bar chart:", err);
  }
});

//  ORDERS OVER TIME ON DASHBOARD 
 document.addEventListener("DOMContentLoaded", async () => {
    const ctx = document.getElementById("ordersOverTimeChart").getContext("2d");
    const monthSelect = document.getElementById("monthSelect");
    const compareToggle = document.getElementById("compareToggle");
    const summary = document.getElementById("monthlySummary");
    let allOrders = [];
    let chart;

    // ✅ Fetch all orders (real data)
    async function fetchOrders() {
      try {
        const res = await fetch("http://localhost:3001/amazon/document/api/orders");
        if (!res.ok) throw new Error("Failed to fetch orders");
        const data = await res.json();
        allOrders = data;
        populateMonthDropdown();
        renderChart();
      } catch (err) {
        console.error("❌ Error fetching orders:", err);
      }
    }

    // ✅ Build month dropdown dynamically
    function populateMonthDropdown() {
      const months = [...new Set(
        allOrders.map(o => {
          const d = new Date(o.createdAt);
          return d.toLocaleString("default", { month: "long", year: "numeric" });
        })
      )];
      months.forEach(month => {
        const opt = document.createElement("option");
        opt.value = month;
        opt.textContent = month;
        monthSelect.appendChild(opt);
      });
    }

    // ✅ Compute daily paid/pending stats
    function getOrdersData(monthLabel = "") {
      const now = new Date();
      let filtered = allOrders;

      if (monthLabel) {
        filtered = allOrders.filter(o => {
          const d = new Date(o.createdAt);
          return d.toLocaleString("default", { month: "long", year: "numeric" }) === monthLabel;
        });
      } else {
        filtered = allOrders.filter(o => {
          const d = new Date(o.createdAt);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
      }

      const daily = {};
      filtered.forEach(order => {
        const d = new Date(order.createdAt);
        const day = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
        if (!daily[day]) daily[day] = { paidCount: 0, pendingCount: 0, paidRevenue: 0, pendingRevenue: 0 };

        if (order.paymentStatus?.toLowerCase() === "paid") {
          daily[day].paidCount += 1;
          daily[day].paidRevenue += order.totalAmount || 0;
        } else {
          daily[day].pendingCount += 1;
          daily[day].pendingRevenue += order.totalAmount || 0;
        }
      });

      return {
        days: Object.keys(daily),
        paidCounts: Object.values(daily).map(d => d.paidCount),
        pendingCounts: Object.values(daily).map(d => d.pendingCount),
        paidRevenue: Object.values(daily).map(d => d.paidRevenue),
        pendingRevenue: Object.values(daily).map(d => d.pendingRevenue),
        totals: {
          paidOrders: Object.values(daily).reduce((a,b)=>a+b.paidCount,0),
          pendingOrders: Object.values(daily).reduce((a,b)=>a+b.pendingCount,0),
          paidRevenue: Object.values(daily).reduce((a,b)=>a+b.paidRevenue,0),
          pendingRevenue: Object.values(daily).reduce((a,b)=>a+b.pendingRevenue,0),
        }
      };
    }

    // ✅ Render chart (with paid vs pending)
    function renderChart(selectedMonth = "", compare = false) {
      const current = getOrdersData(selectedMonth);
      const prevMonthLabel = compare ? getPrevMonth(selectedMonth) : null;
      const previous = compare ? getOrdersData(prevMonthLabel) : null;

      if (chart) chart.destroy();

      const datasets = [
        {
          label: "Paid Orders",
          data: current.paidCounts,
          borderColor: "#198754",
          backgroundColor: "rgba(25, 135, 84, 0.15)",
          fill: true,
          tension: 0.3,
          yAxisID: "yOrders",
        },
        {
          label: "Pending Orders",
          data: current.pendingCounts,
          borderColor: "#ffc107",
          backgroundColor: "rgba(255, 193, 7, 0.15)",
          fill: true,
          tension: 0.3,
          yAxisID: "yOrders",
        },
        {
          label: "Paid Revenue (₦)",
          data: current.paidRevenue,
          borderColor: "#0d6efd",
          backgroundColor: "rgba(13, 110, 253, 0.15)",
          fill: true,
          tension: 0.3,
          yAxisID: "yRevenue",
        },
        {
          label: "Pending Value (₦)",
          data: current.pendingRevenue,
          borderColor: "#fd7e14",
          backgroundColor: "rgba(253, 126, 20, 0.15)",
          fill: true,
          tension: 0.3,
          yAxisID: "yRevenue",
        }
      ];

      if (compare && previous) {
        datasets.push({
          label: `Prev Month Paid Orders (${prevMonthLabel})`,
          data: previous.paidCounts,
          borderColor: "#6c757d",
          borderDash: [5, 5],
          tension: 0.3,
          yAxisID: "yOrders"
        });
      }

      chart = new Chart(ctx, {
        type: "line",
        data: { labels: current.days, datasets },
        options: {
          responsive: true,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { position: "top" },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  if (ctx.dataset.label.includes("₦"))
                    return ` ${ctx.dataset.label}: ₦${ctx.parsed.y.toLocaleString()}`;
                  return ` ${ctx.dataset.label}: ${ctx.parsed.y} orders`;
                }
              }
            }
          },
          scales: {
            x: { grid: { display: false } },
            yOrders: {
              position: "left",
              title: { display: true, text: "Orders", color: "#000" },
              beginAtZero: true,
            },
            yRevenue: {
              position: "right",
              title: { display: true, text: "Revenue (₦)", color: "#000" },
              beginAtZero: true,
              grid: { drawOnChartArea: false },
            }
          }
        }
      });

      // ✅ Summary totals below chart
      summary.innerHTML = `
        <span class="text-success fw-semibold">Paid Orders:</span> ${current.totals.paidOrders.toLocaleString()} 
        (₦${current.totals.paidRevenue.toLocaleString()})
        &nbsp; | &nbsp;
        <span class="text-warning fw-semibold">Pending Orders:</span> ${current.totals.pendingOrders.toLocaleString()} 
        (₦${current.totals.pendingRevenue.toLocaleString()})
      `;
    }

    // ✅ Get previous month label
    function getPrevMonth(label) {
      const d = label ? new Date(label) : new Date();
      d.setMonth(d.getMonth() - 1);
      return d.toLocaleString("default", { month: "long", year: "numeric" });
    }

    // Events
    monthSelect.addEventListener("change", (e) => {
      renderChart(e.target.value, compareToggle.checked);
    });
    compareToggle.addEventListener("change", () => {
      renderChart(monthSelect.value, compareToggle.checked);
    });

    fetchOrders();
  });



















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
      localStorage.removeItem("catId");
      localStorage.removeItem("prodId");
      localStorage.removeItem("products");
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







