/*

위쪽이 최신글임

id: 공지사항 순서 1부터 증가
type: 배지 타입 (필독, 일반)
title: 공지사항 제목
author: 작성자
date: 작성일 (YYYY.MM.DD 형식)
link: 공지사항 상세페이지 링크
content: 공지사항 내용 (HTML)

*/
const noticeList = [
    {
        id: 2,
        type: "일반",
        title: "[모집중] 2026학년도 제7대 중앙감사위원회 신입 위원 모집 안내",
        author: "중감위",
        date: "2026.01.01",
        link: "/pages/notice/view.html?id=2",
        content: `
            <p>안녕하십니까, 제7대 중앙감사위원장입니다.</p>
            <p>2026학년도 신입 위원을 모집합니다.</p>
            <p>상세 모집 내용은 상단 [알림/위원 선출 공고]를 참고해주시기 바랍니다.</p>
            <p>감사합니다.</p>
        `
    },
    {
        id: 1,
        type: "일반",
        title: "홈페이지 개설 안내",
        author: "중감위",
        date: "2026.01.01",
        link: "/pages/notice/view.html?id=1",
        content: `
            <p>안녕하십니까, 한양대학교 ERICA 제7대 중앙감사위원회입니다.</p>
            <p>보다 원활한 정보 제공을 위해 홈페이지를 개설하였습니다.</p>
            <p>앞으로 많은 관심과 이용 부탁드립니다.</p>
            <p>감사합니다.</p>
        `
    }
];