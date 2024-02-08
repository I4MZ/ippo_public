import React, { forwardRef, useEffect, useRef } from 'react';
import {
  updateGround,
  setupGround,
} from './ground.js'; // Import functions from the ground.js file
import {
  updateStar,
  setupStar,
  getStarRects,
} from './star.js'; // Import functions from the star.js file
import{
    updatePopo,
    setupPopo,
    getPopoRect,
    setPopoLose,
} from './popo.js';
import './styles.css'
import './modal.css'

// ... other imports and setup ...

const LoadingGame = forwardRef((props, ref) => {
    // 각 ground 요소에 대한 참조 생성
    const groundRef1 = useRef(null);
    const groundRef2 = useRef(null);
    const popoRef = useRef(null);
    const worldRef = useRef(null);
    const scoreRef = useRef(null);
    const startScreenRef = useRef(null);


    let startGame = false;
    useEffect(() => {
        
        const modal = document.querySelector('.modal-content')
        const WORLD_WIDTH = 100;
        const WORLD_HEIGHT = 30;
        const SPEED_SCALE_INCREASE = 0.00001;

        setPixelToWorldScale();

        let lastTime;
        let speedScale;
        let score;

        function update(time) {
        if (lastTime == null) {
            lastTime = time;
            window.requestAnimationFrame(update);
            return;
        }
        
        if(startGame && (popoRef.current === null)){
            return;
        }
        const delta = time - lastTime;
        
        updateGround(delta, speedScale, [groundRef1.current, groundRef2.current]);
        updatePopo(delta, speedScale, popoRef.current);
        updateStar(delta, speedScale, worldRef.current);
        updateSpeedScale(delta);
        updateScore(delta);
        if (checkLose()){
            return handleLose();
        }
        lastTime = time;
        startGame = true;
        window.requestAnimationFrame(update);
        }

        function checkLose() {
        const popoRect = getPopoRect(popoRef.current);
        return getStarRects().some((rect) => isCollision(rect, popoRect));
        }

        function isCollision(rect1, rect2) {
        return (
            rect1.left +30 < rect2.right -20 &&
            rect1.top +40 < rect2.bottom  &&
            rect1.right -40> rect2.left  +20 &&
            rect1.bottom +40> rect2.top 
        );
        }

        function updateSpeedScale(delta) {
        speedScale += delta * SPEED_SCALE_INCREASE;
        }

        function updateScore(delta) {
        score += delta * 0.01;
        scoreRef.current.textContent = Math.floor(score);
        }

        function handleStart() {
        // 기존의 이벤트 리스너 제거
        modal.removeEventListener("click", handleStart);
        document.removeEventListener("keydown", handleStart);
        

        lastTime = null;
        speedScale = 0.8;
        score = 0;
        setupGround([groundRef1.current, groundRef2.current]);
        setupPopo(popoRef.current, modal);
        setupStar(worldRef.current);

        startScreenRef.current.classList.add('hide');
        window.requestAnimationFrame(update);
        }

        function handleLose() {
        setPopoLose(popoRef.current);
        setTimeout(() => {
            
            modal.addEventListener("click", handleStart, { once: true });
            document.addEventListener("keydown", handleStart, { once: true });
            

            startScreenRef.current.classList.remove('hide');
        }, 100);
        }

        function setPixelToWorldScale() {
        let worldToPixelScale;
        if (window.innerWidth / window.innerHeight < WORLD_WIDTH / WORLD_HEIGHT) {
            worldToPixelScale = window.innerWidth / WORLD_WIDTH;
        } else {
            worldToPixelScale = window.innerHeight / WORLD_HEIGHT;
        }

        // worldRef.current.style.width = `${WORLD_WIDTH * worldToPixelScale}px`;
        worldRef.current.style.height = `${WORLD_HEIGHT * worldToPixelScale}px`;
        }

        // 초기 시작 이벤트 리스너 추가
        modal.addEventListener("click", handleStart, { once: true });
        document.addEventListener("keydown", handleStart, { once: true });

        // Cleanup 함수 (언마운트 시 이벤트 리스너 제거)
        return () => {
        
        // document.removeEventListener('keydown', handleStart);
        // document.removeEventListener('click', handleStart);

        modal.removeEventListener('keydown', handleStart);
        modal.removeEventListener('click', handleStart);

        };
    }, []);

    return (
        <div ref={worldRef} className="world" data-world>
            <div ref={scoreRef} className="score" data-score>0</div>
            <div ref={startScreenRef} className="start-screen" data-start-screen>아무키나 눌러 시작하세요!<br/>스페이스바로 점프!</div>
            <img ref={groundRef1} src="/imgs/ground.png" className="ground" data-ground alt="Ground" />
            <img ref={groundRef2} src="/imgs/ground.png" className="ground" data-ground alt="Ground" />
            <img ref={popoRef} src="/imgs/popo-stationary.png" className="popo" data-popo alt="Popo Character" />
        </div>
    );
});

export default LoadingGame;