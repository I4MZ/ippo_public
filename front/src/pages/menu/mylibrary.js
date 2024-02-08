import { useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./mylibrary.css";
import axios from "axios";
import MylibraryListContainerLinks from "../../components/mylibrary-list-container-link";

const Mylibrary = () => {

  const navigate = useNavigate();
  const [items, setItems] = useState([]); // DB에서 가져온 목록들을 저장
  const [pageIndex, setPageIndex] = useState(0); // 현재 페이지 인덱스

  /* -----------------이 부분은 잘 모르겠어요 일단 손은 안댈게요 ----------------------- */
  const onMylibraryContainerClick = useCallback(() => {
    const anchor = document.querySelector("[data-scroll-to='rectangleImage']");
    if (anchor) {
      anchor.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    const scrollAnimElements = document.querySelectorAll(
      "[data-animate-on-scroll]"
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            const targetElement = entry.target;
            targetElement.classList.add("animate");
            observer.unobserve(targetElement);
          }
        }
      },
      {
        threshold: 0.15,
      }
    );

    for (let i = 0; i < scrollAnimElements.length; i++) {
      observer.observe(scrollAnimElements[i]);
    }

    return () => {
      for (let i = 0; i < scrollAnimElements.length; i++) {
        observer.unobserve(scrollAnimElements[i]);
      }
    };
  }, []);
  /* ---------------------------------------------------------------------- */

  // 컴포넌트가 마운트될 때 데이터를 가져옴
  useEffect(() => {
    const fetchStory = async () => {
      try {
        const response = await axios.get(
          `/api/book/myLibrary`
        );
        setItems(response.data);
        console.log(response.data);
      } catch (error) {
        console.error("출력에서 에러 발생", error);
      }
    };

    fetchStory();
  }, []);

  // '이전' 버튼을 클릭했을 때 호출될 함수
  const handlePrevClick = () => {
    setPageIndex((prevIndex) => Math.max(0, prevIndex - 3));
  };
  // '다음' 버튼을 클릭했을 때 호출될 함수
  const handleNextClick = () => {
    setPageIndex((prevIndex) => prevIndex + 3);
  };

  // 각 컨텐츠별 다시보기 컴포넌트로 이동시키기
  const replayHandler = (item) => {
    console.log(item.bookTypeId.bookTypeId);
    console.log(item.bookId);
    switch (item.bookTypeId.bookTypeId) {
      case 1:
        navigate(`/doduk-replay/${item.bookId}`, {
          bookTypeId: item.bookTypeId,
          bookId: item.bookId,
        });
        break;
      case 2:
        /* 예시 ------------------------------ */
        navigate(`/glim-replay/${item.bookId}`);
        break;
    }
  };

  const currentItems = items.slice(pageIndex, pageIndex + 3);

  return (
    <div className="mylibrary-main">
      <div className="my-0 mx-[!important] absolute top-[0%] right-[0%] bottom-[0%] left-[0%] flex flex-row flex-wrap items-start justify-between z-[0]">
        <img
          className="object-cover z-[0] background"
          alt=""
          src="/1920_library_backgroun.webp"
        />
      </div>
      <div className="popo-info">
        <img
          style={{ top:"890px", left:"0px", width:"390px", height:"210px"}}
          className="popo-library absolute object-fit"
          alt=""
          src="/@2x.png"
        />
      </div>

      <div className="history-list relative">
        <div className="list-box absolute rounded-11xl bg-antiquewhite-200 box-border border-[2px] border-solid border-silver" 
            style={{ top: '127.04px', left: '359.04px', width: '1200px', height: '365.28px', display:"flex", justifyContent:"center", alignItems:"center"}}>
            {/* 컨텐츠를 추가하는 부분 */}
            <div className="absolute flex items-center justify-center z-[1]"
                style={{ top: '50px', gap:"130px" }}>
                {currentItems.map((item) => (
                    <div key={item.bookId} style={{width:"200px"}}>
                        <img
                            className="cursor-pointer"
                            style={{ width: '100%', height: '227.04px', borderRadius:"20px" }}
                            src={item.bookImgUrl}
                            alt={"이미지"}
                            onClick={() => replayHandler(item)}
                        />
                        <p className="" style={{ fontFamily:"jua", fontSize:"20px", whiteSpace:"pre-line;", textAlign:"center", display:"-webkit-box", WebkitLineClamp:"2",WebkitBoxOrient:"vertical",overflow:"hidden", textOverflow:"ellipsis"}}>{item.bookTitle}</p>
                    </div>
                ))}
            </div>
        </div>
        <div className="polygon absolute flex items-center justify-between">
          <img
            className="object-contain [transform:scale(1.348)] bg-transparent cursor-pointer"
            alt="Polygon 1"
            src="/polygon-1.svg" //왼쪽 버튼
            onClick={handlePrevClick}
          />
          <img
            className="object-contain [transform:scale(1.348)] bg-transparent cursor-pointer"
            alt="Polygon 2"
            src="/polygon-2.svg" //오른쪽 버튼
            onClick={handleNextClick}
          />
        </div>
      </div>
      <Link
        className="cursor-pointer [text-decoration:none] absolute top-1/2 -translate-y-1/2 left-[5%] w-[200px] h-[200px] bg-[url('/public/buttonlefthome1@2x.png')] bg-cover bg-no-repeat bg-[top]"
        to="/"
      />

        <div className="mylibrary-image-container">
          <img
            style={{ top:"660px", left:"0", width:"600px", height:"250px"}}
            className="relative"
            alt=""
            src="/union.svg"
            data-animate-on-scroll
          />
          <div className="mylibrary-centered-text">반가워 우철아! 이곳은 보았던 동화들을 <br/>다시 볼 수 있는 장소야!<br/>어떤 동화가 가장 재미있었어?</div>
        </div>
    </div>
  );
};

export default Mylibrary;


