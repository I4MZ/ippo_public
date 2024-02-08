from fastapi import FastAPI, File, UploadFile

from fastapi.middleware.cors import CORSMiddleware
import logging
logging.basicConfig(level=logging.DEBUG)

import os
from dotenv import load_dotenv
load_dotenv()
openai_api_key = os.getenv('OPENAI_API_KEY')

from openai import OpenAI
client = OpenAI(api_key=openai_api_key)

def transcribe_local_file(file_path: str):
    audio_file= open(file_path, "rb")
    transcript = client.audio.transcriptions.create(
        model="whisper-1", 
        file=audio_file
    )
    print(transcript.text)
    return transcript

if __name__ == "__main__":
    # import uvicorn
    # uvicorn.run(app, host="0.0.0.0", port=8002)
    
    transcribe_local_file("test.mp3")  # 로컬 파일의 경로를 지정

