import { useParams } from "react-router-dom";
import DodukSecond from "./doduk-second-story";
import DodukEnding from "./doduk-ending-story";
import DodukIntro from "./doduk-intro-story";

const DodukPage = () => {
  const { storyNum } = useParams();

  switch (storyNum) {
    case "1":
      return <DodukIntro />;
    case "2":
      return <DodukSecond />;
    case "3":
      return <DodukEnding />;
    default:
      return <div>Not Found</div>;
  }
};

export default DodukPage;
