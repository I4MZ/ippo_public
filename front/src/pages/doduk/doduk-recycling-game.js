import { useState, useCallback, useEffect, useRef } from "react";
import DodukStopModal from "../../components/doduk/doduk-stop-modal";
import PortalPopup from "../../components/portal-popup";
import { useLocation, Link, useParams, useNavigate } from "react-router-dom";
import {
  GestureRecognizer,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

import "./css/hand-game.css";


const DodukRecyclingGame = () => {
  const location = useLocation();
  const { bookId } = useParams();
  const navigate = useNavigate();
  const placeAnswer = location.state?.placeAnswer;
  const storyImgUrl = location.state?.storyImgUrl;

  /* api 중복 요청 방지를 위한 상태 관리 */
  const [isRequesting, setIsRequesting] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [gameTitle, setGameTitle] = useState(null);

  useEffect(() => {
    if(placeAnswer === "바다"){
      setBackgroundImage("/4262432-1@2x.png");
      setGameTitle("바다에서 분리수거!");
    } else if (placeAnswer === "숲") {
      setBackgroundImage("/5319163.jpg");
      setGameTitle("숲에서 분리수거!");
    } else if (placeAnswer === "도시") {
      setBackgroundImage("/3972.jpg");
      setGameTitle("도시에서 분리수거!");
    }
  }, [placeAnswer]);

  // 캠 권한 설정 유무
  const [showWebcamError, setShowWebcamError] = useState(false);
  const [webcamErrorMessage, setWebcamErrorMessage] = useState("");

  // 분리수거 완료 메시지 !
  const [showRecycleComplete, setShowRecycleComplete] = useState(false);
  const [showStar, setShowStar] = useState(false);

  // 분리수거 성공 메시지 !
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [animationClass, setAnimationClass] = useState('');
  const [successImagesIndex, setSuccessImageIndex] = useState(1); // 이미지 인덱스 상태
  const successImages = [
    "/game_images/recycling/message/excellent.png",
    "/game_images/recycling/message/good.png",
    "/game_images/recycling/message/best.png",
    "/game_images/recycling/message/perfect.png",
  ];

  // 분리수거 실패 메시지 !
  const [showFailMessage, setShowFailMessage] = useState(false);

  const [failCount, setFailCount] = useState(0);

  const demosSectionRef = useRef(null);
  const [webcamRunning, setWebcamRunning] = useState(true);
  const videoHeight = "1065px";
  const videoWidth = "1420px";
  const [runningMode, setRunningMode] = useState("VIDEO");

  const gestureRecognizer = useRef(null);
  const isGestureRecognizerReady = useRef(false);

  let images = [];
  const minX = 100; // Minimum value for X
  const maxX = 1100; // Maximum value for X
  const minY = 70; // Minimum value for Y
  const maxY = 500; // Maximum value for Y
  const minDistance = 120; // Minimum distance between objects

  let completeRecycle = false;


  /********************************************************************
     Continuously grab image from webcam stream and detect it.
  ********************************************************************/
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  // let video;
  let canvasCtx = useRef(null);
  let canvasElement;

  const createGestureRecognizer = async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      const recognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
          delegate: "GPU",
        },
        runningMode: runningMode,
      });
      gestureRecognizer.current = recognizer;
      isGestureRecognizerReady.current = true;
    } catch (error) {
      console.error("Error creating gesture recognizer:", error);
      isGestureRecognizerReady.current = false;
    }
  };
  useEffect(() => {
    // 비동기 함수 정의
    const initializeGestureRecognizer = async () => {
      if (demosSectionRef.current) {
        demosSectionRef.current.classList.remove("invisible");
      }
      await createGestureRecognizer();
    };

    const setupWebcam = () => {
      if (!videoRef.current) return;

      const handleSuccess = (stream) => {
        if (videoRef.current) {
          const video = videoRef.current;
          const constraints = { video: true };
          navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
            video.srcObject = stream;
            video.addEventListener("loadeddata", predictWebcam);
          });
        }

        if (canvasRef.current) {
          canvasElement = canvasRef.current; // canvas 요소 가져오기
          canvasCtx = canvasElement.getContext("2d");
        }
      };

      const handleError = (error) => {
        console.error("Error accessing the webcam", error);
        // 오류 메시지를 표시하도록 구성요소의 상태를 업데이트합니다.
        // 이는 설정 시 페이지에 모달, 경고 또는 텍스트 메시지를 표시하는 상태 변수일 수 있습니다.
        setShowWebcamError(true);
        setWebcamErrorMessage("카메라가 꺼져있어요. 카메라 권한을 주세요!");
      };

      const requestAccess = () => {
        navigator.mediaDevices
          .getUserMedia({ video: true })
          .then(handleSuccess)
          .catch(handleError);
      };

      navigator.permissions
        .query({ name: "camera" })
        .then((permissionObj) => {
          if (permissionObj.state === "granted") {
            requestAccess();
          } else if (permissionObj.state === "prompt") {
            requestAccess();
          } else if (permissionObj.state === "denied") {
            handleError(new Error("Camera access denied"));
          }
        })
        .catch((error) => {
          console.error("Error querying permissions", error);
          handleError(error);
        });
    };

    // Initialize gesture recognizer and then set up webcam
    initializeGestureRecognizer().then(() => {
      setupWebcam();
    });
  }, []);

  // 웹캠 종료 함수
  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();

      tracks.forEach((track) => {
        track.stop();
      });

      videoRef.current.srcObject = null;
    }
  };

  let playground = "";
  let imageSources = [];
  if (placeAnswer === "바다") {
    // 여기에서 바다에 대한 처리를 수행
    playground = "sea";

    imageSources = [
      "/game_images/recycling/" + playground + "/trash.png",
      "/game_images/recycling/" + playground + "/glass_trash.png",
      "/game_images/recycling/" + playground + "/plastic_trash.png",
      "/game_images/recycling/" + playground + "/can_trash.png",
      "/game_images/recycling/" + playground + "/paper_trash.png",
    ];

    imageSources.forEach((src) => {
      let coords = generateRandomCoordinates(
        minX,
        maxX,
        minY,
        maxY,
        minDistance,
        images
      );
      images.push({
        src: src,
        x: coords.x,
        y: coords.y,
        z: 0,
        isMoving: false,
        lastGesture: null,
      });
    });

    loadImages();
  } else if (placeAnswer === "숲") {
    // 여기에서 바다에 대한 처리를 수행
    playground = "mountain";
    imageSources = [
      "/game_images/recycling/" + playground + "/trash.png",
      "/game_images/recycling/" + playground + "/glass_trash.png",
      "/game_images/recycling/" + playground + "/plastic_trash.png",
      "/game_images/recycling/" + playground + "/can_trash.png",
      "/game_images/recycling/" + playground + "/paper_trash.png",
    ];
    imageSources.forEach((src) => {
      let coords = generateRandomCoordinates(
        minX,
        maxX,
        minY,
        maxY,
        minDistance,
        images
      );
      images.push({
        src: src,
        x: coords.x,
        y: coords.y,
        z: 0,
        isMoving: false,
        lastGesture: null,
      });
    });

    loadImages();
  } else if (placeAnswer === "도시") {
    // 여기에서 도시에 대한 처리를 수행
    playground = "city";
    imageSources = [
      "/game_images/recycling/" + playground + "/trash.png",
      "/game_images/recycling/" + playground + "/glass_trash.png",
      "/game_images/recycling/" + playground + "/plastic_trash.png",
      "/game_images/recycling/" + playground + "/can_trash.png",
      "/game_images/recycling/" + playground + "/paper_trash.png",
    ];
    imageSources.forEach((src) => {
      let coords = generateRandomCoordinates(
        minX,
        maxX,
        minY,
        maxY,
        minDistance,
        images
      );
      images.push({
        src: src,
        x: coords.x,
        y: coords.y,
        z: 0,
        isMoving: false,
        lastGesture: null,
      });
    });

    loadImages();
  } else {
    // 여기에서 도시에 대한 처리를 수행
    playground = "city";
    imageSources = [
      "/game_images/recycling/" + playground + "/trash.png",
      "/game_images/recycling/" + playground + "/glass_trash.png",
      "/game_images/recycling/" + playground + "/plastic_trash.png",
      "/game_images/recycling/" + playground + "/can_trash.png",
      "/game_images/recycling/" + playground + "/paper_trash.png",
    ];
    imageSources.forEach((src) => {
      let coords = generateRandomCoordinates(
        minX,
        maxX,
        minY,
        maxY,
        minDistance,
        images
      );
      images.push({
        src: src,
        x: coords.x,
        y: coords.y,
        z: 0,
        isMoving: false,
        lastGesture: null,
      });
    });

    loadImages();
  }

  // Check if webcam access is supported.
  function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  let bins = []; // 쓰레기통 이미지들을 저장할 배열

  // 이미지 소스에 쓰레기통 이미지 추가
  const binSources = [
    "/game_images/recycling/trash_can/paper_can.png",
    "/game_images/recycling/trash_can/can_can.png",
    "/game_images/recycling/trash_can/plastic_can.png",
    "/game_images/recycling/trash_can/glass_can.png",
    "/game_images/recycling/trash_can/trash_can.png",
  ];

  // 쓰레기통 이미지 위치 고정
  const binPositions = [
    { x: 237, y: 930 },
    { x: 473, y: 930 },
    { x: 709, y: 930 },
    { x: 947, y: 930 },
    { x: 1183, y: 930 },
  ];

  // 쓰레기통 이미지 로딩 및 bins 배열에 추가
  binSources.forEach((src, index) => {
    let binImage = new Image();
    binImage.src = src;
    binImage.onload = () => {
      bins.push({
        imageObj: binImage,
        x: binPositions[index].x,
        y: binPositions[index].y,
      });
    };
  });

  function generateRandomCoordinates(
    minX,
    maxX,
    minY,
    maxY,
    minDistance,
    existingImages
  ) {
    let newX, newY, tooClose;

    do {
      newX = Math.random() * (maxX - minX) + minX;
      newY = Math.random() * (maxY - minY) + minY;
      tooClose = existingImages.some((img) => {
        return (
          Math.sqrt(Math.pow(img.x - newX, 2) + Math.pow(img.y - newY, 2)) <
          minDistance
        );
      });
    } while (tooClose);

    return { x: newX, y: newY };
  }

  function loadImages() {
    images.forEach((image) => {
      let img = new Image();
      img.src = image.src;
      img.onload = () => {
        image.imageObj = img;
        image.loaded = true;
      };
    });
  }
  // 예시 이미지 URL을 사용하여 이미지 로드

  function getTrashType(trashSrc) {
    const type = trashSrc.split("/")[4].substring(0, 2); // Get first two letters after 'images/sea/'
    switch (type) {
      case "tr":
        return "trash";
      case "gl":
        return "glass";
      case "pl":
        return "plastic";
      case "ca":
        return "can";
      case "pa":
        return "paper";
      default:
        return null;
    }
  }
  // 새로운 랜덤 위치를 생성하는 함수
  function generateRandomPosition(existingImages) {
    let newX, newY, tooClose;
    do {
      newX = Math.random() * (1100 - 100) + 100;
      newY = Math.random() * (500 - 70) + 70;
      tooClose = existingImages.some((img) => {
        return (
          Math.sqrt(Math.pow(img.x - newX, 2) + Math.pow(img.y - newY, 2)) < 120
        );
      });
    } while (tooClose);

    return { x: newX, y: newY };
  }

  // 쓰레기통과 쓰레기 간의 충돌을 확인하는 함수
  function checkForCollisionWithBins(movingImage) {
    bins.forEach((bin) => {
      if (
        movingImage.x > bin.x - 100 &&
        movingImage.x < bin.x + 100 &&
        movingImage.y > bin.y - 75 &&
        movingImage.y < bin.y + 75
      ) {
        const trashType = getTrashType(movingImage.src);
        const binFilename = bin.imageObj.src.split("/").pop();
        const binType = binFilename.split("_")[0];

        if (trashType === binType) {
          // 올바른 쓰레기통에 넣었을 경우, 이미지 삭제
          const index = images.indexOf(movingImage);
          if (index > -1) {
            images.splice(index, 1);
          }
          if(images.length === 0){
            return
          }
          displaySuccessMessage();
        } else {
          displayFailMessage();
          // 잘못된 쓰레기통에 넣었을 경우, 새 위치로 이동
          const newPosition = generateRandomPosition(images);
          movingImage.x = newPosition.x;
          movingImage.y = newPosition.y;
        }

        // 쓰레기를 놓은 것으로 처리
        currentlyMovingImage = null;
      }
    });
  }
``
  function displayFailMessage() {
    // 실패
    setFailCount(prevFailCount => prevFailCount + 1);
    
    setAnimationClass(''); // 애니메이션 클래스를 초기화
    setShowFailMessage(true); // 메시지를 보여줌
    
    setTimeout(() => {    
      setAnimationClass('hide-message'); // 3초 후 역 애니메이션 클래스를 추가
      setTimeout(() => {
        setShowFailMessage(false); // 역 애니메이션이 끝난 후 메시지를 숨김
      }, 600); // 역 애니메이션 시간에 맞춰 설정
    }, 1800);
  }

  function displaySuccessMessage() {
    // 성공
        setSuccessImageIndex(prevIndex => {
      // 이미지 배열의 길이를 넘어가지 않도록 처리합니다.
      return (prevIndex % successImages.length) + 1;
    });


    setAnimationClass(''); // 애니메이션 클래스를 초기화
    setShowSuccessMessage(true); // 메시지를 보여줌
    
    setTimeout(() => {    
      setAnimationClass('hide-message'); // 3초 후 역 애니메이션 클래스를 추가
      setTimeout(() => {
        setShowSuccessMessage(false); // 역 애니메이션이 끝난 후 메시지를 숨김
      }, 500); // 역 애니메이션 시간에 맞춰 설정
    }, 1800);
  }

  // Update the canvas
  function updateCanvas() {
    if (canvasRef.current === null) {
      return;
    }
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    canvasCtx.save();
    canvasCtx.scale(-1, 1); // 캔버스 좌우 반전
    canvasCtx.translate(-canvasRef.current.width, 0); // 반전된 캔버스를 다시 올바른 위치로 이동

    canvasCtx.clearRect(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    canvasCtx.restore();

    // z 속성에 따라 이미지 정렬
    let sortedImages = images.slice().sort((a, b) => a.z - b.z);

    sortedImages.forEach((image) => {
      if (image.loaded) {
        canvasCtx.drawImage(
          image.imageObj,
          image.x - 60,
          image.y - 50,
          120,
          120
        );
      }
    });

    // 쓰레기통 이미지를 고정된 위치에 렌더링
    bins.forEach((bin) => {
      canvasCtx.drawImage(bin.imageObj, bin.x - 100, bin.y - 75, 200, 200);
    });


    if (completeRecycle) {
      return;
    }
    // 분리수거 완료 메시지 확인 및 표시
    if (images.length === 0) {
      displayCompletionMessage();
    }

    requestAnimationFrame(updateCanvas);
  }

  // 분리수거 완료 메시지 표시 함수
  function displayCompletionMessage() {
    if (completeRecycle) {
      return;
    }
    completeRecycle = true;
    setShowStar(true)

    setTimeout(() => {
      setShowRecycleComplete(true);
    }, 1000);
    setTimeout(callSecondGameAfterPage, 5000);
  }

  let currentlyMovingImage = null;
  const grabThreshold = 50; // 잡기 거리 임계값

  function checkCollisionAndMoveTrash(landmarks, category) {
    const grabbingPoint = landmarks[12];
    const fingerTipX = grabbingPoint.x * canvasElement.width;
    const fingerTipY = grabbingPoint.y * canvasElement.height;

    if (currentlyMovingImage) {
      if (category === "Closed_Fist") {
        // 이미지를 잡으면 z 값을 업데이트
        currentlyMovingImage.z = Math.max(...images.map((img) => img.z)) + 1;
        // 이미 잡고 있는 이미지가 있고 'Closed_Fist' 상태라면 계속 움직입니다.
        currentlyMovingImage.x = fingerTipX;
        currentlyMovingImage.y = fingerTipY;
      } else {
        // 'Closed_Fist' 상태가 아니면 움직임을 멈춥니다.
        currentlyMovingImage.isMoving = false;
        currentlyMovingImage.lastGesture = category;
        currentlyMovingImage = null;
      }
    } else {
      // 새로운 이미지를 잡습니다.
      images.forEach((image) => {
        const distance = Math.sqrt(
          Math.pow(fingerTipX - image.x, 2) + Math.pow(fingerTipY - image.y, 2)
        );
        if (
          distance < grabThreshold &&
          category === "Closed_Fist" &&
          image.lastGesture !== "Closed_Fist"
        ) {
          image.isMoving = true;
          currentlyMovingImage = image;
          image.lastGesture = category;
        } else {
          // lastGesture를 업데이트 합니다.
          image.lastGesture = category;
        }
      });
    }

    if (currentlyMovingImage) {
      checkForCollisionWithBins(currentlyMovingImage);
    }
  }

  let lastVideoTime = -1;
  let results = undefined;
  async function predictWebcam() {
    if (!isGestureRecognizerReady.current || !gestureRecognizer.current) {
      // gestureRecognizer가 준비되지 않았거나 null인 경우
      return;
    }
    const webcamElement = document.getElementById("webcam");

    // Now let's start detecting the stream.
    if (runningMode === "IMAGE") {
      setRunningMode("VIDEO");
      await gestureRecognizer.current.setOptions({ runningMode: "VIDEO" });
    }
    let nowInMs = Date.now();

    if (videoRef.current.currentTime !== lastVideoTime) {
      lastVideoTime = videoRef.current.currentTime;

      results = gestureRecognizer.current.recognizeForVideo(
        videoRef.current,
        nowInMs
      );
    }

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    const drawingUtils = new DrawingUtils(canvasCtx);

    canvasElement.style.height = videoHeight + "px";
    webcamElement.style.height = videoHeight;
    canvasElement.style.width = videoWidth + "px";
    webcamElement.style.width = videoWidth;

    if (completeRecycle) {
      return;
    }
    updateCanvas();
    if (results.landmarks) {
      for (const landmarks of results.landmarks) {
        // drawingUtils.drawConnectors(
        //   landmarks,
        //   GestureRecognizer.HAND_CONNECTIONS,
        //   {
        //     color: "#00FF00",
        //     lineWidth: 5
        //   }
        // );
        // drawingUtils.drawLandmarks(landmarks, {
        //   color: "#FF0000",
        //   lineWidth: 2
        // });
        if (results.gestures.length > 0) {
          checkCollisionAndMoveTrash(
            landmarks,
            results.gestures[0][0].categoryName
          );
        }
      }
    }
    canvasCtx.restore();

    // Call this function again to keep predicting when the browser is ready.
    if (webcamRunning === true) {
      window.requestAnimationFrame(predictWebcam);
    }
  }

  const callSecondGameAfterPage = async () => {
    if (!isRequesting) {
      setIsRequesting(true);

      navigate(`/book/doduk/${bookId}/story/3`, {
        state: {
          bookId: bookId,
          placeAnswer: placeAnswer,
          storyImgUrl: storyImgUrl,
        },
      });

      stopWebcam();
      setIsRequesting(false);
      /* 다른 navigate 호출 후 false로 세팅해 요청 다시 가능하게끔 함 */
    }
  };

  const [isDodukStopModalPopupOpen, setDodukStopModalPopupOpen] =
    useState(false);

  const onDodukStartPageContainerClick = useCallback(() => {
    // Please sync "교훈동화 : 쓰레기 줍기 게임_룰설명" to the project
  }, []);

  const openDodukStopModalPopup = useCallback(() => {
    setDodukStopModalPopupOpen(true);
  }, []);

  const closeDodukStopModalPopup = useCallback(() => {
    setDodukStopModalPopupOpen(false);
  }, []);

  return (
    <>

      <div
        style={{width:"1920px", height:"1080px", fontSize:"100px"}}
        className="relative bg-white overflow-hidden cursor-pointer text-center text-black font-jua"
        onClick={onDodukStartPageContainerClick}
      >
        {showWebcamError && (
          <div className="webcam-error-message">
            {webcamErrorMessage}
            <p className="webcam-error-message2">
              크롬 기준 (설정-개인 정보 보호 및 보안-사이트 설정-카메라-사이트에서{" "}
              <br />
              카메라 사용을 요청할 수 있음) 체크! 그리고나서 새로고침! <br />
              (만약 카메라 사용이 허용되지 않음에 우리 사이트가 있다면 목록 삭제!)
            </p>
          </div>
        )}
        {showStar && (
          <div>
            <img
              src="/game_images/recycling/message/star.png"
              alt="분리수거 별1 이미지"
              className="recycle-star1"
            />
            {failCount < 4 && (
                <img
                src="/game_images/recycling/message/star.png"
                alt="분리수거 별2 이미지"
                className="recycle-star2"
              />
            )}
            {failCount < 2 && (
                <img
                src="/game_images/recycling/message/star.png"
                alt="분리수거 별3 이미지"
                className="recycle-star3"
              />
            )}
          </div>
        )}
        {showRecycleComplete && (
          <div>
            {failCount < 2 && (
              <img
                src="/game_images/recycling/message/star-message-perfect.png"
                alt="분리수거 완벽 완료 메시지"
                className="recycle-complete-message"
              />
            )}
            {failCount >= 2 && (
              <img
                src="/game_images/recycling/message/star-message.png"
                alt="분리수거 완료 메시지"
                className="recycle-complete-message"
              />
            )}
          </div>
        )}
        {showSuccessMessage && (
          <img
            src={successImages[successImagesIndex -1]} // 인덱스에 맞는 이미지 가져오기
            alt="분리수거 성공 메시지"
            className={`recycle-message ${ animationClass }`}
          />
        )}
        {showFailMessage && (
          <img
            src="/game_images/recycling/message/fail.png"
            alt="분리수거 실패 메시지"
            className={`recycle-message ${ animationClass }`}
            style={{ left:"30%"}}
          />
        )}
        <div style={{width:"1920px", height:"1080px", top:"10px", left:"0px"}} className="absolute">
          <div style={{width:"1920px", height:"1080px", top:"0px", left:"0px", background:"linear-gradient(180deg, #fff, rgba(204, 233, 249, 0.98) 0.01%, rgba(17, 152, 229, 0.9))", border:"1px solid black"}} className="absolute box-border" />
          <Link
            style={{width:"1420px", height:"900px", top:"90px", left:"250px"}}
            className="absolute"
            to="/dodukchatmain"
          >
            <img
              style={{width:"1420px", height:"900px", top:"0px", left:"0px", objectFit:"cover"}}
              className="absolute"
              alt=""
              src={backgroundImage}
            />
          </Link>
          <div style={{width:"807px", height:"267px", top:"360px", left:"557px"}} className="absolute inline-block">
            {gameTitle}
          </div>

          <section ref={demosSectionRef} id="demos" className="invisible">
            <div id="liveView" className="videoView">
              <div style={{ position: "relative" }}>
                <video
                  ref={videoRef}
                  id="webcam"
                  autoPlay
                  playsInline
                  style={{ transform: "scaleX(-1)" }}
                ></video>
                <canvas
                  ref={canvasRef}
                  className="output_canvas"
                  id="output_canvas"
                  width="1420px"
                  height="1065px"
                  style={{
                    position: "absolute",
                    left: "0px",
                    top: "0px",
                    transform: "scaleX(-1)",
                    zIndex: "3",
                  }}
                ></canvas>
                <p id="gesture_output" className="output"></p>
              </div>
            </div>
            <div className="relative">
              <div className="relative">
                {placeAnswer === "바다" && (
                  <img
                    src="/game_images/recycling/background/hand_game_sea_background.png"
                    alt="바다 배경"
                    className="overlay-image"
                  />
                )}
                {placeAnswer === "숲" && (
                  <img
                    src="/game_images/recycling/background/hand_game_mountain_background.png"
                    alt="산 배경"
                    className="overlay-image"
                  />
                )}
                {placeAnswer === "도시" && (
                  <img
                    src="/game_images/recycling/background/hand_game_city_background.png"
                    alt="도시 배경"
                    className="overlay-image"
                  />
                )}
              </div>
            </div>
          </section>
        </div>
        <img
          className="absolute top-[2.38rem] left-[112.06rem] w-[5.63rem] h-[5.63rem] object-fit cursor-pointer"
          alt=""
          src="/delete-4@2x.png"
          onClick={openDodukStopModalPopup}
        />
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

export default DodukRecyclingGame;