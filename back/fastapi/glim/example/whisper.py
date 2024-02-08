from fastapi import FastAPI, File, UploadFile
from io import BytesIO
from pydub import AudioSegment

from fastapi.middleware.cors import CORSMiddleware
import logging
logging.basicConfig(level=logging.DEBUG)

import os
from dotenv import load_dotenv
load_dotenv()
openai_api_key = os.getenv('OPENAI_API_KEY')

app = FastAPI()

origins = [
    "http://localhost:3000",  # React 앱을 로컬에서 호스팅하는 경우
    "http://localhost:8080",  # Vue 앱을 로컬에서 호스팅하는 경우
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from openai import OpenAI
client = OpenAI(api_key=openai_api_key)

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    # 파일을 읽어 오디오 데이터로 변환
    audio_data = await file.read()


    # OpenAI API를 사용하여 음성 파일을 텍스트로 변환
    transcript = client.audio.transcriptions.create(
        model="whisper-1", 
        file=audio_data  # 파일 데이터를 바이트 형식으로 전달
    )
    print(transcript)
    return transcript

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
