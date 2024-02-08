import { useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import axios from "axios";
import Frame from "../../components/frame";
import PortalPopup from "../../components/portal-popup";
import "./main.css";

const MainPage = () => {
  const [isFrameOpen, setFrameOpen] = useState(false);
  const { isLoggedIn, login, logout } = useAuth();
  const navigate = useNavigate();
  const [isI4MZModalPopupOpen, setI4MZModalPopupOpen] = useState(false);
  const [dodukSrc, setDodukSrc] = useState("doduk-front.webp");
  const [tuktakSrc, setTuktakSrc] = useState("tuktak_event.webp");
  const [glimSrc, setGlimSrc] = useState("glim_event.webp");

  // Doduk Thumbnail 설정
  const startDodukGif = () => setDodukSrc("doduk_hover_1.gif");
  const stopDodukGif = () => setDodukSrc("doduk-front.webp");

  // Tuktak Thumbnail 설정
  const startTuktakGif = () => setTuktakSrc("tuktak_event.gif");
  const stopTuktakGif = () => setTuktakSrc("tuktak_event.webp");

  // Glim Thumbnail 설정
  const startGlimGif = () => setGlimSrc("glim_event.gif");
  const stopGlimGif = () => setGlimSrc("glim_event.webp");

  const onMoonLogout1Click = useCallback(() => {
    // Please sync "메인 페이지 - 로그인 전" to the project
  }, []);

  const openFrame = useCallback(() => {
    setFrameOpen(true);
  }, []);

  const closeFrame = useCallback(() => {
    setFrameOpen(false);
  }, []);

  const onButtonArtbooks1Click = useCallback(() => {
    navigate("/storybook");
  }, [navigate]);
  const onButtonLibrary1Click = () => {
    navigate("/mylibrary");
  };


  const onButtonLogin = useCallback(() => {
    navigate("/Login");
  }, []);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  console.log("windowWidth: ", windowWidth);
  // console.log("setWindowWidth: ", setWindowWidth);

  useEffect(() => {
    const isLoggedInCheckRedis = async () => {
      const hasLoggedInCheckRedis = await axios
        .post(`/api/users/isLoggedInCheck`)
        .then((response) => {
          if (response.data === "") {
            console.log("로그아웃 상태 . . .");
            logout();
          } else {
            console.log("로그인 상태 . . .");
            login();
          }
        });
    };
    isLoggedInCheckRedis();

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    const element = document.querySelectorAll(".box1");
    if (element.length > 0) {
      let domRect = element[0].getBoundingClientRect();
      console.log("domRect: ", domRect);
    }
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const cloud3Width = windowWidth >= 1200 ? "19.17rem" : "0rem";
  const cloud4Width = windowWidth >= 960 ? "15rem" : "0rem";

  const cloud1Visible = windowWidth >= 1200;
  const cloud2Visible = windowWidth >= 800;

  const moonWidth =
    windowWidth >= 1200 ? "8.2rem" : windowWidth >= 800 ? "8rem" : "7.5rem";
  // moonWidth = windowWidth >= 500 ? '3rem' : windowWidth >= 200 ? '2rem' : '2rem';

  const moonWidthStyle = {
    width: moonWidth,
  };

  const starWidth =
    windowWidth >= 1200 ? "9.2rem" : windowWidth >= 800 ? "9rem" : "8.8rem";

  const starWidthStyle = {
    width: starWidth,
  };

  const openI4MZModalPopup = useCallback(() => {
    setGlimStopModalPopupOpen(true);
  }, []);

  const closeI4MZModalPopup = useCallback(() => {
    setGlimStopModalPopupOpen(false);
  }, []);

  return (
    <div className="index-main">
      <div className="my-0 mx-[!important] absolute top-[0%] right-[0%] bottom-[0%] left-[0%] flex flex-row flex-wrap items-start justify-between z-[0]">
        <img
          className="object-cover z-[0] background"
          alt=""
          src="/1920_background.webp"
        />
      </div>

      <div className="thumbnails z-[1] w-[522px] h-[196px] absolute top-[500px] left-[706px]">
        <Link
          className="doduk-thumbnail cursor-pointer bg-[url('/public/1920dodukthumbnail1@2x.png')] bg-cover bg-no-repeat z-[1] absolute w-[104px] h-[100%]"
          to="/dodukq"
        />

        <Link
          className="tuktak-thumbnail cursor-pointer bg-[url('/public/1920_tuktak_thumbnail.webp')] bg-cover bg-no-repeat z-[1] absolute w-[215px] h-[100%]"
          to="/tuktakmain"
        ></Link>

        <Link
          className="glim-thumbnail cursor-pointer bg-[url('/public/1920_glim_thumbnail.webp')] bg-cover bg-no-repeat z-[1] absolute w-[144px] h-[100%]"
          to="/glim"
        ></Link>
      </div>

      {!isLoggedIn && (
        <div className="thumbnails-handle z-[6] w-[522px] h-[196px] absolute top-[500px] left-[706px]">
          <Link
            className="doduk-thumbnail-handle cursor-pointer absolute w-[104px] h-[100%]"
            onMouseOver={startDodukGif}
            onMouseOut={stopDodukGif}
            to="/login"
          >
            <img src={dodukSrc} alt="" />
          </Link>

          <Link
            className="tuktak-thumbnail-handle cursor-pointer absolute w-[215px] h-[100%]"
            to="/login"
            onMouseOver={startTuktakGif}
            onMouseOut={stopTuktakGif}
          >
            <img src={tuktakSrc} />
          </Link>
          <Link
            className="glim-thumbnail-handle cursor-pointer absolute w-[144px] h-[100%]"
            to="/login"
            onMouseOver={startGlimGif}
            onMouseOut={stopGlimGif}
          >
            <img src={glimSrc} />
          </Link>
        </div>
      )}
      {isLoggedIn && (
        <div className="thumbnails-handle z-[6] w-[522px] h-[196px] absolute top-[500px] left-[706px]">
          <Link
            className="doduk-thumbnail-handle cursor-pointer absolute w-[104px] h-[100%]"
            onMouseOver={startDodukGif}
            onMouseOut={stopDodukGif}
            to="/dodukq"
          >
            <img src={dodukSrc} alt="" />
          </Link>

          <Link
            className="tuktak-thumbnail-handle cursor-pointer absolute w-[215px] h-[100%]"
            to="/tuktakmain"
            onMouseOver={startTuktakGif}
            onMouseOut={stopTuktakGif}
          >
            <img src={tuktakSrc} />
          </Link>
          <Link
            className="glim-thumbnail-handle cursor-pointer absolute w-[144px] h-[100%]"
            to="/glim"
            onMouseOver={startGlimGif}
            onMouseOut={stopGlimGif}
          >
            <img src={glimSrc} />
          </Link>
        </div>
      )}

      <div className="elements-logo z-[3] absolute">
        <img className="ippo-logo" alt="" src="/ippo_logo.webp" />
        <img className="popo-logo" alt="" src="/popo-logo-4@2x.png" />
        <div className="i4mz-btn">
          <img
            className="i4mz-logo"
            alt=""
            src="/i4mz_logo.webp"
            onClick={openI4MZModalPopup}
          />
        </div>
      </div>

      <div className="my-0 mx-[!important] absolute top-[0%] right-[0%] bottom-[0%] left-[0%] flex flex-row flex-wrap items-start justify-between z-[2]">
        <img
          className="relative overflow-hidden object-cover background"
          alt=""
          src="/ippo_back_icon.webp"
        />
      </div>

      <div className="my-0 mx-[!important] absolute h-[16.11%] w-[69.58%] right-[14.06%] bottom-[75%] left-[16.35%] flex flex-row flex-wrap items-baseline justify-between z-[3]">
        {cloud1Visible && (
          <img
            className="relative w-[14.94rem] h-[7.78rem] object-cover"
            alt=""
            src="/main-cloud1-1@2x.png"
          />
        )}
        {cloud2Visible && (
          <img
            className="relative w-[12rem] h-[6.33rem] object-cover"
            alt=""
            src="/main-cloud2-1@2x.png"
          />
        )}
        <img
          className="relative w-[19.17rem] h-[9.67rem] object-cover"
          alt=""
          src="/main-cloud3-1@2x.png"
          style={{ width: cloud3Width }}
        />
        <img
          className="relative h-[6.44rem] object-cover"
          alt=""
          src="/main-cloud4-1@2x.png"
          style={{ width: cloud4Width }}
        />
      </div>

      {!isLoggedIn && (
        <>
          <div className="login-btn nav-button flex justify-end">
            <button
              className="z-[3] cursor-pointer [border:none] p-0 bg-[transparent] bg-cover bg-no-repeat bg-[top]"
              onClick={onButtonLogin}
            >
              <img src="/moonlogin@2x.png" alt="" style={moonWidthStyle} />
            </button>
          </div>
        </>
      )}
      {isLoggedIn && (
        <>
          <div className="logout-btn nav-button flex justify-end">
            <button
              className="mypage-btn z-[3] cursor-pointer [border:none] p-0 bg-[transparent] bg-cover bg-no-repeat bg-[top]"
              onClick={openFrame}
            >
              <img src="/mypagestar1@2x.png" style={starWidthStyle} alt="" />
            </button>
            <button
              className="z-[3] cursor-pointer [border:none] p-0 bg-[transparent] bg-cover bg-no-repeat bg-[top]"
              onClick={logout}
            >
              <img src="/moonlogout1@2x.png" alt="" style={moonWidthStyle} />
            </button>
          </div>
          <div className="main-menu z-[4] ">
            <Link
              className="artbooks-btn z-[4] cursor-pointer [text-decoration:none]"
              to="/storybook"
              onClick={onButtonArtbooks1Click}
            />
            {/* <div
              className="library-btn z-[4] cursor-pointer [text-decoration:none]"
              onClick={onButtonLibrary1Click}
            ></div> */}
            <Link
              className="library-btn z-[4] cursor-pointer [text-decoration:none]"
              to="/mylibrary"
              onClick={onButtonLibrary1Click}
            />
          </div>
        </>
      )}

      {isFrameOpen && (
        <PortalPopup
          overlayColor="rgba(113, 113, 113, 0.3)"
          placement="Centered"
          onOutsideClick={closeFrame}
        >
          <Frame onClose={closeFrame} />
        </PortalPopup>
      )}
    </div>
  );
};

export default MainPage;
