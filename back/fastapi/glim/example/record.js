let isRecording = false;
let mediaRecorder;
let audioChunks = [];

// 녹음 시작 또는 중지
document.getElementById("recordButton").addEventListener("click", function() {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
});

// 녹음 시작
async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();

    mediaRecorder.addEventListener("dataavailable", event => {
        audioChunks.push(event.data);
    });

    mediaRecorder.addEventListener("stop", () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
        console.log(audioBlob)
        sendAudioToServer(audioBlob);
        audioChunks = [];
    });

    document.getElementById("status").textContent = "녹음 중...";
    isRecording = true;
}

// 녹음 중지
function stopRecording() {
    mediaRecorder.stop();
    document.getElementById("status").textContent = "녹음 대기 중...";
    isRecording = false;
}

// 서버로 오디오 데이터 전송
function sendAudioToServer(audioBlob) {
    const formData = new FormData();
    formData.append("audioFile", audioBlob);

    fetch("http://localhost:8002/transcribe", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log("서버로부터의 응답:", data);
    })
    .catch(error => {
        console.error("오류 발생:", error);
    });
}
