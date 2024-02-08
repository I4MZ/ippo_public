import { useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import DodukStopModal from "../../components/doduk/doduk-stop-modal";
import PortalPopup from "../../components/portal-popup";
import axios from "axios";

const DodukSecond = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const placeAnswer = location.state?.placeAnswer;
  const storyImgUrl = location.state?.storyImgUrl;

  const [fullStory, setFullStory] = useState("");

  const REACT_APP_TO_SPRING = process.env.REACT_APP_TO_SPRING;

  const storyNum = 2;

  /* 백그라운드 이미지 상태관리 */
  const [backgroundImage, setBackgroundImage] = useState("/4262432-1@2x.png");

  useEffect(() => {
    if (placeAnswer === "숲") {
      setBackgroundImage("/5319163.jpg");
    } else if (placeAnswer === "도시") {
      setBackgroundImage("/3972.jpg");
    }
    fetchStory();
  }, [placeAnswer, bookId]);

  const fetchStory = async () => {
    try {
      const response = await axios.get(
        // `http://${REACT_APP_TO_SPRING}/api/book/doduk/${bookId}/story/${storyNum}`
        `/api/book/doduk/${bookId}/story/${storyNum}`
              );
      setFullStory(response.data);
    } catch (error) {
      console.error("스토리 출력에서 에러 발생", error);
    }
  };

  /* 페이징 관리 */
  const [currentPage, setCurrentPage] = useState(0);
  /* 스프링 바인딩을 기준으로 페이지 텍스트 영역을 조절할 용도 */
  const [pageText, setPageText] = useState([]);

  useEffect(() => {
    if (fullStory) {
      const charsPerPage = 140;
      const pages = [];
      let startIndex = 0;

      while (startIndex < fullStory.length) {
        let endIndex = startIndex + charsPerPage;
        if (endIndex < fullStory.length) {
          let periodIndex = fullStory.lastIndexOf(".", endIndex);
          if (periodIndex <= startIndex) {
            periodIndex = fullStory.indexOf(".", endIndex);
          }
          endIndex = periodIndex !== -1 ? periodIndex + 1 : endIndex;
        }
        // 현재 페이지의 텍스트를 가져와 문장의 끝마다 줄바꿈을 추가합니다.
        const pageText = fullStory
          .substring(startIndex, endIndex)
          .replace(/([.\"\'])\s/g, "$1\n");
        pages.push(pageText);
        startIndex = endIndex;
      }

      setPageText(pages);
    }
  }, [fullStory]);

  /*페이지 넘김 처리 */
  const goToNextPage = async () => {
    const nextPage = currentPage + 1;
    if (nextPage < pageText.length) {
      // 아직 마지막 페이지가 아니라면, 다음 페이지로 이동
      setCurrentPage(nextPage);
    } else if (nextPage === pageText.length) {
      // 마지막 페이지에 도달했다면, 다음 네비게이트로 이동
      await callRecyclingGamePage();
    }
  };

  const goToPrevPage = () => {
    setCurrentPage((prevCurrentPage) => Math.max(prevCurrentPage - 2, 0));
  };

  /* api 중복 요청 방지를 위한 상태 관리 */
  const [isRequesting, setIsRequesting] = useState(false);

  const callRecyclingGamePage = async () => {
    if (!isRequesting) {
      setIsRequesting(true);

      try {
        const saveResponse = await axios.post(
          // `http://${REACT_APP_TO_SPRING}/api/book/doduk/saveStory`,
          `/api/book/doduk/saveStory`,
                    {
            bookId: bookId,
            storyNum: storyNum,
            storyContents: fullStory,
            storyImgUrl: storyImgUrl[1],
            place: placeAnswer,
          }
        );
        console.log("저장 응답:", saveResponse.data);
      } catch (error) {
        console.error("저장 중 에러 발생", error);
      }

      navigate(`/${bookId}/doduk-recycling-game`, {
        state: {
          placeAnswer: placeAnswer,
          storyImgUrl: storyImgUrl,
        },
      });
      setIsRequesting(false);
      /* 다른 navigate 호출 후 false로 세팅해 요청 다시 가능하게끔 함 */
    }
  };
  /* -------------------------- */

  /* 스탑모달 */
  const [isDodukStopModalPopupOpen, setDodukStopModalPopupOpen] =
    useState(false);

  const openDodukStopModalPopup = useCallback(() => {
    setDodukStopModalPopupOpen(true);
  }, []);

  const closeDodukStopModalPopup = useCallback(() => {
    setDodukStopModalPopupOpen(false);
  }, []);
  /* ---------------------------- */

  console.log(fullStory);

  return (
    <>
      <div className="relative w-full overflow-hidden" style={{height: "1080px"}}>
        <div className="absolute" style={{top: "-1166px", left: "-1059px", width: "3000px", height: "2000px"}}>
          <img
            className="absolute object-fit" style={{top: "754px", left: "861px", width: "3000px", height: "2000px"}}
            alt="background"
            src={backgroundImage}
          />
        </div>
        {/* 텍스트 오버레이 부분 */}
        <div className="relative overflow-hidden" style={{top: "96px", left: "73px", width: "1753px", height: "924px"}}>
          <img
            className="absolute object-cover" style={{width: "100%", height: " &#8203;``【oaicite:0】``&#8203; 100%"}}
            alt="Notebook"
            src="/image-22@2x.png"
          />

          {/* 왼쪽 페이지 영역 - 첫 번째 페이지일 때 이미지, 그 외에는 텍스트 */}
          {currentPage === 0 ? (
            <div
              className="absolute overflow-auto"
              style={{left: "15px", width: "800px", height: "100%", padding: "73px"}}
            >
              <img
                className="object-cover"
                alt="Story Image"
                src={storyImgUrl[1]}
                style={{width: "100%", height: "100%", borderRadius: "20px"}}
              />
            </div>
          ) : (
            <div
              className="absolute overflow-auto text-[1.8vw]"
              style={{top: "20px", left: "15px", width: "800px", height: "100%", padding: "73px", fontSize: "35px"}}
            >
              <div className="text-area">
                {pageText[currentPage - 1] && // currentPage - 1을 사용하여 왼쪽 페이지 텍스트를 표시
                  pageText[currentPage - 1]
                    .split("\n")
                    .map((sentence, index) => (
                      <p className="doduk_story_word" key={index}>
                        {sentence}
                      </p>
                    ))}
              </div>
            </div>
          )}

          {/* 오른쪽 페이지 텍스트 */}
          <div
            className="absolute overflow-auto text-[1.8vw]"
            style={{top: "20px", right: "13px", width: "800px", height: "100%", padding: "73px", fontSize: "35px"}}
          >
            <div className="text-area">
              {pageText[currentPage] &&
                pageText[currentPage].split("\n").map((sentence, index) => (
                  <p className="doduk_story_word" key={index}>
                    {sentence}
                  </p>
                ))}
            </div>
          </div>
            {/* 마지막 페이지면 끝내기 버튼을, 아니면 다음 페이지 버튼을 출력 */}
            {currentPage === pageText.length - 1 ? (
              <button
                style={{width:"550px", height:"100px", top:"740px", right:"205px", bottom:"703px", left:"1070px", fontSize:"48px"}}
                className="cursor-pointer bg-transparent text-decoration-none absolute flex flex-col items-start justify-start gap-10px"
                onClick={goToNextPage}
              >
                <img
                  className="self-stretch flex-1 relative max-w-full overflow-hidden max-h-full z-0"
                  alt=""
                  src="/1920-doduk-choice-button-2@2x.png"
                />
                <div 
                  style={{fontSize:"48px", fontFamily:"HakgyoansimGgooreogiR", width:"505px", height:"62px", top:"calc(50% - 25.5px)", left:"calc(50% - 252.5px)"}}
                  className="absolute mx-!important flex items-center justify-center shrink-0 z-1"
                >
                  분리수거 하러가기!
                </div>
              </button>
          ) : (
            <img
	    	style={{top: "679px", left: "1530px", width: "211px", height: "227px"}}
              className="cursor-pointer absolute object-fit"
              alt="nextPage"
              src="/pngwing-7@2x.png"
              onClick={goToNextPage}
              autoFocus={true}
            />
          )}
        </div>

          <img
            style={{top: "11px", left: "1786px", width: "80px", height: "80px"}}
            className="absolute object-fit cursor-pointer"
            alt=""
            src="/delete-4@2x.png"
            onClick={openDodukStopModalPopup}
          />

          {currentPage != 0 && (
            <button
              style={{top: "11px", left: "38px", width: "80px", height: "80px"}}
              className="cursor-pointer [border:none] p-0 bg-[transparent] absolute bg-[url('/public/previous6@2x.png')] bg-cover bg-no-repeat bg-[top]"
              autoFocus={true}
              onClick={goToPrevPage}
            />
          )}
      </div>
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

export default DodukSecond;
