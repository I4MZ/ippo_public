import { useState, useCallback } from "react";
import DodukStopModal from "./doduk-stop-modal";
import PortalPopup from "../portal-popup";
import { useNavigate } from "react-router-dom";
import "../../static/doduk/doduk_q.css"

const DodukQ = () => {
  const navigate = useNavigate();
  //  const [answer, setAnswer] = useState("");
  const [isDodukStopModalPopupOpen, setDodukStopModalPopupOpen] =
    useState(false);

  /* doduk-s-q 폐기예정*/
  const handleClick = (value) => {
    console.log(value);
    navigate("/doduk-q-quickdraw", { state: { placeAnswer: value } });
  };

  const openDodukStopModalPopup = useCallback(() => {
    setDodukStopModalPopupOpen(true);
  }, []);

  const closeDodukStopModalPopup = useCallback(() => {
    setDodukStopModalPopupOpen(false);
  }, []);
  /*--------------------*/

  return (
      <div className="doduk-main">
        <div className="doduk-background">
          <img className="doduk-background-img" src="/dodukbackicon.webp"/>
        </div>

        <div className="left-page">
          <div className="popo-chat-box">
            <p className="m-0">반가워 우철아!</p>
            <p className="m-0">어디로 모험을 떠나볼래?</p>
          </div>
          <div className="doduk-popo">
            <img
                className="doduk-popo-img"
                alt=""
                src="/1920-doduk-popo-1@2x.png"
            />
          </div>
        </div>
        <div className="right-page">
          <img
              className="stop-button"
              alt=""
              src="/delete-4@2x.png"
              onClick={openDodukStopModalPopup}
          />
          <div className="choice-btn-box">
            <button
                className="choice-btn-sea"
                onClick={() => handleClick("바다")}
            >
              <img
                  className="choice-btn-img"
                  alt=""
                  src="/1920-doduk-choice-button-2@2x.png"
              />
              <span className="choice-word">
                      바다
                  </span>
            </button>
          </div>
          
          <div className="choice-btn-box">
            <button
                className="choice-btn-forest"
                onClick={() => handleClick("숲")}
            >
              <img
                  className="choice-btn-img"
                  alt=""
                  src="/1920-doduk-choice-button-2@2x.png"
              />
              <span className="choice-word">
                    숲
                  </span>
            </button>
          </div>
          <div className="choice-btn-box">
            <button className="choice-btn-city"
                    onClick={() => handleClick("도시")}
            >
              <img
                  className="choice-btn-img"
                  alt=""
                  src="/1920-doduk-choice-button-2@2x.png"
              />
              <span className="choice-word">
                    도시
              </span>
            </button>
          </div>
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
      </div>
  );
};

export default DodukQ;
