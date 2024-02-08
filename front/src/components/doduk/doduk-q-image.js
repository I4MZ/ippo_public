import { useState, useCallback, useRef } from "react";
import DodukStopModal from "./doduk-stop-modal";
import PortalPopup from "../portal-popup";
import { useLocation, useNavigate } from "react-router-dom";
import ModalComponent from "./doduk-camera-modal";
import CameraComponent from "./doduk-camera-component";
import ImageUploader from "./doduk-image-upload";
import axios from "axios";
import LoadingGame from "./popo-runner-game/loading-game";
import PopoGameModal from "./popo-runner-game/popo-game-modal";

const DodukImage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const placeAnswer = location.state?.placeAnswer;
  const firstWord = location.state?.firstWord;
  const secondWord = location.state?.secondWord;
  const thirdWord = location.state?.thirdWord;
  const [isRequesting, setIsRequesting] = useState(false);
  const [isDodukStopModalPopupOpen, setDodukStopModalPopupOpen] =
    useState(false);

  const REACT_APP_TO_SPRING = process.env.REACT_APP_TO_SPRING;
  const REACT_APP_TO_DODUK = process.env.REACT_APP_TO_DODUK;
  const REACT_APP_TO_NODE = process.env.REACT_APP_TO_NODE;

  /*API 진행 사항을 가시적으로 확인하기 위한 progressbar 상태관리용 추가*/
  const [progress, setProgress] = useState(0);

  const updateProgress = (step) => {
    setProgress((prevProgress) => prevProgress + step);
  };
  /*--------------------------------------------------------------- */

  // 모달 추가해야함
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const generateImageForStory = async (originalFormData, storySummaryItem) => {
    let formData = new FormData();

    // 원본 formData에서 이미지 파일 복사
    if (originalFormData.has("image")) {
      formData.append("image", originalFormData.get("image"));
    }

    // 현재 storySummary 항목 추가
    formData.append("storySummary", storySummaryItem);

    try {
      const response = await axios.post(
        `/node/doduk/generateImage`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data.imageUrl;
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  };

  const storyStart = async (originalFormData) => {
    // 모달 가즈아
    // openModal();
    /* 요청이 진행중일때 추가 요청을 방지하기 위해 true로 세팅 */
    if (!isRequesting) {
      setIsRequesting(true);

      try {
        /* storyContents */
        let storyParts = [];
        /* fastAPI에서 받을 이미지 요약 내용들*/
        let storySummary = [];

        /* storyImg */
        let storyImgUrl = [];

        /* 첫번째 스토리와 요약 리퀘스트 */
        const introStoryResponse = await axios.post(
          `/doduk/introStory`,
          {
            place: placeAnswer,
            firstWord: firstWord,
            secondWord: secondWord,
            thirdWord: thirdWord,
          }
        );
        /* 생성된 첫번째 스토리를 storyParts에, 스토리 요약을 storySummary에 담음 */
        storyParts.push(introStoryResponse.data.story);
        storySummary.push(introStoryResponse.data.summary);
        const bookTitle = introStoryResponse.data.title;
        console.log(bookTitle);
        updateProgress(15);

        /* 두번째 스토리와 요약 리퀘스트 */
        const secondStoryResponse = await axios.post(
          `/doduk/secondStory`,
          {
            previous_story: storyParts[0],
            place: placeAnswer,
            firstWord: firstWord,
            secondWord: secondWord,
            thirdWord: thirdWord,
          }
        );
        /* 생성된 두번째 스토리를 storyParts에, 스토리 요약을 storySummary에 담음 */
        storyParts.push(secondStoryResponse.data.story);
        storySummary.push(secondStoryResponse.data.summary);
        updateProgress(17);

        /* 마지막 스토리와 요약 리퀘스트 */
        const endingStoryReponse = await axios.post(
          `/api/book/doduk/endingStory`,
          {
            previous_story: storyParts[1],
            place: placeAnswer,
            firstWord: firstWord,
            secondWord: secondWord,
            thirdWord: thirdWord,
          }
        );
        storyParts.push(endingStoryReponse.data.story);
        storySummary.push(endingStoryReponse.data.summary);
        updateProgress(17);

        console.log("1번째 이야기 : " + storyParts[0]);
        console.log("2번째 이야기 : " + storyParts[1]);
        console.log("3번째 이야기 : " + storyParts[2]);

        console.log("1번째스토리 요약 : " + storySummary[0]);
        console.log("2번째스토리 요약 : " + storySummary[1]);
        console.log("3번째스토리 요약 : " + storySummary[2]);

        /* node Express 이미지 생성 리스폰스 */
        //업로드&카메라 modal에서 넘어온 formData에 storySummary를 함께 보냄
        for (let i = 0; i < storySummary.length; i++) {
          const imageUrl = await generateImageForStory(
            originalFormData,
            storySummary[i]
          );
          if (imageUrl) {
            storyImgUrl.push(imageUrl);
            updateProgress(17);
            console.log("응답된 이미지 url체크 111 : " + storyImgUrl[i]);
          }
        }
        /*--------------------*/

        /* registStoryBook 로직 형성 */
        const registBookResponse = await axios.post(
          `/api/book/doduk/registStoryBook`,
          {
            bookTitle: bookTitle,
            bookImgUrl: storyImgUrl[0],
          }
        );
        console.log(registBookResponse.data.data);
        const newBookId = registBookResponse.data.data;

        /*--------------------*/
        for (let i = 0; i < storyParts.length; i++) {
          await axios.post(
            `/api/book/doduk/saveStoryToRedis`,
            {
              bookId: newBookId,
              storyNum: i + 1,
              storyContents: storyParts[i],
            }
          );
          console.log("react 스토리번호 : " + (i + 1));
          console.log("react 스토리 : " + storyParts[i]);
        }

        if (newBookId) {
          closeModal();
          navigate(`/book/doduk/${newBookId}/story/1`, {
            state: {
              placeAnswer: placeAnswer,
              storyImgUrl: storyImgUrl,
            },
          });
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsRequesting(false);
      }
    }
  };

  const canvasRef = useRef(null); // canvas에 대한 참조 생성
  const ctx = useRef(null); // 캔버스의 컨텍스트에 대한 참조 생성
  const [isRangeActive, setIsRangeActive] = useState(false); // 상태 변수 생성

  const [showCamera, setShowCamera] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const [isImageUploaderOpen, setImageUploaderOpen] = useState(false);

  const openImageUploader = () => {
    setImageUploaderOpen(true);
  };
  const closeImageUploader = () => {
    setImageUploaderOpen(false);
  };

  const drawImageOnCanvas = (imageUrl) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const image = new Image();
    image.onload = () => {
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
    image.src = imageUrl;
  };

  const openDodukStopModalPopup = useCallback(() => {
    setDodukStopModalPopupOpen(true);
  }, []);

  const closeDodukStopModalPopup = useCallback(() => {
    setDodukStopModalPopupOpen(false);
  }, []);
  /*--------------------*/

  return (
    <>
      <div style={{width:"1920px", height:"1080px"}} className="relative text-center font-jua overflow-hidden bg-[url('/public/dodukbackicon@2x.png')] bg-cover bg-no-repeat bg-[top] object-fit">
        <div style={{width:"710px", height:"324px", top:"167px", left:"96px"}} className="absolute bg-[url('/public/talkbubble@2x.png')] bg-contain bg-no-repeat bg-[top] object-fit">
          <div style={{paddingTop:"25px", fontSize:"38px", textShadow:"3px 0 0 #008edd, 0 3px 0 #008edd, -3px 0 0 #008edd, 0 -3px 0 #008edd"}} className="w-full h-auto text-white bg-transparent">
            <p className="m-0">좋아 우철아!</p>
            <p className="m-0">우철이의 얼굴을 보고싶어!</p>
            <p className="m-0">&nbsp;</p>
          </div>
        </div>
        <img
          style={{width:"80px", height:"80px", top:"32px", left:"1786px"}} 
          className="absolute object-fit cursor-pointer"
          alt=""
          src="/delete-4@2x.png"
          onClick={openDodukStopModalPopup}
        />
        <button
          style={{top:"400px", right:"205px", bottom:"703px", left:"1150px"}} 
          className="absolute cursor-pointer bg-transparent text-decoration-none flex flex-col items-start justify-start gap-10px"
          onClick={() => setIsCameraOpen(true)}
        >
          <img
            className=""
            alt=""
            src="/1920-doduk-choice-button-2@2x.png"
          />
          <div style={{fontSize:"45px", width:"110%", height:"112px"}} className="absolute mx-!important flex items-center justify-center shrink-0 z-1">
            카메라로 사진 찍기!
          </div>
        </button>
        <button
          style={{top:"600px", right:"205px", bottom:"703px", left:"1150px"}} 
          className="cursor-pointer bg-transparent [text-decoration:none] absolute top-[55.83vh] right-[10.68vw] bottom-[65.09vw] left-[55.30vw] flex flex-col items-start justify-start gap-[10px] text-[inherit]"
          onClick={openImageUploader}
        >
          <img
            className=""
            alt=""
            src="/1920-doduk-choice-button-2@2x.png"
          />
          <div style={{fontSize:"45px",  width: "110%", height: "112px"}} className="absolute text-[2.5vw] mx-[!important] top-[calc(50% - 25.5px)] left-[calc(50% - 252.5px)] flex items-center justify-center w-[505px] h-[62px] shrink-0 z-[1]">
            컴퓨터에 있는 사진 올리기!
          </div>
        </button>
        <div style={{width:"716px", height:"457px", top: "410px", right: "1155px", bottom: "303px", left: "77px" }} className="absolute h-[31.39%] w-[27.08%] top-[40vh] right-[60.16%] bottom-[28.06%] left-[4vw] flex flex-col bg-contain items-start justify-start p-2.5 box-border">
          <img
            style={{width:"100%", height:"100%"}}
            className="absolute w-[37.31vw] h-[23.81vw] object-fit"
            alt=""
            src="/1920-doduk-popo-1@2x.png"
          />
        </div>
      </div>

      <PopoGameModal
        isOpen={isModalOpen}
        onClose={closeModal}
        progress={progress}
      >
        <LoadingGame />
      </PopoGameModal>
      {/* ImageUploader 컴포넌트를 ModalComponent로 감싸서 표시 */}
      <ModalComponent isOpen={isImageUploaderOpen}>
        <ImageUploader
          onClose={() => closeImageUploader(false)}
          onImageProcessed={drawImageOnCanvas}
          openModal={openModal}
          storyStart={storyStart}
        />
      </ModalComponent>
      <ModalComponent isOpen={isCameraOpen}>
        <CameraComponent
          onClose={() => setIsCameraOpen(false)}
          onImageProcessed={drawImageOnCanvas}
          openModal={openModal}
          storyStart={storyStart}
        />
      </ModalComponent>
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

export default DodukImage;
