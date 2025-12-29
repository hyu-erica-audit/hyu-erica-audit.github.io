
document.addEventListener("DOMContentLoaded", function() {
    // 푸터 불러오기
    fetch("/assets/components/footer.html")
        .then(response => {
            if (!response.ok) throw new Error("푸터 로드 실패");
            return response.text();
        })
        .then(data => {
            document.getElementById("footer-placeholder").innerHTML = data;
        })
        .catch(error => console.error("Error loading footer:", error));

    // 헤더(Navbar) 불러오기
    fetch("/assets/components/navbar.html")
        .then(response => {
            if (!response.ok) throw new Error("헤더 로드 실패");
            return response.text();
        })
        .then(data => {
            document.getElementById("navbar-placeholder").innerHTML = data;
            const currentPath = window.location.pathname;
            const navLinks = document.querySelectorAll('.navbar-nav .nav-link, .navbar-nav .dropdown-item');

            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href && currentPath.endsWith(href)) {
                    
                    link.classList.add('active');
                    
                    const parentDropdown = link.closest('.dropdown');
                    if (parentDropdown) {
                        parentDropdown.querySelector('.dropdown-toggle').classList.add('active');
                    }
                }
            });
        });
});

/* =========================================
   모바일: 메뉴 외부 클릭 시 자동으로 닫기
   ========================================= */
document.addEventListener('click', function(event) {

    /* 영역 검색 */
    const navbarCollapse = document.querySelector('.navbar-collapse');
    const navbarToggler = document.querySelector('.navbar-toggler');

    /* 메뉴 존재 확인 */
    if (!navbarCollapse || !navbarToggler) return;

    /* 메뉴 열림 상태 확인 */
    const isOpened = navbarCollapse.classList.contains('show');

    /* 외부 클릭 시 메뉴 닫기 */
    if (isOpened && !navbarCollapse.contains(event.target) && !navbarToggler.contains(event.target)) {

        const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse) || new bootstrap.Collapse(navbarCollapse, { toggle: false });
        
        bsCollapse.hide();
    }
});


/* =========================================
   서프페이지 헤더 생성. 사용방법 해당 페이지 참조
   ========================================= */
document.addEventListener("DOMContentLoaded", function() {
    const headerPlaceholder = document.getElementById('page-header-placeholder');

    if (headerPlaceholder) {
        const title = headerPlaceholder.getAttribute('data-title');
        const subtitle = headerPlaceholder.getAttribute('data-subtitle');
        const headerHTML = `
            <section class="page-header text-white py-5" style="background-color: var(--bg-darkgray);">
                <div class="container">
                    <div class="row">
                        <div class="col-12 text-center">
                            <h2 class="fw-bold mb-2">${title}</h2>
                            <p class="text-white-50 mb-0">${subtitle}</p>
                        </div>
                    </div>
                </div>
            </section>
        `;
        headerPlaceholder.innerHTML = headerHTML;
    }
});