import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

const GlimStopModal = ({ onClose }) => {
  const navigate = useNavigate();

  const onYesBoxContainerClick = useCallback(() => {
    navigate("/storybook");
  }, [navigate]);

  const onText1Click = useCallback(() => {
    // Please sync "메인 페이지 - 로그인 후" to the project
  }, []);

  return (
    <div className="flex flex-col items-start justify-start relative gap-[10px] max-w-full max-h-full overflow-auto text-center text-21xl text-black font-jua">
      <img
        className="relative rounded-316xl w-[657px] h-[346.9px] z-[0]"
        alt=""
        src="/box-shape.webp"
      />
      <div className="absolute my-0 mx-[!important] h-[14.75%] w-[80.74%] top-[27.74%] left-[9.55%] inline-block z-[1]">
        그림 동화를 종료할까요?
      </div>
      <div
        className="my-0 mx-[!important] absolute top-[179.6px] left-[134.6px] rounded-316xl bg-white shadow-[0px_4px_4px_rgba(0,_0,_0,_0.25)] overflow-hidden flex flex-row items-start justify-start py-[27px] px-10 cursor-pointer z-[2]"
        onClick={onYesBoxContainerClick}
      >
        <div
          className="relative inline-block w-[91.1px] h-[38.4px] shrink-0 cursor-pointer"
          onClick={onText1Click}
        >
          네
        </div>
      </div>
      <div
        className="my-0 mx-[!important] absolute top-[180px] left-[351px] rounded-316xl bg-skyblue shadow-[0px_4px_4px_rgba(0,_0,_0,_0.25)] overflow-hidden flex flex-row items-center justify-center py-[25px] px-8 cursor-pointer z-[3] text-white"
        onClick={onClose}
      >
        <div className="relative">아니요</div>
      </div>
    </div>
  );
};

export default GlimStopModal;
