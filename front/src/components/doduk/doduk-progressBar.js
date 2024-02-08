import "./popo-runner-game/styles.css";

function ProgressBar({ progress }) {
  const steps = [
    { label: "어떤 모험을 떠날까?!", completion: 33 },
    { label: "멋진 그림을 그리고 있어!", completion: 66 },
    { label: "모험이 완성되었어!", completion: 100 },
  ];

  return (
    <>
      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="progress-step-container">
        {steps.map((step, index) => (
          <div className="progress-step" key={index}>
            <div
              className={`step-check ${
                progress >= step.completion ? "complete" : ""
              }`}
            ></div>
            <span className="step-label">{step.label}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export default ProgressBar;
