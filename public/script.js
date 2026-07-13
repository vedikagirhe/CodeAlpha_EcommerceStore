    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    // ================= CART =================

    function saveCart() {
        localStorage.setItem("cart", JSON.stringify(cart));
    }

    function updateCartCount() {
        const cartCount = document.getElementById("cart-count");

        if (cartCount) {
            const totalItems = cart.reduce(
                (total, product) => total + (product.quantity || 1),
                0
            );

            cartCount.textContent = totalItems;
        }
    }

    function addToCart(productName, price) {
        const existingProduct = cart.find(
            product => product.name === productName
        );

        if (existingProduct) {
            existingProduct.quantity =
                (existingProduct.quantity || 1) + 1;
        } else {
            cart.push({
                name: productName,
                price,
                quantity: 1
            });
        }

        saveCart();
        updateCartCount();

        alert(productName + " added to cart!");
    }

    async function displayCart() {
    const cartItems = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");
    const cartSubtotal = document.getElementById("cart-subtotal");

    if (!cartItems || !cartTotal) {
        return;
    }

    cartItems.innerHTML = "";

    let total = 0;

    try {
        const response = await fetch("/products");
        const allProducts = await response.json();

        if (cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <h3>Your cart is empty 🛒</h3>
                    <p>Add products to continue shopping.</p>

                    <a href="index.html" class="continue-shopping-btn">
                        Continue Shopping
                    </a>
                </div>
            `;
        }

        cart.forEach((product, index) => {
            const fullProduct = allProducts.find(
                item => item.name === product.name
            );

            const image = fullProduct
                ? fullProduct.image
                : "";

            const description = fullProduct
                ? fullProduct.description
                : "Technology product from TechNest.";

            const quantity = product.quantity || 1;

            const item = document.createElement("div");

            item.classList.add("modern-cart-item");

            item.innerHTML = `
                <div class="cart-product-image">
                    ${
                        image
                            ? `<img src="${image}" alt="${product.name}">`
                            : ""
                    }
                </div>

                <div class="cart-product-details">
                    <h3>${product.name}</h3>

                    <p class="cart-description">
                        ${description}
                    </p>

                    <p class="cart-price">
                        ₹${product.price.toLocaleString("en-IN")}
                    </p>

                    <button
                        class="remove-cart-btn"
                        onclick="removeFromCart(${index})"
                    >
                        Remove
                    </button>
                </div>

                <div class="modern-quantity-controls">
                    <button onclick="decreaseQuantity(${index})">
                        −
                    </button>

                    <span>${quantity}</span>

                    <button onclick="increaseQuantity(${index})">
                        +
                    </button>
                </div>
            `;

            cartItems.appendChild(item);

            total += product.price * quantity;
        });

        const formattedTotal = total.toLocaleString("en-IN");

        cartTotal.textContent = formattedTotal;

        if (cartSubtotal) {
            cartSubtotal.textContent = formattedTotal;
        }

    } catch (error) {
        console.log(error);

        cartItems.innerHTML =
            "<p>Could not load cart products.</p>";
    }
}
    function increaseQuantity(index) {
        cart[index].quantity = (cart[index].quantity || 1) + 1;

        
        saveCart();
        displayCart();
        updateCartCount();
    }

    function decreaseQuantity(index) {
        const quantity = cart[index].quantity || 1;

        if (quantity > 1) {
            cart[index].quantity = quantity - 1;
        } else {
            cart.splice(index, 1);
        }

        saveCart();
        displayCart();
        updateCartCount();
    }

    function removeFromCart(index) {
        cart.splice(index, 1);

        saveCart();
        displayCart();
        updateCartCount();
    }

    // ================= CHECKOUT =================

    async function checkout() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const customerName = localStorage.getItem("userName");

    if (!customerName) {
        alert("Please login before placing an order!");
        window.location.href = "login.html";
        return;
    }

    const total = cart.reduce(
        (sum, product) =>
            sum + product.price * (product.quantity || 1),
        0
    );

    try {
        const response = await fetch("/create-payment-order", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                total
            })
        });

        const data = await response.json();

        if (!data.success) {
            alert(data.message);
            return;
        }

        const options = {
            key: data.keyId,
            amount: data.amount,
            currency: data.currency,
            name: "TechNest",
            description: "TechNest Product Order",
            order_id: data.orderId,

            handler: async function (paymentResponse) {
                const verifyResponse = await fetch("/verify-payment", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        razorpay_order_id:
                            paymentResponse.razorpay_order_id,

                        razorpay_payment_id:
                            paymentResponse.razorpay_payment_id,

                        razorpay_signature:
                            paymentResponse.razorpay_signature,

                        customerName,
                        products: cart,
                        total
                    })
                });

                const verifyData = await verifyResponse.json();

                alert(verifyData.message);

                if (verifyData.success) {
                    cart = [];
                    localStorage.removeItem("cart");

                    displayCart();
                    updateCartCount();

                    window.location.href = "orders.html";
                }
            },

            theme: {
                color: "#2563eb"
            }
        };

        const paymentObject = new Razorpay(options);

        paymentObject.open();

    } catch (error) {
        console.log(error);
        alert("Could not start payment!");
    }
}
    // ================= USER REGISTER =================

    const registerForm = document.getElementById("register-form");

    if (registerForm) {
        registerForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const name = document.getElementById("register-name").value;
            const email = document.getElementById("register-email").value;
            const password = document.getElementById("register-password").value;

            try {
                const response = await fetch("/register", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name,
                        email,
                        password
                    })
                });

                const data = await response.json();

                alert(data.message);

                if (data.success) {
                    window.location.href = "login.html";
                }
            } catch (error) {
                alert("Registration failed!");
            }
        });
    }

    // ================= USER LOGIN =================

    const loginForm = document.getElementById("login-form");

    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const email = document.getElementById("login-email").value;
            const password = document.getElementById("login-password").value;

            try {
                const response = await fetch("/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                });

                const data = await response.json();

                alert(data.message);

                if (data.success) {
                    localStorage.setItem("userName", data.name);
                    window.location.href = "index.html";
                }
            } catch (error) {
                alert("Login failed!");
            }
        });
    }

    // ================= USER LOGOUT =================

    function logout() {
        localStorage.removeItem("userName");

        alert("Logged out successfully!");

        window.location.href = "index.html";
    }

    const loggedInUser = localStorage.getItem("userName");
    const userDisplay = document.getElementById("user-display");

    if (userDisplay && loggedInUser) {
        userDisplay.innerHTML = `
            Welcome, ${loggedInUser}
            <button onclick="logout()">Logout</button>
        `;
    }

    // ================= LOAD PRODUCTS =================

    async function loadProducts() {
        const productContainer =
            document.getElementById("product-container");

        if (!productContainer) {
            return;
        }

        try {
            const response = await fetch("/products");
            const productsFromDatabase = await response.json();

            productContainer.innerHTML = "";

            productsFromDatabase.forEach(product => {
                const card = document.createElement("div");

                card.classList.add("product-card");

                card.innerHTML = `
                    <img src="${product.image}" alt="${product.name}">

                    <h3>${product.name}</h3>

                    <p>₹${product.price.toLocaleString("en-IN")}</p>

                    <a
                        href="product.html?id=${product.id}"
                        class="details-link"
                    >
                        View Details
                    </a>

                    <button
                        onclick='addToCart(${JSON.stringify(product.name)}, ${product.price})'
                    >
                        Add to Cart
                    </button>
                `;

                productContainer.appendChild(card);
            });
        } catch (error) {
            productContainer.innerHTML =
                "<p>Could not load products.</p>";
        }
    }

    loadProducts();

    // ================= PRODUCT DETAILS =================

    async function loadProductDetails() {
        const detailName = document.getElementById("detail-name");

        if (!detailName) {
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const productId = params.get("id");

        if (!productId) {
            detailName.textContent = "Product not found";
            return;
        }

        try {
            const response = await fetch(`/products/${productId}`);

            if (!response.ok) {
                throw new Error("Product not found");
            }

            const product = await response.json();

            document.getElementById("detail-name").textContent =
                product.name;

            document.getElementById("detail-price").textContent =
                product.price.toLocaleString("en-IN");

            document.getElementById("detail-image").src =
                product.image;

            document.getElementById("detail-description").textContent =
                product.description;

            document.getElementById("detail-cart-button").onclick =
                function () {
                    addToCart(product.name, product.price);
                };
        } catch (error) {
            detailName.textContent = "Could not load product";
        }
    }

    loadProductDetails();

    // ================= PRODUCT SEARCH =================

    const productSearch = document.getElementById("product-search");

    if (productSearch) {
        productSearch.addEventListener("input", function () {
            const searchValue = productSearch.value.toLowerCase();

            const productCards =
                document.querySelectorAll(".product-card");

            productCards.forEach(card => {
                const productName = card
                    .querySelector("h3")
                    .textContent
                    .toLowerCase();

                card.style.display =
                    productName.includes(searchValue)
                        ? "block"
                        : "none";
            });
        });
    }

    // ================= CUSTOMER ORDERS =================

    function getStatusClass(status) {
        return (status || "Placed")
            .toLowerCase()
            .replace(/\s+/g, "-");
    }

async function loadOrders() {
    const ordersContainer =
        document.getElementById("orders-container");

    if (!ordersContainer) {
        return;
    }

    const customerName = localStorage.getItem("userName");

    if (!customerName) {
        ordersContainer.innerHTML =
            "<p>Please login to view your orders.</p>";
        return;
    }

    try {
        const [ordersResponse, productsResponse] =
            await Promise.all([
                fetch(
                    `/orders/${encodeURIComponent(customerName)}`
                ),
                fetch("/products")
            ]);

        const orders = await ordersResponse.json();
        const allProducts = await productsResponse.json();

        ordersContainer.innerHTML = "";

        if (!Array.isArray(orders) || orders.length === 0) {
            ordersContainer.innerHTML =
                "<p>No orders found.</p>";
            return;
        }

        orders.forEach(order => {
            const orderCard = document.createElement("div");

            orderCard.classList.add("order-card");

            const productDetails = order.products
                .map(product => {
                    const fullProduct = allProducts.find(
                        item => item.name === product.name
                    );

                    const image = fullProduct
                        ? fullProduct.image
                        : "";

                    const description = fullProduct
                        ? fullProduct.description
                        : "Product details unavailable.";

                    return `
                        <div class="order-product">
                            ${
                                image
                                    ? `<img
                                        src="${image}"
                                        alt="${product.name}"
                                    >`
                                    : ""
                            }

                            <div class="order-product-info">
                                <h4>${product.name}</h4>

                                <p>${description}</p>

                                <p>
                                    <strong>Price:</strong>
                                    ₹${product.price.toLocaleString("en-IN")}
                                </p>

                                <p>
                                    <strong>Quantity:</strong>
                                    ${product.quantity || 1}
                                </p>
                            </div>
                        </div>
                    `;
                })
                .join("");

            let actionHtml = "";

            if (order.status === "Delivered") {
                actionHtml = `
                    <button
                        class="return-order-btn"
                        onclick="returnOrder(${order.id})"
                    >
                        Return Order
                    </button>
                `;
            } else if (order.status === "Cancelled") {
                actionHtml = `
                    <p class="cancelled-text">
                        Order Cancelled ❌
                    </p>
                `;
            } else if (
                order.status === "Return Requested"
            ) {
                actionHtml = `
                    <p class="return-text">
                        Return Requested 🔄
                    </p>
                `;
            } else if (order.status === "Returned") {
                actionHtml = `
                    <p class="returned-text">
                        Order Returned ✅
                    </p>
                `;
            } else {
                actionHtml = `
                    <button
                        class="cancel-order-btn"
                        onclick="cancelOrder(${order.id})"
                    >
                        Cancel Order
                    </button>
                `;
            }

            orderCard.innerHTML = `
                <h3>Order #${order.id}</h3>

                <div class="order-products">
                    ${productDetails}
                </div>

                <p>
                    <strong>Total Amount:</strong>
                    ₹${order.total.toLocaleString("en-IN")}
                </p>

                <p>
                    <strong>Order Status:</strong>

                    <span
                        class="order-status ${getStatusClass(order.status)}"
                    >
                        ${order.status || "Placed"}
                    </span>
                </p>

                ${
                    order.payment_id
                        ? `
                            
                        `
                        : ""
                }

                <p>
    <strong>Payment Status:</strong>
    <span class="payment-paid">
        ${order.payment_status || "Pending"}
    </span>
</p>

${order.payment_id ? `
    <p>
        <strong>Payment ID:</strong>
        <span class="payment-id">
            ${order.payment_id}
        </span>
    </p>
` : ""}

<p>
    <strong>Order Date:</strong>
    ${order.order_date}
</p>

${actionHtml}
            `;

            ordersContainer.appendChild(orderCard);
        });

    } catch (error) {
        console.log(error);

        ordersContainer.innerHTML =
            "<p>Could not load orders.</p>";
    }
}

loadOrders();

    async function cancelOrder(orderId) {
        const confirmCancel = confirm(
            "Are you sure you want to cancel this order?"
        );

        if (!confirmCancel) {
            return;
        }

        try {
            const response = await fetch(
                `/orders/${orderId}/cancel`,
                {
                    method: "PUT"
                }
            );

            const data = await response.json();

            alert(data.message);

            if (data.success) {
                loadOrders();
            }
        } catch (error) {
            alert("Could not cancel order!");
        }
    }

    async function returnOrder(orderId) {
        const confirmReturn = confirm(
            "Are you sure you want to return this order?"
        );

        if (!confirmReturn) {
            return;
        }

        try {
            const response = await fetch(
                `/orders/${orderId}/return`,
                {
                    method: "PUT"
                }
            );

            const data = await response.json();

            alert(data.message);

            if (data.success) {
                loadOrders();
            }
        } catch (error) {
            alert("Could not request return!");
        }
    }

    // ================= ADMIN LOGIN =================

    const adminLoginForm =
        document.getElementById("admin-login-form");

    if (adminLoginForm) {
        adminLoginForm.addEventListener(
            "submit",
            async function (event) {
                event.preventDefault();

                const username =
                    document.getElementById("admin-username").value;

                const password =
                    document.getElementById("admin-password").value;

                try {
                    const response = await fetch("/admin/login", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            username,
                            password
                        })
                    });

                    const data = await response.json();

                    alert(data.message);

                    if (data.success) {
                        localStorage.setItem(
                            "adminLoggedIn",
                            "true"
                        );

                        window.location.href = "admin.html";
                    }
                } catch (error) {
                    alert("Admin login failed!");
                }
            }
        );
    }

    // ================= ADMIN PAGE PROTECTION =================

    const adminOrdersContainer =
        document.getElementById("admin-orders-container");

    const adminProductList =
        document.getElementById("admin-product-list");

    if (
        (adminOrdersContainer || adminProductList) &&
        localStorage.getItem("adminLoggedIn") !== "true"
    ) {
        alert("Admin login required!");
        window.location.href = "admin-login.html";
    }

    // ================= ADMIN LOGOUT =================

    async function adminLogout() {
        try {
            const response = await fetch("/admin/logout", {
                method: "POST"
            });

            const data = await response.json();

            localStorage.removeItem("adminLoggedIn");

            alert(data.message);

            window.location.href = "admin-login.html";
        } catch (error) {
            alert("Admin logout failed!");
        }
    }

    // ================= ADMIN ORDERS =================

    async function loadAdminOrders() {
        const container =
            document.getElementById("admin-orders-container");

        if (!container) {
            return;
        }

        try {
            const response = await fetch("/admin/orders");

            if (response.status === 401) {
                localStorage.removeItem("adminLoggedIn");
                alert("Admin login required!");
                window.location.href = "admin-login.html";
                return;
            }

            const orders = await response.json();
const totalOrders = orders.length;

const paidOrders = orders.filter(
    order => order.payment_status === "Paid"
).length;

const pendingOrders = orders.filter(
    order => order.payment_status !== "Paid"
).length;

const totalRevenue = orders
    .filter(order => order.payment_status === "Paid")
    .reduce((sum, order) => sum + order.total, 0);

document.getElementById("total-orders").textContent =
    totalOrders;

document.getElementById("paid-orders").textContent =
    paidOrders;

document.getElementById("pending-orders").textContent =
    pendingOrders;

document.getElementById("total-revenue").textContent =
    `₹${totalRevenue.toLocaleString("en-IN")}`;

            container.innerHTML = "";

            if (!Array.isArray(orders) || orders.length === 0) {
                container.innerHTML = "<p>No orders found.</p>";
                return;
            }

            const searchInput =
    document.getElementById("admin-order-search");

const paymentFilter =
    document.getElementById("payment-filter");

const statusFilter =
    document.getElementById("order-status-filter");

function displayAdminOrders(filteredOrders) {
    container.innerHTML = "";

    if (filteredOrders.length === 0) {
        container.innerHTML = "<p>No matching orders found.</p>";
        return;
    }

    filteredOrders.forEach(order => {
                const card = document.createElement("div");

                card.classList.add("order-card");

                const productDetails = order.products
    .map(product => `
        <div class="admin-order-product">
            <img
                src="${product.image}"
                alt="${product.name}"
            >

            <div>
                <h4>${product.name}</h4>

                <p>
                    ${product.description || "Product details"}
                </p>

                <p>
                    <strong>Price:</strong>
                    ₹${product.price.toLocaleString("en-IN")}
                </p>

                <p>
                    <strong>Quantity:</strong>
                    ${product.quantity || 1}
                </p>
            </div>
        </div>
    `)
    .join("");
                card.innerHTML = `
                    <h3>Order #${order.id}</h3>

                    <p>
                        <strong>Customer:</strong>
                        ${order.customer_name}
                    </p>

                    <div class="admin-order-products">
    ${productDetails}
</div>

                    <p>
    <strong>Total:</strong>
    ₹${order.total.toLocaleString("en-IN")}
</p>

<p>
    <strong>Payment Status:</strong>

    <span class="${
        order.payment_status === "Paid"
            ? "admin-payment-paid"
            : "admin-payment-pending"
    }">
        ${order.payment_status || "Pending"}
    </span>
</p>

${order.payment_id ? `
    <p>
        <strong>Payment ID:</strong>
        <span class="payment-id">
            ${order.payment_id}
        </span>
    </p>
` : ""}

<p>
    <strong>Order Date:</strong>
    ${order.order_date}
</p>

<p>
    <strong>Status:</strong>
                          <span class="order-status ${getStatusClass(order.status)}">
                            ${order.status}
                        </span>
                    </p>

                    <div class="admin-status-control">
    <label>Update Order Status</label>

    <select
        class="admin-status-select"
        onchange="updateOrderStatus(${order.id}, this.value)"
    >
    </div>
                        <option value="Placed"
                            ${order.status === "Placed" ? "selected" : ""}>
                            Placed
                        </option>

                        <option value="Processing"
                            ${order.status === "Processing" ? "selected" : ""}>
                            Processing
                        </option>

                        <option value="Delivered"
                            ${order.status === "Delivered" ? "selected" : ""}>
                            Delivered
                        </option>

                        <option value="Cancelled"
                            ${order.status === "Cancelled" ? "selected" : ""}>
                            Cancelled
                        </option>

                        <option value="Return Requested"
                            ${order.status === "Return Requested" ? "selected" : ""}>
                            Return Requested
                        </option>

                        <option value="Returned"
                            ${order.status === "Returned" ? "selected" : ""}>
                            Returned
                        </option>
                    </select>
                `;

                container.appendChild(card);
            });
            }

function applyAdminFilters() {
    const searchValue = searchInput.value.toLowerCase().trim();
    const paymentValue = paymentFilter.value;
    const statusValue = statusFilter.value;

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.customer_name.toLowerCase().includes(searchValue) ||
            order.id.toString().includes(searchValue);

        const matchesPayment =
            paymentValue === "All" ||
            (order.payment_status || "Pending") === paymentValue;

        const matchesStatus =
            statusValue === "All" ||
            order.status === statusValue;

        return matchesSearch &&
            matchesPayment &&
            matchesStatus;
    });

    displayAdminOrders(filteredOrders);
}

searchInput.oninput = applyAdminFilters;
paymentFilter.onchange = applyAdminFilters;
statusFilter.onchange = applyAdminFilters;

displayAdminOrders(orders);
        } catch (error) {
            container.innerHTML =
                "<p>Could not load admin orders.</p>";
        }
    }

    loadAdminOrders();

    async function updateOrderStatus(orderId, status) {
        try {
            const response = await fetch(
                `/admin/orders/${orderId}/status`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        status
                    })
                }
            );

            const data = await response.json();

            alert(data.message);

            if (response.status === 401) {
                localStorage.removeItem("adminLoggedIn");
                window.location.href = "admin-login.html";
                return;
            }

            if (data.success) {
                loadAdminOrders();
            }
        } catch (error) {
            alert("Could not update order status!");
        }
    }

    // ================= ADD PRODUCT =================

    const addProductForm =
        document.getElementById("add-product-form");

    if (addProductForm) {
        addProductForm.addEventListener(
            "submit",
            async function (event) {
                event.preventDefault();

                const name =
                    document.getElementById("product-name").value;

                const price = Number(
                    document.getElementById("product-price").value
                );

                const image =
                    document.getElementById("product-image").value;

                const description =
                    document.getElementById(
                        "product-description"
                    ).value;

                try {
                    const response = await fetch("/admin/products", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            name,
                            price,
                            image,
                            description
                        })
                    });

                    const data = await response.json();

                    alert(data.message);

                    if (response.status === 401) {
                        localStorage.removeItem("adminLoggedIn");
                        window.location.href = "admin-login.html";
                        return;
                    }

                    if (data.success) {
                        addProductForm.reset();
                        loadAdminProducts();
                    }
                } catch (error) {
                    alert("Could not add product!");
                }
            }
        );
    }

    // ================= ADMIN PRODUCTS =================

    async function loadAdminProducts() {
        const productList =
            document.getElementById("admin-product-list");

        if (!productList) {
            return;
        }

        try {
            const response = await fetch("/products");
            const products = await response.json();

            productList.innerHTML = "";

            products.forEach(product => {
                const productCard = document.createElement("div");

                productCard.classList.add("order-card");

                productCard.innerHTML = `
                    <h3>${product.name}</h3>

                    <p>
                        <strong>Price:</strong>
                        ₹${product.price.toLocaleString("en-IN")}
                    </p>

                    <p>
                        <strong>Image:</strong>
                        ${product.image}
                    </p>

                    <p>${product.description}</p>

                    <button onclick="editProduct(${product.id})">
                        Edit Product
                    </button>

                    <button
                        class="cancel-order-btn"
                        onclick="deleteProduct(${product.id})"
                    >
                        Delete Product
                    </button>
                `;

                productList.appendChild(productCard);
            });
        } catch (error) {
            productList.innerHTML =
                "<p>Could not load products.</p>";
        }
    }

    loadAdminProducts();

    async function deleteProduct(productId) {
        const confirmDelete = confirm(
            "Are you sure you want to delete this product?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            const response = await fetch(
                `/admin/products/${productId}`,
                {
                    method: "DELETE"
                }
            );

            const data = await response.json();

            alert(data.message);

            if (response.status === 401) {
                localStorage.removeItem("adminLoggedIn");
                window.location.href = "admin-login.html";
                return;
            }

            if (data.success) {
                loadAdminProducts();
            }
        } catch (error) {
            alert("Could not delete product!");
        }
    }

    async function editProduct(productId) {
        try {
            const response = await fetch(`/products/${productId}`);
            const product = await response.json();

            const name = prompt("Product Name:", product.name);

            if (name === null) {
                return;
            }

            const price = prompt("Product Price:", product.price);

            if (price === null) {
                return;
            }

            const image = prompt("Image Path:", product.image);

            if (image === null) {
                return;
            }

            const description = prompt(
                "Product Description:",
                product.description
            );

            if (description === null) {
                return;
            }

            const updateResponse = await fetch(
                `/admin/products/${productId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name,
                        price: Number(price),
                        image,
                        description
                    })
                }
            );

            const data = await updateResponse.json();

            alert(data.message);

            if (updateResponse.status === 401) {
                localStorage.removeItem("adminLoggedIn");
                window.location.href = "admin-login.html";
                return;
            }

            if (data.success) {
                loadAdminProducts();
            }
        } catch (error) {
            alert("Could not update product!");
        }
    }

    // ================= INITIAL LOAD =================

    updateCartCount();
    displayCart();

    function updateCartUserNavbar() {
    const userNav = document.getElementById("cart-user-nav");

    if (!userNav) {
        return;
    }

    const userName = localStorage.getItem("userName");

    if (userName) {
        userNav.innerHTML = `
            <span class="welcome-user">
                Welcome, ${userName}
            </span>

            <a href="orders.html">My Orders</a>

            <button class="nav-logout-btn" onclick="logoutUser()">
                Logout
            </button>
        `;
    } else {
        userNav.innerHTML = `
            <a href="login.html">Login</a>
        `;
    }
}

function logoutUser() {
    localStorage.removeItem("userName");
    window.location.href = "login.html";
}

updateCartUserNavbar();