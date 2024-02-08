import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

const TuktakStopModal = ({ onClose }) => {
  const navigate = useNavigate();

  const onYesBoxClick = useCallback(() => {
    navigate("/storybook");
  }, [navigate]);

  const onYesShapeClick = useCallback(() => {
    // Please sync "메인 페이지 - 로그인 후" to the project
  }, []);

  return (
    <div className="rounded-[170px] bg-gold w-[647px] overflow-hidden flex flex-row flex-wrap items-end justify-start py-[54px] px-[124px] box-border gap-[59px] max-w-full max-h-full text-center text-21xl text-black font-jua">
      <div className="relative inline-block w-[399px] h-[68px] shrink-0 top-[1rem]">
        뚝딱동화를 종료할까요?
      </div>

      <button
        className="cursor-pointer [border:none] p-0 bg-[transparent] shrink-0 flex flex-col items-end justify-start relative gap-[10px] bottom-[1rem]"
        autoFocus={true}
        onClick={onYesBoxClick}
      >
        <img
          className="relative rounded-26xl w-[170px] h-[90px] cursor-pointer z-[0]"
          alt=""
          src="/yes-shape.svg"
          onClick={onYesShapeClick}
        />
        <div className="absolute my-0 mx-[!important] h-[55.56%] w-[40.59%] top-[22.22%] left-[29.41%] text-21xl font-jua text-white text-center inline-block z-[1]">
          네
        </div>
      </button>
      <button
        className="cursor-pointer [border:none] p-0 bg-[transparent] shrink-0 flex flex-col items-end justify-start relative gap-[10px] bottom-[1rem]"
        onClick={onClose}
        autoFocus={true}
      >
        <img
          className="relative rounded-26xl w-[170px] h-[90px] cursor-pointer z-[0]"
          alt=""
          src="/rectangle-87.svg"
          onClick={onClose}
        />
        <div className="absolute my-0 mx-[!important] h-[55.56%] w-[68.82%] top-[22.22%] left-[15.29%] text-21xl font-jua text-gray text-center inline-block z-[1]">
          아니요
        </div>
      </button>
    </div>
  );
};

export default TuktakStopModal;
