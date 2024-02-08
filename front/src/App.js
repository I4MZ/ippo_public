import React, { Component } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { getResizeEventListener } from "./services/responsiveFrame";
import { ChatProvider } from "./components/glim/chat-context"; // ChatProvider를 임포트

// Context API
import { AuthProvider } from "./AuthContext";

// 각 페이지 컴포넌트
import MainPage from "./pages/main/main-page";
import Login from "./pages/join&login/login.js";
import KakaoLogin from "./pages/join&login/kakao-login.js";
import Join from "./pages/join&login/join.js";
import TuktakMain from "./pages/tuktak/tuktak-main";
import TuktakTale from "./pages/tuktak/tuktak-tale";
import DodukStartGame from "./pages/doduk/doduk-recycling-game";
import Doduk_Q from "./components/doduk/doduk-q";
import DodukQQuickdraw from "./components/doduk/doduk-q-quickdraw";
import DodukPage from "./pages/doduk/doduk-page";
import DodukReplay from "./pages/doduk/doduk-replay.js";
import Glim from "./pages/glim/glim";
import GlimFairytale from "./pages/glim/glim-fairytale";
import Mylibrary from "./pages/menu/mylibrary";
import Storybook from "./pages/menu/storybook";
import DodukImage from "./components/doduk/doduk-q-image";
import RouteChangeTracker from "./components/router-change-tracker.js";


class App extends Component {

  componentDidMount() {
    // window.location.pathname을 사용하여 현재 경로 확인
    const FixRatio = getResizeEventListener(1920, 1080);
    window.onresize = FixRatio;
    FixRatio();

    this.updateDocumentTitleAndMeta();
  }

  componentDidUpdate(prevProps) {
    if (this.props.location !== prevProps.location) {
      this.updateDocumentTitleAndMeta();

      if (this.props.history.action !== "POP") {
        window.scrollTo(0, 0);
      }
    }
  }

  updateDocumentTitleAndMeta = () => {
    const pathname = window.location.pathname;
    let title = "아동을 위한 인터렉티브 콘텐츠 서비스 - 포포와 함께하는 모험";
    let metaDescription =
      "안녕! 나는 꼬마 코끼리 포포야! 우리 함께 즐거운 동화나라로 떠나볼까? 원하는 모든 동화를 만들어볼 수 있어 :)";

    // switch 문...
    // if 문을 사용하여 문서 타이틀과 메타 설명 업데이트...
    switch (pathname) {
      case "/":
        title = "메인 페이지 - 포포 버스를 타고 새로운 세계로!";
        metaDescription =
          "포포 버스를 타고 즐거운 모험을 시작하세요! 아이들을 위한 매력적인 인터렉티브 콘텐츠가 가득합니다.";
        break;
      case "/tuktakmain":
        title = "뚝딱동화 시작 페이지 - 창의력을 발휘해 보세요";
        metaDescription =
          "이야기의 선택을 통해서 독특한 자신만의 창의적인 동화를 만들 수 있습니다.";
        break;
      case "/dodukchatmain":
        title = "교훈동화 시작 페이지 - 동화와 게임으로 재밌게";
        metaDescription =
          "나만의 동화와 게임을 통해서 재밌고 환상적인 동화 나라에서 배우고 놀 수 있습니다.";
        break;
      case "/doduk-startpage":
        title = "교훈동화 시작 페이지 - 동화와 게임으로 재밌게";
        metaDescription =
          "나만의 동화와 게임을 통해서 재밌고 환상적인 동화 나라에서 배우고 놀 수 있습니다.";
        break;
      case "/glim":
        title = "그림동화 시작 페이지 - 그림을 그리면 나만의 동화 창작";
        metaDescription =
          "당신만의 콘텐츠 여정을 시작하세요. 그림을 통해서 진행되는 흥미진진한 이야기가 기다리고 있습니다.";
        break;
      case "/mylibrary":
        title = "마이 라이브러리 페이지 - 당신의 콘텐츠 보관함";
        metaDescription =
          "마이 라이브러리에서 당신이 만든 콘텐츠를 다시 볼 수 있습니다. 언제 어디서나 쉽게 접근할 수 있습니다.";
        break;
      case "/storybook":
        title = "스토리북 페이지 - 원하는 페이지는 여기에 있습니다.";
        metaDescription =
          "스토리북 페이지에서 당신만의 독특한 이야기를 창작해보세요. 창의적인 글쓰기의 즐거움을 경험할 수 있습니다.";
        break;
    }

    // 타이틀과 메타 태그 설정

    if (title) {
      document.title = title;
    }

    if (metaDescription) {
      const metaDescriptionTag = document.querySelector(
        'head > meta[name="description"]'
      );
      if (metaDescriptionTag) {
        metaDescriptionTag.content = metaDescription;
      }
    }
  };

  render() {
    return (
      <ChatProvider>
        {" "}
        {/* ChatProvider를 추가 */}
        <div id="App">
          <AuthProvider>
            <Routes>
              <Route path="/" element={<MainPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/kakao-login" element={<KakaoLogin />} />
              <Route path="/join" element={<Join />} />

              <Route path="/tuktakmain" element={<TuktakMain />} />
              <Route path="/tuktaktale" element={<TuktakTale />} />
              <Route path="/dodukq" element={<Doduk_Q />} />
              <Route path="/doduk-q-quickdraw" element={<DodukQQuickdraw />} />
              <Route
                path="/book/doduk/:bookId/story/:storyNum"
                element={<DodukPage />}
              />
              <Route path="/doduk-q-image" element={<DodukImage />} />
              <Route
                path="/:bookId/doduk-recycling-game"
                element={<DodukStartGame />}
              />
              <Route path="/glim" element={<Glim />} />
              <Route path="/glim-fairytale" element={<GlimFairytale />} />
              <Route path="/mylibrary" element={<Mylibrary />} />
              <Route path="/storybook" element={<Storybook />} />
              <Route path="/doduk-replay/:bookId" element={<DodukReplay />} />
            </Routes>
          </AuthProvider>
        </div>
      </ChatProvider>
    );
  }
}

// withRouter 대신 Router 컴포넌트로 App을 감싸줍니다.
const AppWithRouter = () => {
  RouteChangeTracker();

  return (
      <App />
  );
};

export default AppWithRouter;
