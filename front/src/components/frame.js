import { useCallback } from "react";

const Frame = () => {
  const onContainerClick = useCallback(() => {
    // Please sync "마이페이지(팝업)-3" to the project
  }, []);

  return (
    <div className="fixed top-0 right-0 h-full w-[38.5rem] bg-mistyrose overflow-auto font-jua text-left text-[3.13rem] text-black ">
      <div className="absolute top-[0rem] left-[0rem] bg-mistyrose w-[38.5rem] h-[67.56rem]" />
      <div className="absolute top-[18.56rem] left-[1.89rem] inline-block w-[17.38rem] h-[3.5rem]">
        최근 본 콘텐츠
      </div>
      <div className="absolute top-[53.88rem] left-[1.89rem] inline-block w-[10.5rem] h-[3.5rem]">
        이용약관
      </div>
      <div className="absolute top-[48.25rem] left-[1.89rem] inline-block w-[8.19rem] h-[3.5rem]">
        이벤트
      </div>
      <div className="absolute top-[35.5rem] left-[1.89rem] inline-block w-[14.44rem] h-[3.5rem]">
        알림 및 소리
      </div>
      <div
        className="absolute top-[12.5rem] left-[13.14rem] w-[5.56rem] h-[1.5rem] cursor-pointer text-[1.56rem]"
        onClick={onContainerClick}
      >
        <div className="absolute top-[0rem] left-[0rem] inline-block w-[5.56rem] h-[1.5rem]">
          아이 정보
        </div>
      </div>
      <div className="absolute top-[25rem] left-[1.89rem] inline-block w-[11.25rem] h-[3.5rem]">
        시청 설정
      </div>
      <div className="absolute top-[60.88rem] left-[1.89rem] inline-block w-[14.13rem] h-[3.5rem]">
        사업자 정보
      </div>
      <div className="absolute top-[28.5rem] left-[1.89rem] inline-block w-[11.25rem] h-[3.5rem]">
        모드 설정
      </div>
      <div className="absolute top-[0.69rem] left-[6.83rem] text-[6.25rem] inline-block w-[28.06rem] h-[7.38rem]">
        마이 페이지
      </div>
      <div className="absolute top-[39rem] left-[1.89rem] inline-block w-[11.44rem] h-[3.5rem]">
        구매 내역
      </div>
      <div className="absolute top-[44.75rem] left-[1.89rem] inline-block w-[11.44rem] h-[3.5rem]">
        공지 사항
      </div>
      <div className="absolute top-[32rem] left-[1.89rem] inline-block w-[18.13rem] h-[3.5rem]">
        계정/구독 관리
      </div>
      <div className="absolute top-[57.38rem] left-[1.89rem] inline-block w-[21.13rem] h-[3.5rem]">
        개인정보처리방침
      </div>
      <div className="absolute top-[52.78rem] left-[0.48rem] box-border w-[34.5rem] h-[0.06rem] border-t-[1px] border-solid border-black" />
      <div className="absolute top-[43.41rem] left-[0.48rem] box-border w-[34.5rem] h-[0.06rem] border-t-[1px] border-solid border-black" />
      <div className="absolute top-[23.59rem] left-[0.48rem] box-border w-[34.44rem] h-[0.06rem] border-t-[1px] border-solid border-black" />
      <img
        className="absolute top-[9.44rem] left-[1.89rem] w-[10.5rem] h-[9.13rem] object-fit"
        alt=""
        src="/kakaotalk-20231205-182053541-2@2x.png"
      />
      <img
        className="absolute h-[6.32%] w-[11.09%] top-[2.94%] right-[85.5%] bottom-[90.74%] left-[3.41%] max-w-full overflow-hidden max-h-full"
        alt=""
        src="/vector.svg"
      />
    </div>
  );
};

export default Frame;
