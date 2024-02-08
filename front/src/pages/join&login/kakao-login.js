import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
// import "./KakaoLogin.css";

function KakaoLogin() {
    const [userInfo, setUserInfo] = useState([]);
    const navigate = useNavigate();
    const PARAMS = new URL(document.location).searchParams;
    const KAKAO_CODE = PARAMS.get("code");
    const KAKAO_API_KEY = process.env.REACT_APP_KAKAO_API_RESTAPI_KEY;
    const [accessTokenFetching, setAccessTokenFetching] = useState(false);


    const [bool, setBool] = useState(true);
    // Access Token 받아오기
    const getAccessToken = async () => {
        if (accessTokenFetching) return; // Return early if fetching


        try {
            setAccessTokenFetching(true); // Set fetching to true
            const params = new URLSearchParams();
            params.append('grant_type', 'authorization_code');
            params.append('client_id', KAKAO_API_KEY); // 여기에 카카오 앱의 REST API 키를 입력하세요.
            params.append('redirect_uri', 'http://ippo.live/kakao-login'); // 여기에 리다이렉트된 URI를 입력하세요.
            params.append('code', KAKAO_CODE);

            const response = await axios.post(
                "https://kauth.kakao.com/oauth/token",
                params,
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                }
            );
            const accessToken = response.data.access_token;
            const refreshToken = response.data.refresh_token;
            setUserInfo({
                ...userInfo,
                accessToken: accessToken,
                refreshToken: refreshToken
            });

            setAccessTokenFetching(false); // Reset fetching to false
            getProfile();
        } catch (error) {
            console.error("Error:", error);
            setAccessTokenFetching(false); // Reset fetching even in case of error
        }
    };

    const getProfile = async () => {
        try {
            // Check if accessToken is available
            if (userInfo.accessToken) {
                const response = await axios.get(
                    "https://kapi.kakao.com/v2/user/me",
                    {
                        headers: {
                            Authorization: `Bearer ${userInfo.accessToken}`,
                            "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
                        },
                    }
                );
                setUserInfo({
                    ...userInfo,
                    // 카카오계정에 이메일
                    email: response.data.kakao_account.email,

                    // 카카오계정에 이메일이 있는지
                    has_email: response.data.kakao_account.has_email,

                    // 이메일이 유효한지
                    // is_email_valid: response.data.kakao_account.is_email_valid,

                    // 이메일이 인증이 되었는지
                    // is_email_verified: response.data.kakao_account.is_email_verified,
                    isLogin: true,
                });
            } else {
                console.log("No accessToken available");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    useEffect(() => {
        if (KAKAO_CODE && !userInfo.accessToken) {
            getAccessToken();
        }
    }, [KAKAO_CODE, userInfo]);

    useEffect(() => {
        const fetchData = async () => {
            if (userInfo.isLogin && bool) {
                try {
                    setBool(false);
                    const test = "testemail";
                    const childrenJoin = await axios.get(
                        // `http://ippo-backend-app:8080/api/users/${userInfo.email}`
                        `/api/users/${userInfo.email}`
                    ).then(response => {
                        if (response.data === "") {
                            navigate("/join", { state: { userInfo: userInfo } });
                        } else {
                            login();
                            console.log("");
                            navigate("/", { state: { userInfo: userInfo } });
                        }
                    })
                } catch (error) {
                    setBool(false);
                    console.error("Error during API call", error);
                }
            }
            if (userInfo.accessToken && bool) {
                getProfile();
            }
        };
        const login = async () => {
            console.log("login debug: ", userInfo);
            const login = await axios.post(
                // `http://ippo-backend-app:8080/api/users/login`,
                `/api/users/login`,
                {
                    accessToken: userInfo.accessToken,
                    refreshToken: userInfo.refreshToken,
                    email: userInfo.email,
                })
        }
        // 선언된 함수 호출
        fetchData();
    }, [userInfo]);


    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontSize: "500%" }}>
            Loading...
        </div>
    );
}

export default KakaoLogin;