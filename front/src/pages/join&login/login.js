import React from "react";
import { useNavigate } from 'react-router-dom';
import "./css/login.css";

const Login = () => {
  const kakao_api_key = process.env.REACT_APP_KAKAO_API_RESTAPI_KEY;
  console.log(process.env);
  const redirect_uri = 'http://ippo.live/kakao-login' //Redirect URI
  const kakaoURL = `https://kauth.kakao.com/oauth/authorize?client_id=${kakao_api_key}&redirect_uri=${redirect_uri}&response_type=code`

  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1); // 한 단계 뒤로 이동
  };


  const handleLogin = () => {
    window.location.href = kakaoURL
  }

  return (
    <div className="div">
      <div className="back" onClick={goBack}>
        <div className="back-child" />
        <div className="div1">뒤로가기</div>
      </div>
      <div className="google-login" >
        <div className="google-login-child" />
        <div className="div2">구글 계정으로 로그인</div>
        <img className="google-logo-icon" alt="" src="/google-logo@2x.png" />
      </div>
      <div className="kakao-login" onClick={handleLogin}>
        <div className="kakao-login-child" />
        <div className="div2">카카오 계정으로 로그인</div>
        <img className="img-2-icon" alt="" src="/img-2@2x.png" />
      </div>
      <div className="ippo-container">
        <p className="p">안녕하세요!</p>
        <p className="p">IPPO에 놀러온 걸 환영해요.</p>
      </div>
      <div className="ippo1">IPPO를 이용하시려면 로그인이 필요합니다.</div>
      <img className="popo-logo-2-icon" alt="" src="/popo-logo-2@2x.png" />
    </div>
  );
};

export default Login;
