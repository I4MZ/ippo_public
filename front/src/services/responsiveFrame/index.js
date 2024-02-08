import "./style.css";

/**
 * @param {number} 원본 화면의 width (px 단위)
 * @param {number} 원본 화면의 height (px 단위)
 * @return {function()} 현재 화면의 크기대로 frame을 조정하는 함수
 */
export const getResizeEventListener = (standardWidth, standardHeight) => {
    return () => {
        const root = document.querySelector("#root");
        const app = document.querySelector("#App");

        // 원하는 해상도로 width, height 고정
        app.style.width = `${standardWidth}px`;
        app.style.height = `${standardHeight}px`;

        let width = root.clientWidth;
        let height = width * (standardHeight / standardWidth);

        // style.zoom을 이용하여 화면 크기 조정
        app.style.zoom = height / standardHeight;

        if (height > root.clientHeight) {
            height = root.clientHeight;
            width = height * (standardWidth / standardHeight);
            app.style.zoom = width / standardWidth;
        }
    };
};
