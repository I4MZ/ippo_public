import { useState, useCallback } from "react";
import DodukStopModal from "../../components/doduk-stop-modal";
import PortalPopup from "../../components/portal-popup";
import { Link } from "react-router-dom";

const DodukStartPage = () => {
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
        className="relative bg-white w-full h-[67.5rem] overflow-hidden cursor-pointer text-center text-[6.25rem] text-black font-jua"
        onClick={onDodukStartPageContainerClick}
      >
        <div className="absolute top-[0.63rem] left-[0rem] w-[120rem] h-[67.5rem]">
          <div className="absolute top-[0rem] left-[0rem] [background:linear-gradient(180deg,_#fff,_rgba(204,_233,_249,_0.98)_0.01%,_rgba(17,_152,_229,_0.9))] box-border w-[120rem] h-[67.5rem] border-[1px] border-solid border-black" />
          <Link
            className="absolute top-[5.63rem] left-[15.63rem] w-[88.75rem] h-[56.25rem]"
            to="/dodukchatmain"
          >
            <img
              className="absolute top-[0rem] left-[0rem] w-[88.75rem] h-[56.25rem] object-fit"
              alt=""
              src="/4262432-11@2x.png"
            />
          </Link>
          <div className="absolute top-[22.5rem] left-[38.81rem] inline-block w-[42.44rem] h-[16.69rem]">
            바다에서의 모험
          </div>
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

export default DodukStartPage;
