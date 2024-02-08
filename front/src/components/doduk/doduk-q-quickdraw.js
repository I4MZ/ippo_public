import { useState, useCallback, useEffect } from "react";
import DodukStopModal from "./doduk-stop-modal";
import PortalPopup from "../portal-popup";
import { useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import "./css/quickdraw-game.css";

const DodukQQuickdraw = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const placeAnswer = location.state?.placeAnswer;

  const [isDodukStopModalPopupOpen, setDodukStopModalPopupOpen] =
    useState(false);

  // 버튼에 텍스트 담을 변수
  let wordButton1;
  let wordButton2;
  let wordButton3;

  // 다음 페이지로 넘길 단어 3개
  let resultWords = [];

  const handleClick = () => {
    navigate("/doduk-q-image", {
      state: {
        placeAnswer: placeAnswer,
        firstWord: resultWords[0],
        secondWord: resultWords[1],
        thirdWord: resultWords[2],
      },
    });
  };

  const draw = () => {
    // 그림 결과를 가져오기
    var recognizeWord = document.getElementById(
      "predict-main-window"
    ).textContent;
    if (recognizeWord === "") {
      alert("그림을 그려주세요!");
    } else {
      // 3개의 결과를 가져와서 쪼개기(리스트화)
      const word = recognizeWord.split(",");
      // 버튼 텍스트 변수에 넣기
      wordButton1 = word[0];
      wordButton2 = word[1];
      wordButton3 = word[2];

      // 버튼을 셋팅해줄 함수에 리스트 보내주기
      setSelectWord(word);
    }
  };

  // 버튼을 셋팅해주는 함수
  const setSelectWord = (word) => {
    if (!(word === null)) {
      var quickdrawButton = document.getElementById("quickdraw-word-button");
      var firstWordButton = document.getElementById("quickdraw-firstWord");
      var secondWordButton = document.getElementById("quickdraw-secondWord");
      var thirdWordButton = document.getElementById("quickdraw-thirdWord");
      firstWordButton.textContent = word[0];
      secondWordButton.textContent = word[1];
      thirdWordButton.textContent = word[2];

      // 애니메이션을 위한
      quickdrawButton.style.display = "block";
      setTimeout(() => {
        quickdrawButton.style.opacity = "1";
      }, 20); // 10ms의 지연시간은 display 변경 후 opacity 변화를 위함
    } else {
      console.log("오류가 발생하였습니다.");
    }
  };

  // 다시 그릴래요 버튼을 누르면 버튼이 사라짐
  const reDraw = () => {
    var quickdrawButton = document.getElementById("quickdraw-word-button");
    quickdrawButton.style.opacity = "0";
    setTimeout(() => {
      quickdrawButton.style.display = "none";
    }, 300);
    clearCanvas();
  };

  const clearCanvas = () => {
    var clearButton = document.getElementById("clear-button");
    clearButton.click();
  };

  // 버튼을 선택하면 resultWorlds에 하나씩 추가 됨
  const selectWord = (num) => {
    if (num === 1) {
      console.log(wordButton1);
      // 결과 단어 리스트에 push
      resultWords.push(wordButton1);
      // 다음 질문으로 만약 마지막이라면 다음페이지로 넘기기
      nextQuestion();
      // 버튼 내리기
      reDraw();
    } else if (num === 2) {
      console.log(wordButton2);
      resultWords.push(wordButton2);
      nextQuestion();
      reDraw();
    } else if (num === 3) {
      console.log(wordButton3);
      resultWords.push(wordButton3);
      nextQuestion();
      reDraw();
    }
  };

  const nextQuestion = () => {
    var colorEdit = document.getElementById("favorite-word");
    if (resultWords.length <= 1) {
      colorEdit.textContent = "좋아하는 동물";
      colorEdit.style.color = "springgreen";
    } else if (resultWords.length === 2) {
      colorEdit.textContent = "싫어하는 물건이나 동물";
      colorEdit.style.color = "fuchsia";
    } else if (resultWords.length > 2) {
      console.log(resultWords);
      handleClick();
    }
  };
  useEffect(() => {
    // 스크립트 엘리먼트를 생성합니다
    const script = document.createElement("script");
    script.src = "/js/bundle.min.js";
    script.type = "text/javascript";
    script.async = true;

    // 스크립트를 body의 끝에 추가합니다
    document.body.appendChild(script);

    // 컴포넌트가 언마운트될 때 스크립트를 정리합니다
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const openDodukStopModalPopup = useCallback(() => {
    setDodukStopModalPopupOpen(true);
  }, []);

  const closeDodukStopModalPopup = useCallback(() => {
    setDodukStopModalPopupOpen(false);
  }, []);
  /*--------------------*/

  return (
    <>
      <a className="">
        <div className="">
          <div className="">
            <div className="">
              <p className="">좋아! 나도 {placeAnswer} 좋아해!</p>
              <p className="">
                다음으로{" "}
                <span id="favorite-word" style={{ color: "salmon" }}>
                  좋아하는 물건
                </span>
                을 그려줘!
              </p>
              <p className="m-0">&nbsp;</p>
            </div>
          </div>
          <img
            className="absolute top-[3vh] left-[93vw] w-[4.6875vw] h-[5.0000vw] object-fit cursor-pointer"
            alt=""
            src="/delete-4@2x.png"
            onClick={openDodukStopModalPopup}
          />
          <Helmet>
            <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
          </Helmet>
          <div
            id="quickdraw-word-button"
            style={{ display: "none", opacity: "0" }}
          >
            <h2
              id="quickdraw-word-comment"
              className="absolute absolute bg-transparent [text-decoration:none] absolute h-[5.1583vw] w-[31.9302vw] top-[23.9302vh] right-[10.6802vw] bottom-[65.0901vw] left-[60.3000vw] flex flex-col items-start justify-start gap-[10px] text-[inherit]"
              style={{ fontSize: "40px" }}
            >
              혹시 이곳에 우철이가 그린 그림이 있어?
            </h2>
            <button
              className="absolute cursor-pointer absolute bg-transparent [text-decoration:none] absolute h-[5.1583vw] w-[31.9302vw] top-[30.9302vh] right-[10.6802vw] bottom-[65.0901vw] left-[60.3000vw] flex flex-col items-start justify-start gap-[10px] text-[inherit]"
              onClick={() => selectWord(1)}
            >
              <img
                className="self-stretch flex-1 relative max-w-full overflow-hidden max-h-full object-fit z-[0]"
                alt=""
                src="/1920-doduk-choice-button-2@2x.png"
              />
              <div className="absolute text-[2.5vw] mx-[!important] top-[calc(50%_-_23.5px)] left-[calc(50%_-_252.5px)] flex items-center justify-center w-[505px] h-[62px] shrink-0 z-[1]">
                <p id="quickdraw-firstWord"></p>
              </div>
            </button>
            <button
              className="cursor-pointer bg-transparent [text-decoration:none] absolute h-[5.1583vw] w-[31.9302vw] top-[40.8302vh] right-[10.6802vw] bottom-[65.0901vw] left-[60.3000vw] flex flex-col items-start justify-start gap-[10px] text-[inherit]"
              onClick={() => selectWord(2)}
            >
              <img
                className="self-stretch flex-1 relative max-w-full overflow-hidden max-h-full object-fit z-[0]"
                alt=""
                src="/1920-doduk-choice-button-2@2x.png"
              />
              <div className="absolute text-[2.5vw] mx-[!important] top-[calc(50%_-_25.5px)] left-[calc(50%_-_252.5px)] flex items-center justify-center w-[505px] h-[62px] shrink-0 z-[1]">
                <p id="quickdraw-secondWord"></p>
              </div>
            </button>
            <button
              className="absolute cursor-pointer bg-transparent [text-decoration:none] absolute h-[5.1583vw] w-[31.9302vw] top-[50.7401vh] right-[10.6802vw] bottom-[65.0901vw] left-[60.3000vw] flex flex-col items-start justify-start gap-[10px] text-[inherit]"
              onClick={() => selectWord(3)}
            >
              <img
                className="self-stretch flex-1 relative max-w-full overflow-hidden max-h-full object-fit z-[0]"
                alt=""
                src="/1920-doduk-choice-button-2@2x.png"
              />
              <div className="absolute text-[2.5vw] mx-[!important] top-[calc(50%_-_25.5px)] left-[calc(50%_-_252.5px)] flex items-center justify-center w-[505px] h-[62px] shrink-0 z-[1]">
                <p id="quickdraw-thirdWord"></p>
              </div>
            </button>
            <button
              className="absolute cursor-pointer bg-transparent [text-decoration:none] absolute h-[5.1583vw] w-[31.9302vw] top-[60.7401vh] right-[10.6802vw] bottom-[65.0901vw] left-[60.3000vw] flex flex-col items-start justify-start gap-[10px] text-[inherit]"
              // id="clear-button"
              style={{ backgroundColor: "none" }}
              onClick={reDraw}
            >
              <img
                className="self-stretch flex-1 relative max-w-full overflow-hidden max-h-full object-fit z-[0]"
                alt=""
                src="/1920-doduk-choice-button-2@2x.png"
              />
              <div className="absolute text-[2.5vw] mx-[!important] top-[calc(50%_-_25.5px)] left-[calc(50%_-_252.5px)] flex items-center justify-center w-[505px] h-[62px] shrink-0 z-[1]">
                <p id="quickdraw-redraw">다시 그릴래요</p>
              </div>
            </button>
          </div>

          <div className="index-container" id="index-container">
            <div className="preloader" id="preloader"></div>
            <div className="index-content index-content_pading">
              <div className="content__info">
                <div className="info__nav info__nav_padding">
                  <button
                    className="nav__button pen-button"
                    id="pen-button"
                  ></button>
                  <button
                    className="nav__button clear-button"
                    id="clear-button"
                  ></button>
                  <button
                    className="nav__button hint-button"
                    id="hint-button"
                  ></button>
                  <button
                    className="nav__button complete-button"
                    id="complete-button"
                    onClick={draw}
                  ></button>
                </div>
              </div>
              <div className="content__drowing" id="content__drowing">
                <div
                  className="canvas__wrapper wrapper__pointer25"
                  id="canvas__wrapper"
                >
                  <canvas
                    className="content__canvas"
                    id="content__canvas"
                    width="300"
                    height="150"
                  ></canvas>
                </div>
                <div className="canas-veil"></div>
                <div className="predict-window__wrapper">
                  <div className="content__predict-window" id="predict-window">
                    <div
                      className="main-window main-window_ellipsis main-window_padding"
                      id="predict-main-window"
                    ></div>
                    <div className="tail-window"></div>
                  </div>
                </div>
              </div>

              <canvas
                id="canv2"
                width="64"
                height="64"
                style={{ outline: "1px solid #000", display: "none" }}
              ></canvas>
            </div>
          </div>
          <div className="absolute h-[31.39%] w-[27.08%] top-[40vh] right-[60.16%] bottom-[28.06%] left-[4vw] flex flex-col bg-contain items-start justify-start p-2.5 box-border">
            <img
              className="absolute w-[37.3134vw] h-[23.8060vw] object-fit"
              alt=""
              src="/1920-doduk-popo-1@2x.png"
            />
          </div>
        </div>
      </a>
      {isDodukStopModalPopupOpen && (
        <PortalPopup
          overlayColor="rgba(113, 113, 113, 0.3)"
          placement="Centered"
          onOutsideClick={closeDodukStopModalPopup}
        >
          <DodukStopModal onClose={closeDodukStopModalPopup} />
        </PortalPopup>
      )}
    </>
  );
};

export default DodukQQuickdraw;
