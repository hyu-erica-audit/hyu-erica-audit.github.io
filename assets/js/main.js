function loadComponent(selector, url, onLoad) {
    const placeholder = document.querySelector(selector);

    if (!placeholder) return;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`${url} load failed`);
            }

            return response.text();
        })
        .then(html => {
            placeholder.innerHTML = html;

            if (typeof onLoad === "function") {
                onLoad(placeholder);
            }
        })
        .catch(error => console.error(`Error loading ${url}:`, error));
}

function activateCurrentNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll(".navbar-nav .nav-link, .navbar-nav .dropdown-item");

    navLinks.forEach(link => {
        const href = link.getAttribute("href");

        if (!href || !currentPath.endsWith(href)) return;

        link.classList.add("active");

        const parentDropdown = link.closest(".dropdown");
        const dropdownToggle = parentDropdown?.querySelector(".dropdown-toggle");

        if (dropdownToggle) {
            dropdownToggle.classList.add("active");
        }
    });
}

function escapeHtmlText(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function createPageHeader() {
    const headerPlaceholder = document.getElementById("page-header-placeholder");

    if (!headerPlaceholder) return;

    const title = escapeHtmlText(headerPlaceholder.getAttribute("data-title"));
    const subtitle = escapeHtmlText(headerPlaceholder.getAttribute("data-subtitle"));

    headerPlaceholder.innerHTML = `
        <section class="page-header">
            <div class="container">
                <div class="row">
                    <div class="col-12 text-center">
                        <p class="page-header-eyebrow">${subtitle}</p>
                        <h1 class="page-header-title">${title}</h1>
                    </div>
                </div>
            </div>
        </section>
    `;
}

function closeMobileNavbarOnOutsideClick(event) {
    const navbarCollapse = document.querySelector(".navbar-collapse");
    const navbarToggler = document.querySelector(".navbar-toggler");

    if (!navbarCollapse || !navbarToggler) return;

    const isOpened = navbarCollapse.classList.contains("show");
    const clickedOutsideNavbar = !navbarCollapse.contains(event.target) && !navbarToggler.contains(event.target);

    if (!isOpened || !clickedOutsideNavbar) return;

    const bsCollapse =
        bootstrap.Collapse.getInstance(navbarCollapse) ||
        new bootstrap.Collapse(navbarCollapse, { toggle: false });

    bsCollapse.hide();
}

document.addEventListener("DOMContentLoaded", () => {
    loadComponent("#footer-placeholder", "/assets/components/footer.html");
    loadComponent("#navbar-placeholder", "/assets/components/navbar.html", activateCurrentNavLink);
    createPageHeader();
});

document.addEventListener("click", closeMobileNavbarOnOutsideClick);
