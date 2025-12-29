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
            if (!response.ok) throw new Error("헤더 로드 실패");
            return response.text();
        })
        .then(data => {
            document.getElementById("navbar-placeholder").innerHTML = data;
        })
        .catch(error => console.error("Error loading navbar:", error));
});