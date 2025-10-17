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


// Fuction get all orders API(to Table)

document.addEventListener("DOMContentLoaded", async function () {
  let allOrders = [];
  let currentPage = 1;
  const pageSize = 10;

  async function loadOrders() {
  try {
    const res = await fetch("http://localhost:3001/amazon/document/api/orders");
    allOrders = await res.json();

    // Sort orders by createdAt descending (most recent first)
    allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    renderTable();
  } catch (err) {
    console.error("Error loading orders:", err);
  }
}


  function renderTable() {
    const tbody = document.getElementById("ordersTableBody");
    if (!tbody) return;

    const searchValue = document.getElementById("orderSearch").value.toLowerCase();
    let filteredOrders = allOrders.filter(order => {
      const fullName = `${order.customerSnapshot?.firstName || ""} ${order.customerSnapshot?.lastName || ""}`.toLowerCase();
      const transactionId = (order.transactionId || "").toLowerCase();
      const city = (order.customerSnapshot?.city || "").toLowerCase();
      return (
        fullName.includes(searchValue) ||
        transactionId.includes(searchValue) ||
        city.includes(searchValue)
      );
    });

    const totalPages = Math.ceil(filteredOrders.length / pageSize);
    if (currentPage > totalPages) currentPage = totalPages || 1;

    const startIndex = (currentPage - 1) * pageSize;
    const paginated = filteredOrders.slice(startIndex, startIndex + pageSize);

    tbody.innerHTML = "";
    if (!paginated.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center">No orders found</td></tr>`;
      document.getElementById("pagination").innerHTML = "";
      document.getElementById("paginationSummary").innerHTML = "";
      return;
    }

    paginated.forEach(order => {
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
            <span class="badge ${order.deliveryStatus === "delivered" ? "bg-success" : "bg-warning"}">
              ${order.deliveryStatus}
            </span>
          </td>
          <td>₦${order.totalAmount.toLocaleString()}</td>
        </tr>
      `;
      tbody.insertAdjacentHTML("beforeend", row);
    });

    renderPagination(totalPages);
    renderSummary(filteredOrders.length, startIndex, paginated.length);
  }

  function renderPagination(totalPages) {
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";
    if (totalPages <= 1) return;

    const createPageItem = (label, page, disabled = false, active = false) => `
      <li class="page-item ${disabled ? "disabled" : ""} ${active ? "active" : ""}">
        <a class="page-link" href="#" data-page="${page}">${label}</a>
      </li>
    `;

    pagination.insertAdjacentHTML("beforeend", createPageItem("«", currentPage - 1, currentPage === 1));

    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) startPage = Math.max(1, endPage - maxVisible + 1);

    for (let i = startPage; i <= endPage; i++) {
      pagination.insertAdjacentHTML("beforeend", createPageItem(i, i, false, i === currentPage));
    }

    pagination.insertAdjacentHTML("beforeend", createPageItem("»", currentPage + 1, currentPage === totalPages));

    pagination.querySelectorAll(".page-link").forEach(btn => {
      btn.addEventListener("click", e => {
        e.preventDefault();
        const page = parseInt(btn.dataset.page);
        if (!isNaN(page) && page >= 1 && page <= totalPages) {
          currentPage = page;
          renderTable();
        }
      });
    });
  }

  function renderSummary(totalItems, startIndex, currentItems) {
    const summary = document.getElementById("paginationSummary");
    const start = totalItems === 0 ? 0 : startIndex + 1;
    const end = startIndex + currentItems;
    summary.innerHTML = `Showing <b>${start}</b>–<b>${end}</b> of <b>${totalItems}</b> orders`;
  }

  document.getElementById("orderSearch").addEventListener("input", () => {
    currentPage = 1;
    renderTable();
  });

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





// LOAD CUSTOMERS TABLE 
 document.addEventListener("DOMContentLoaded", () => {
  const customersTableBody = document.querySelector("#customersTableBody");
  const paginationContainer = document.getElementById("pagination");
  const cityFilter = document.getElementById("cityFilter");
  const searchInput = document.getElementById("searchInput");

  const token = localStorage.getItem("key");
  let users = [];
  let orders = [];
  let currentPage = 1;
  const rowsPerPage = 8;

  // Fetch customers + orders
  async function loadCustomers() {
  try {
    const [usersRes, ordersRes] = await Promise.all([
      fetch("http://localhost:3001/amazon/document/api/register/all-users", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("http://localhost:3001/amazon/document/api/orders"),
    ]);

    if (!usersRes.ok || !ordersRes.ok) throw new Error("Failed to fetch data");

    const usersData = await usersRes.json();
    const ordersData = await ordersRes.json();

    // Filter only customers
    users = usersData.filter(u => u.role === "customer");
    orders = ordersData;

    // 🔹 NEW LOGIC: Backfill missing city from their latest order
    users.forEach(u => {
      if (!u.city) {
        const userOrders = orders
          .filter(o => o.customerId === u._id && o.customerSnapshot?.city)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // latest first
        if (userOrders.length > 0) {
          u.city = userOrders[0].customerSnapshot.city;
        }
      }
    });

    populateCityFilter();
    renderTable();
    renderPagination();
  } catch (err) {
    console.error("Error loading customers:", err);
  }
}

  // Populate City Filter Dropdown
  function populateCityFilter() {
    const uniqueCities = [...new Set(users.map(u => u.city).filter(Boolean))];
    cityFilter.innerHTML = `<option value="">All Cities</option>` +
      uniqueCities.map(c => `<option value="${c}">${c}</option>`).join("");
  }

  // Render Customer Table
  function renderTable() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCity = cityFilter.value;

    const filtered = users.filter(u => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchTerm) ||
        u.email.toLowerCase().includes(searchTerm) ||
        (u.phoneNumber && u.phoneNumber.includes(searchTerm));
      const matchesCity = !selectedCity || u.city === selectedCity;
      return matchesSearch && matchesCity;
    });

    const start = (currentPage - 1) * rowsPerPage;
    const paginated = filtered.slice(start, start + rowsPerPage);

    customersTableBody.innerHTML = "";
    paginated.forEach(cust => {
      const custOrders = orders.filter(o => o.customerId === cust._id);
      const totalOrders = custOrders.length;
      const totalSpent = custOrders.reduce((sum, o) => {
        if (o.totalAmount) return sum + o.totalAmount;
        if (o.items && Array.isArray(o.items)) {
          const subtotal = o.items.reduce((s, i) => {
            const price = i.price || 0;
            const qty = i.quantity || 1;
            const sub = i.subTotal || price * qty;
            return s + sub;
          }, 0);
          return sum + subtotal;
        }
        return sum;
      }, 0);

      const initials = getInitials(cust.name);
      const avatarHTML = cust.profilePicture
        ? `<img src="${cust.profilePicture}" class="rounded-circle me-2" width="40" height="40" alt="profile">`
        : `<div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2" style="width:40px;height:40px;">${initials}</div>`;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="align-middle d-flex align-items-center">${avatarHTML}<strong>${cust.name}</strong></td>
        <td class="align-middle">${cust.city || "-"}</td>
        <td class="align-middle">${totalOrders}</td>
        <td class="align-middle text-success fw-semibold">${formatNaira(totalSpent)}</td>
      `;
      customersTableBody.appendChild(row);
    });
  }

  // Render Pagination Buttons
  function renderPagination() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCity = cityFilter.value;

    const filtered = users.filter(u => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchTerm) ||
        u.email.toLowerCase().includes(searchTerm) ||
        (u.phoneNumber && u.phoneNumber.includes(searchTerm));
      const matchesCity = !selectedCity || u.city === selectedCity;
      return matchesSearch && matchesCity;
    });

    const pageCount = Math.ceil(filtered.length / rowsPerPage);
    paginationContainer.innerHTML = "";

    for (let i = 1; i <= pageCount; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      btn.classList.add("btn", "btn-sm", "me-1");
      btn.classList.add(i === currentPage ? "btn-primary" : "btn-outline-primary");
      btn.addEventListener("click", () => {
        currentPage = i;
        renderTable();
        renderPagination();
      });
      paginationContainer.appendChild(btn);
    }
  }

  // Utility Helpers
  function getInitials(name = "") {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  function formatNaira(amount) {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  }

  // Event Listeners
  searchInput.addEventListener("input", () => {
    currentPage = 1;
    renderTable();
    renderPagination();
  });

  cityFilter.addEventListener("change", () => {
    currentPage = 1;
    renderTable();
    renderPagination();
  });

  loadCustomers();
  });

  // LOAD CUSTOMERS  DETAILS MODAL
  document.addEventListener("DOMContentLoaded", () => {
  const customersTableBody = document.querySelector("#customersTableBody");
  const paginationContainer = document.getElementById("pagination");
  const cityFilter = document.getElementById("cityFilter");
  const searchInput = document.getElementById("searchInput");
  const modalEl = document.getElementById("customerModal");
  const modalContainer = document.getElementById("customerDetailsContainer");

  if (!customersTableBody) {
    console.error("customersTableBody element not found. Ensure <tbody id='customersTableBody'> exists.");
    return;
  }
  if (!modalEl) {
    console.error("customerModal not found. Paste modal markup into the page.");
  }

  const token = localStorage.getItem("key");
  let users = [];
  let orders = [];
  let currentPage = 1;
  const rowsPerPage = 8;

  // Load data
  async function loadCustomers() {
    try {
      const [usersRes, ordersRes] = await Promise.all([
        fetch("http://localhost:3001/amazon/document/api/register/all-users", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:3001/amazon/document/api/orders"),
      ]);

      if (!usersRes.ok || !ordersRes.ok) throw new Error("Failed to fetch data");

      const usersData = await usersRes.json();
      const ordersData = await ordersRes.json();

      users = usersData.filter(u => u.role === "customer");
      orders = ordersData;

      // Backfill missing city from latest order snapshot if available
      users.forEach(u => {
        if (!u.city) {
          const userOrders = orders
            .filter(o => (o.customerId === u._id || o.customerId === String(u._id)) && o.customerSnapshot?.city)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          if (userOrders.length) u.city = userOrders[0].customerSnapshot.city;
        }
      });

      populateCityFilter();
      renderTable();
      renderPagination();
      console.log("✅ Customers + orders loaded");
    } catch (err) {
      console.error("Error loading customers:", err);
    }
  }

  function populateCityFilter() {
    if (!cityFilter) return;
    const uniqueCities = [...new Set(users.map(u => u.city).filter(Boolean))];
    cityFilter.innerHTML = `<option value="">All Cities</option>` +
      uniqueCities.map(c => `<option value="${c}">${c}</option>`).join("");
  }

  function renderTable() {
    const searchTerm = (searchInput?.value || "").toLowerCase();
    const selectedCity = cityFilter?.value || "";

    const filtered = users.filter(u => {
      const matchesSearch =
        (u.name || "").toLowerCase().includes(searchTerm) ||
        (u.email || "").toLowerCase().includes(searchTerm) ||
        ((u.phoneNumber || "").toLowerCase().includes(searchTerm));
      const matchesCity = !selectedCity || u.city === selectedCity;
      return matchesSearch && matchesCity;
    });

    const start = (currentPage - 1) * rowsPerPage;
    const paginated = filtered.slice(start, start + rowsPerPage);

    customersTableBody.innerHTML = "";

    paginated.forEach(cust => {
      const custOrders = orders.filter(o => o.customerId === cust._id || o.customerId === String(cust._id));
      const totalOrders = custOrders.length;
      const totalSpent = custOrders.reduce((sum, o) => {
        if (typeof o.totalAmount === "number") return sum + o.totalAmount;
        if (o.items && Array.isArray(o.items)) {
          return sum + o.items.reduce((s, it) => s + ((it.subTotal != null) ? it.subTotal : ((it.price || 0) * (it.quantity || 1))), 0);
        }
        return sum;
      }, 0);

      const initials = getInitials(cust.name || cust.name || (cust.firstName && cust.lastName ? `${cust.firstName} ${cust.lastName}` : "User"));
      const avatarHTML = cust.profilePicture
        ? `<img src="${cust.profilePicture}" class="rounded-circle me-2" width="40" height="40" alt="profile">`
        : `<div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2" style="width:40px;height:40px;">${initials}</div>`;

      const tr = document.createElement("tr");
      tr.className = "customer-row";
      tr.setAttribute("data-id", cust._id);
      tr.innerHTML = `
        <td class="align-middle d-flex align-items-center">${avatarHTML}<strong>${cust.name || cust.firstName || "Unknown"}</strong></td>
        <td class="align-middle">${cust.city || "-"}</td>
        <td class="align-middle">${totalOrders}</td>
        <td class="align-middle text-success fw-semibold">${formatNaira(totalSpent)}</td>
      `;
      customersTableBody.appendChild(tr);
    });
  }

  function renderPagination() {
    if (!paginationContainer) return;
    const searchTerm = (searchInput?.value || "").toLowerCase();
    const selectedCity = cityFilter?.value || "";

    const filtered = users.filter(u => {
      const matchesSearch =
        (u.name || "").toLowerCase().includes(searchTerm) ||
        (u.email || "").toLowerCase().includes(searchTerm) ||
        ((u.phoneNumber || "").toLowerCase().includes(searchTerm));
      const matchesCity = !selectedCity || u.city === selectedCity;
      return matchesSearch && matchesCity;
    });

    const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    paginationContainer.innerHTML = "";

    for (let i = 1; i <= pageCount; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      btn.className = `btn btn-sm me-1 ${i === currentPage ? "btn-primary" : "btn-outline-primary"}`;
      btn.addEventListener("click", () => {
        currentPage = i;
        renderTable();
        renderPagination();
      });
      paginationContainer.appendChild(btn);
    }
  }

  // Delegated click handler on tbody — works after re-renders
  customersTableBody.addEventListener("click", (e) => {
    const row = e.target.closest("tr[data-id]");
    if (!row) return;
    const id = row.getAttribute("data-id");
    const customer = users.find(u => u._id === id || String(u._id) === id);
    const customerOrders = orders.filter(o => o.customerId === id || String(o.customerId) === id);
    if (!customer) {
      console.warn("Clicked customer not found in users array:", id);
      return;
    }
    openCustomerModal(customer, customerOrders);
  });

  // Modal renderer
  function openCustomerModal(customer, customerOrders) {
    if (!modalEl) {
      alert("Modal element not found on page.");
      return;
    }

    const ordersHTML = (customerOrders || []).map(o => {
      const idShort = String(o._id).slice(-6).toUpperCase();
      const created = o.createdAt ? new Date(o.createdAt).toLocaleString() : "-";
      const statusBadge = (o.paymentStatus === "paid")
        ? `<span class="badge bg-success-subtle text-success">paid</span>`
        : `<span class="badge bg-warning-subtle text-warning">${o.paymentStatus || "pending"}</span>`;
      const amount = formatNaira(o.totalAmount || calculateOrderFromItems(o.items || []));
      return `<tr>
          <td>#${idShort}</td>
          <td>${created}</td>
          <td>${statusBadge}</td>
          <td>${amount}</td>
        </tr>`;
    }).join("");

    modalContainer.innerHTML = `
      <div class="d-flex align-items-center mb-3">
        <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3" style="width:60px;height:60px;font-size:1.25rem;">
          ${getInitials(customer.name || (customer.firstName ? `${customer.firstName} ${customer.lastName || ''}` : "U"))}
        </div>
        <div>
          <h5 class="mb-0">${customer.name || customer.firstName || "Unknown"}</h5>
          <small class="text-muted">${customer.city || "-"}</small><br>
          <small class="text-muted">${customer.email || "-"}</small>
        </div>
      </div>

      <div class="row g-3 mb-3">
        <div class="col-lg-8">
          <div class="card border-0 shadow-sm mb-3">
            <div class="card-body">
              <h6 class="fw-semibold mb-2">Customer Orders</h6>
              <div class="table-responsive">
                <table class="table table-sm mb-0">
                  <thead>
                    <tr><th>Order</th><th>Date</th><th>Status</th><th>Price</th></tr>
                  </thead>
                  <tbody>
                    ${ordersHTML || '<tr><td colspan="4" class="text-center text-muted">No orders yet</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-4">
          <div class="card border-0 shadow-sm mb-3">
            <div class="card-body">
              <h6 class="fw-semibold">Overview</h6>
              <p class="mb-1"><strong>Address:</strong><br>${(customer.address || customer.customerSnapshot?.address) || "-"}</p>
              <p class="mb-1"><strong>Phone:</strong> ${customer.phoneNumber || customer.customerSnapshot?.phone || "-"}</p>
              <p class="mb-1"><strong>Orders:</strong> ${customerOrders.length}</p>
              <p class="mb-0"><strong>Total spent:</strong> ${formatNaira(customerOrders.reduce((s,o)=> s + (o.totalAmount || calculateOrderFromItems(o.items||[])),0))}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }

  function calculateOrderFromItems(items) {
    if (!Array.isArray(items)) return 0;
    return items.reduce((s, i) => s + ((i.subTotal != null) ? i.subTotal : ((i.price || 0) * (i.quantity || 1))), 0);
  }

  // Helpers
  function getInitials(name = "") {
    name = (name || "").trim();
    if (!name) return "?";
    const parts = name.split(/\s+/);
    return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
  }
  function formatNaira(amount) {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount || 0);
  }

  // Listeners for search & filter
  if (searchInput) searchInput.addEventListener("input", () => { currentPage = 1; renderTable(); renderPagination(); });
  if (cityFilter) cityFilter.addEventListener("change", () => { currentPage = 1; renderTable(); renderPagination(); });

  // Init
  loadCustomers();
});





// ========== Mobile Search Toggle & Logic ==========
document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.getElementById("mobileSearchBtn");
  const searchInput = document.getElementById("mobileSearchInput");

  // Toggle search input visibility
  searchBtn.addEventListener("click", (e) => {
    e.preventDefault();

    if (searchInput.style.width === "0px" || searchInput.style.width === "") {
      searchInput.style.width = "180px";
      searchInput.style.opacity = "1";
      searchInput.focus();
    } else {
      searchInput.style.width = "0";
      searchInput.style.opacity = "0";
      searchInput.value = "";
      filterDashboardItems(""); // reset search
    }
  });

  // Search typing logic
  searchInput.addEventListener("input", (e) => {
    const value = e.target.value.toLowerCase().trim();
    filterDashboardItems(value);
  });
});

// ========== Dashboard Filter Function ==========
function filterDashboardItems(searchValue) {
  
  const rows = document.querySelectorAll("#ordersTableBody tr, #usersTableBody tr");
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchValue) ? "" : "none";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".search-container");
  const btn = document.getElementById("mobileSearchBtn");
  const input = document.getElementById("mobileSearchInput");

  if (!container || !btn || !input) return;

  // Expand / collapse input
  btn.addEventListener("click", (e) => {
    e.preventDefault();

    const isExpanded = container.classList.contains("expanded");
    if (!isExpanded) {
      container.classList.add("expanded");
      input.focus();
    } else {
      if (input.value.trim() !== "") {
        input.value = "";
        filterDashboardItems("");
        input.focus();
      } else {
        container.classList.remove("expanded");
      }
    }
  });

  // Live search while typing
  input.addEventListener("input", (e) => {
    const value = e.target.value.toLowerCase().trim();
    filterDashboardItems(value);
  });

  // Collapse when clicking outside
  document.addEventListener("click", (e) => {
    if (!container.contains(e.target) && input.value.trim() === "") {
      container.classList.remove("expanded");
    }
  });

  // Collapse on blur if empty
  input.addEventListener("blur", () => {
    setTimeout(() => {
      if (input.value.trim() === "") {
        container.classList.remove("expanded");
      }
    }, 120);
  });
});

// 🧹 Normalize text for matching
function normalizeText(text) {
  return text.toLowerCase().replace(/₦|,|\s+/g, "").trim();
}

// 🕵️ Main dashboard filter logic
function filterDashboardItems(searchValue) {
  const cleanSearch = normalizeText(searchValue);
  const tables = document.querySelectorAll("table");
  const metricCards = document.querySelectorAll(".metric-card");
  const customerItems = document.querySelectorAll("#customerList > div");

  // Remove old “no results” if any
  let existingMsg = document.getElementById("noResultsMsg");
  if (existingMsg) existingMsg.remove();

  let resultsFound = false;

  // Reset everything when input empty
  if (cleanSearch === "") {
    tables.forEach((t) => t.querySelectorAll("tr").forEach((tr) => (tr.style.display = "")));
    metricCards.forEach((c) => (c.style.display = ""));
    customerItems.forEach((d) => (d.style.display = ""));
    return;
  }

  // ✅ Filter metric cards
  metricCards.forEach((card) => {
    const text = normalizeText(card.textContent);
    const visible = text.includes(cleanSearch);
    card.style.display = visible ? "" : "none";
    if (visible) resultsFound = true;
  });

  // ✅ Filter customer list
  customerItems.forEach((div) => {
    const text = normalizeText(div.textContent);
    const visible = text.includes(cleanSearch);
    div.style.display = visible ? "" : "none";
    if (visible) resultsFound = true;
  });

  // ✅ Filter all tables
  tables.forEach((table) => {
    const headers = Array.from(table.querySelectorAll("thead th"))
      .map((th) => normalizeText(th.textContent))
      .join(" ");
    const rows = table.querySelectorAll("tbody tr");

    let tableHasMatch = false;
    rows.forEach((tr) => {
      const rowText = normalizeText(tr.textContent);
      const visible = rowText.includes(cleanSearch) || headers.includes(cleanSearch);
      tr.style.display = visible ? "" : "none";
      if (visible) {
        tableHasMatch = true;
        resultsFound = true;
      }
    });

    // If no rows matched but header matches, show table anyway
    if (!tableHasMatch && headers.includes(cleanSearch)) {
      rows.forEach((tr) => (tr.style.display = ""));
      resultsFound = true;
    }
  });

  // 🚫 Show “No results found” overlay
  if (!resultsFound) {
    const msg = document.createElement("div");
    msg.id = "noResultsMsg";
    msg.textContent = "No results found";
    Object.assign(msg.style, {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      background: "rgba(255,255,255,0.95)",
      padding: "15px 25px",
      borderRadius: "12px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
      fontWeight: "500",
      color: "#444",
      zIndex: "2000",
    });
    document.body.appendChild(msg);

    // Auto-remove message after 2 seconds
    setTimeout(() => {
      if (msg && msg.parentNode) msg.remove();
    }, 2000);
  }
}












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

      // 🛑 Prevent back button returning to dashboard
      history.pushState(null, null, location.href);
      window.addEventListener('popstate', () => {
        history.pushState(null, null, location.href);
      });

      Swal.fire({
        icon: 'success',
        title: 'Logged out',
        text: 'You have been successfully logged out.',
        confirmButtonColor: '#28A745'
      }).then(() => {
        window.location.replace("index.html");
      });
    }
  });
}







