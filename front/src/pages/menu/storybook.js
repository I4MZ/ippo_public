import { Link } from "react-router-dom";
import StorybookListContainerLinks from "../../components/storybook-list-container-links";
import "./storybook.css";

const Storybook = () => {
  return (
    <div className="storybooks" style={{ width:"1920px", height:"1080px"}}>
      <div className="my-0 mx-[!important] absolute top-[0%] right-[0%] bottom-[0%] left-[0%] flex flex-row flex-wrap items-start justify-between z-[0]">
        <img
          className="object-cover z-[0] background"
          alt=""
          src="/1920_storybook@3x.png"
        />
      </div>
      <div className="main-menu">
        <Link
          className="cursor-pointer [text-decoration:none] absolute top-1/2 -translate-y-1/2 right-[5%] w-[200px] h-[200px] max-w-[20rem] bg-[url('/public/buttonhome1@2x.png')] bg-cover bg-no-repeat bg-[top]"
          to="/"
        />
      </div>
      <div  style={{ top: '150px', left: '350px', width: '1200px', height: '365px' }} className="storybook-list absolute">
      <div style={{ width: '1200px', height: '365px' }} className="absolute rounded-11xl bg-antiquewhite-100 [filter:blur(4px)] box-border border-[2px] border-solid border-silver" />
      <div style={{ top: '26.46px', left: '23.67px', width: '1175px', height: '340px' }} className="absolute rounded-11xl overflow-x-auto" >
          <StorybookListContainerLinks />
        </div>
      </div>
      <div className="popo-info">
        <img
          style={{ top:"890px", left:"0px", width:"390px", height:"210px"}}
          className="popo-library absolute object-fit"
          alt=""
          src="/@2x.png"
        />
      </div>
      <div className="storybook-image-container">
          <img
            style={{ top:"-50px", left:"0", width:"600px", height:"250px"}}
            className="relative"
            alt=""
            src="/union.svg"
            data-animate-on-scroll
          />
          <div className="storybook-centered-text">반가워 우철아! 이곳은 재밌는 동화들을 <br/>즐길 수 있는 장소야!<br/>관심이 가는 동화를 골라볼래?</div>
      </div>

    </div>
  );
};

export default Storybook;
