import { useState, useCallback } from "react";
import DodukStopModal from "../components/doduk-stop-modal";
import PortalPopup from "../../components/portal-popup";

const DodukChatMain = () => {
  const [isDodukStopModalPopupOpen, setDodukStopModalPopupOpen] =
    useState(false);

  const openDodukStopModalPopup = useCallback(() => {
    setDodukStopModalPopupOpen(true);
  }, []);

  const closeDodukStopModalPopup = useCallback(() => {
    setDodukStopModalPopupOpen(false);
  }, []);

  return (
    <>
      <div className="relative w-full h-[68.81rem] overflow-hidden">
        <div className="absolute top-[-47.12rem] left-[-53.81rem] w-[187.5rem] h-[125rem]">
          <div className="absolute top-[47.88rem] left-[53.94rem] bg-white w-[89.5rem] h-[58.81rem]" />
          <img
            className="absolute top-[47.13rem] left-[53.81rem] w-[187.5rem] h-[125rem] object-fit"
            alt=""
            src="/4262432-1@2x.png"
          />
          <img
            className="absolute top-[0.44rem] left-[-2.06rem] w-[93.88rem] h-[59.13rem] object-fit hidden"
            alt=""
            src="/book1129923-1920-1@2x.png"
          />
          <img
            className="absolute top-[-17.75rem] left-[2.56rem] w-[84.56rem] h-[76.44rem] object-fit hidden"
            alt=""
            src="/pngwing-4@2x.png"
          />
          <img
            className="absolute top-[1.06rem] left-[2.56rem] w-[84.56rem] h-[59.75rem] object-fit hidden"
            alt=""
            src="/pngwing-5@2x.png"
          />
        </div>
        <img
          className="absolute top-[5.88rem] left-[5rem] w-[109.56rem] h-[57.75rem] object-fit"
          alt=""
          src="/image-22@2x.png"
        />
        <img
          className="absolute top-[0.13rem] left-[-2.87rem] w-[93.06rem] h-[62.88rem] object-fit hidden"
          alt=""
          src="/pngwing-2@2x.png"
        />
        <img
          className="absolute top-[58.06rem] left-[45rem] w-[57.63rem] h-[0rem] hidden"
          alt=""
          src="/line-1.svg"
        />
        <img
          className="absolute top-[47.19rem] left-[100.31rem] w-[12.98rem] h-[15.36rem] object-fit"
          alt=""
          src="/pngwing-7@2x.png"
        />
        <img
          className="absolute top-[2.06rem] left-[112.06rem] w-[5.63rem] h-[5.63rem] object-fit cursor-pointer"
          alt=""
          src="/delete-4@2x.png"
          onClick={openDodukStopModalPopup}
        />
        <button
          className="cursor-pointer [border:none] p-0 bg-[transparent] absolute top-[2.06rem] left-[2.81rem] w-[5.63rem] h-[5.63rem] bg-[url('/public/previous6@2x.png')] bg-cover bg-no-repeat bg-[top]"
          autoFocus={true}
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

export default DodukChatMain;
