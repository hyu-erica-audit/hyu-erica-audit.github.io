// assets/js/main.js

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
            if (!response.ok) throw new Error("헤더 로드 실패"); // 에러 체크 추가
            return response.text();
        })
        .then(data => {
            // [수정 포인트] "nav" 태그 대신 id="navbar-placeholder"를 찾아서 넣기
            document.getElementById("navbar-placeholder").innerHTML = data;
            
            // ==========================================
            // [추가] 현재 페이지 주소에 맞는 메뉴에 'active' 클래스 주기
            // ==========================================
            const currentPath = window.location.pathname;
            
            // 주의: 이제 HTML이 삽입된 후이므로, document에서 다시 찾아야 함
            const navLinks = document.querySelectorAll('.navbar-nav .nav-link, .navbar-nav .dropdown-item');

            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                // href가 null일 경우 에러 방지
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