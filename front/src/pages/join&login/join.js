import React, { useEffect, useState } from "react";
import { useLocation, useNavigate} from "react-router-dom";
import axios from "axios";
import "./css/join.css"

const Join = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const userInfo = location.state?.userInfo;
    const [emailText, setEmailText] = useState("");
    const [authToken, setAuthToken] = useState("");
    const [refreshToken, setRefreshToken] = useState("");

    // 아이 정보 상태를 추가
    const [childName, setChildName] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [gender, setGender] = useState("");

    const testEmail = "kimdongho123@naver.com"
    const authDomain = "kakao";


    
    // 카카오에 이메일이 존재한다면 이메일을 텍스트로 넣고 수정 불가
    useEffect(() => {
        if (userInfo?.has_email) {
            setEmailText(userInfo.email);
            setAuthToken(userInfo.accessToken);
            setRefreshToken(userInfo.refreshToken);
        }
    }, [userInfo]);

    // 이메일이 없으면 수정이 가능하게 만들기
    const handleEmailChange = (event) => {
        setEmailText(event.target.value);
    };
    
    // 아이 이름
    const handleChildNameChange = (event) => {
        setChildName(event.target.value);
    };
    // 생년월일
    const handleBirthDateChange = (event) => {
        setBirthDate(event.target.value);
    };
    // 성별
    const handleGenderChange = (event) => {
        setGender(event.target.value);
    };
    
    // 날짜 형식을 'yyyy-mm-ddThh:mm:ss' 형식으로 변환하는 함수
    const convertDateToISO = (dateString) => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0] + 'T00:00:00'; // 시간을 00:00:00으로 설정
    };
    const handleSave = async () => {
        try {
            // 부모의 정보를 DB로
            const userJoin = await axios.post(
                "/api/users/join",
                {
                    userEmail: emailText,
                    authToken: authToken,
                    authDomain: authDomain
                }
            );

            // DB에 날짜를 넣기전 포맷
            const formattedBirthDate = convertDateToISO(birthDate);
            // 아이의 정보를 DB로
            const childrenJoin = await axios.post(
                `/api/users/children/${emailText}`,
                {
                    childName: childName,
                    childBirthDate: formattedBirthDate,
                    gender: gender
                }
            );
            
            const login = await axios.post(
                `/api/users/login`,
                {
                    accessToken: userInfo.accessToken,
                    refreshToken: userInfo.refreshToken,
                    email: userInfo.email,
            })

            console.log("회원 가입 성공 !")
            navigate("/");
        } catch (error) {
            console.error("Error during API call", error);
        }
    };
    
    return (
        <div className="join_box">
            <img className="join_background" src="/joinBackground.png"></img>
            <div className="join_input_box">
                <div className="join_email_input_box">
                    <p className="join_email_text">이메일</p>
                    <input className="join_email_input" value={emailText} readOnly={userInfo?.has_email} onChange={handleEmailChange}></input>
                </div>
                <p className="join_question">우리 아이는 누구일까요?</p>
                <div>
                    <p className="join_name_text" >아이 이름</p>
                    <input className="join_name_input" value={childName} onChange={handleChildNameChange}></input>
                    <p className="join_birth_text">생년월일</p>
                    <input className="join_birth_input" type="date" name="startday" value={birthDate} onChange={handleBirthDateChange}></input>
                    {/* <input className="join_birth_input"></input> */}
                </div>
                <div>
                    <p>성별</p>
                    <fieldset className="join_radio">
                        <label className="join_radio_box">
                            <input className="join_radio_input" type="radio" name="gender" value="boy" checked={gender === "boy"} onChange={handleGenderChange}/>
                            <span className="join_radio_text">남자 아이</span>
                        </label>

                        <label className="join_radio_box">
                            <input className="join_radio_input" type="radio" name="gender" value="girl" checked={gender === "girl"} onChange={handleGenderChange}/>
                            <span className="join_radio_text">여자 아이</span>
                        </label>
                    </fieldset>
                </div>
                {/* <button className="join_save_button"><span className="join_save_text">저 장</span></button> */}
                <a href="#" class="btn-3d cyan" onClick={handleSave}>저 장</a>
            </div>
        </div>
    );
};

export default Join;
