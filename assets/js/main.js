
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