import os
import asyncio
from typing import Any

import uvicorn
from fastapi import FastAPI, Body, WebSocket, WebSocketDisconnect, File, UploadFile
from starlette.websockets import WebSocketState
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from queue import Queue
from pydantic import BaseModel
import tempfile

from api_key import openai_api_key
from langchain.agents import AgentType, initialize_agent
from langchain.chat_models import ChatOpenAI
from langchain.memory import ConversationBufferWindowMemory
from langchain.callbacks.streaming_aiter import AsyncIteratorCallbackHandler
from langchain.callbacks.streaming_stdout_final_only import FinalStreamingStdOutCallbackHandler
from langchain.schema import LLMResult
from langchain.chains.llm import LLMChain
from langchain.prompts import PromptTemplate
from langchain.utilities.dalle_image_generator import DallEAPIWrapper


from query_data import get_prompt

import requests
import time
from PIL import Image
import tempfile

app = FastAPI()
origins = [ "*" ]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

child_id = 1
child_name = "우철"

@app.get("/health")
async def health():
    """Check the api is running"""
    return {"status": "🤙"}

# JSON 데이터를 파싱하기 위한 Pydantic 모델 정의
class Description(BaseModel):
    sceneDescription: str  # JSON 데이터에 있는 필드 이름과 일치해야 합니다.

import openai

@app.post("/generate_image")
def generate_and_download_image(descript : Description):
    image_style_keywords = "Use bright and colorful visuals. The colors should be pastel, giving the image a soft, pleasant atmosphere. The characters in the scene should be well-detailed and joyful."

    # 이미지 생성 요청을 위한 프롬프트 변수
    visual_storytelling_prompt = (
        f"배경, 캐릭터, 행동은 시각적으로만 감정을 전달할 수 있도록 묘사."
        f"이전 장들의 스타일과 일관성을 유지하며, 아이들의 상상력을 자극할 수 있는 순수한 시각적 경험을 제공해야 합니다."
    )
    image_prompt = (
        f"{visual_storytelling_prompt} "
        f"4세에서 7세를 대상으로 하는 동화 이미지"
        f"하나의 이미지만 생성"
        f"Descriptive scene: {descript.sceneDescription}"
        f"This image must be in the {image_style_keywords} style and disney or pixar style"
        f"그림에는 텍스트 없음."
        # f"Previous chapters' contents and images: {' '.join([obj.content for obj in previous_chapters['chat_history']])}"
    )

    try:
        response = openai.Image.create(
            api_key=openai_api_key,
            model="dall-e-3",
            prompt=image_prompt,
            n=1,
            size="1024x1024"
        )
        # 다운로드할 이미지의 url
        image_url = response['data'][0]['url']
        image_path = download_image(image_url)
        return FileResponse(image_path, headers={"Content-Type": "image/png"})
    except Exception as e:
        print(f"Error in API call: {e}")
        return None

# 이미지를 다운로드하고 로컬 파일 시스템에 저장하는 역할
def download_image(image_url, format="jpg"):
    response = requests.get(image_url)
    if response.status_code == 200:
        os.makedirs('images', exist_ok=True)

        base_name = "image"
        current_time = int(time.time())
        file_name = f"{base_name}_{current_time}.{format}"
        file_path = os.path.join('images', file_name)

        # 파일 이름 중복 확인 및 처리
        counter = 2
        while os.path.exists(file_path):
            file_name = f"{base_name}_{current_time}_{counter}.{format}"
            file_path = os.path.join('images', file_name)
            counter += 1

        with open(file_path, 'wb') as file:
            file.write(response.content)
        print("image donwload done!")
        return file_path
    else:
        raise Exception("Failed to download the image.")

if __name__ == "__main__":
    uvicorn.run(
        "websocket_image:app",
        host="localhost",
        port=8001
    )