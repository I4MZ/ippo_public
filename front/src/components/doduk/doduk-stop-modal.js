import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

const DodukStopModal = ({ onClose }) => {
  const navigate = useNavigate();

  const onYesBoxContainerClick = useCallback(() => {
    navigate("/storybook");
  }, [navigate]);

  return (
    <div className="flex flex-col items-start justify-start relative gap-[10px] max-w-full max-h-full overflow-auto text-center text-21xl text-black font-jua">
      <img
        className="relative rounded-316xl w-[657px] h-[346.9px] z-[0]"
        alt=""
        src="/box-shape1.svg"
      />
      <div className="absolute my-0 mx-[!important] h-[27.03%] w-[80.74%] top-[27.74%] left-[9.55%] inline-block z-[1]">
        교훈동화를 종료할까요?
      </div>
      <div
        className="my-0 mx-[!important] absolute top-[186px] left-[139px] rounded-316xl bg-white shadow-[0px_4px_4px_rgba(0,_0,_0,_0.25)] overflow-hidden flex flex-row items-start justify-start py-[27px] px-10 cursor-pointer z-[2]"
        onClick={onYesBoxContainerClick}
      >
        <div className="relative inline-block w-[91.1px] h-[38.4px] shrink-0">
          네
        </div>
      </div>
      <div
        className="my-0 mx-[!important] absolute w-[24.96%] top-[calc(50%_+_16.55px)] right-[21.71%] left-[53.33%] rounded-316xl bg-skyblue shadow-[0px_4px_4px_rgba(0,_0,_0,_0.25)] overflow-hidden flex flex-row items-center justify-center py-[25px] px-8 box-border cursor-pointer z-[3] text-white"
        onClick={onClose}
      >
        <div className="relative">아니요</div>
      </div>
    </div>
  );
};

export default DodukStopModal;
