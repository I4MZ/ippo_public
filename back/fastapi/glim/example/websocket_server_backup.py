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
# from langchain.llms import OpenAI
from langchain.prompts import PromptTemplate
from langchain.utilities.dalle_image_generator import DallEAPIWrapper

# vision 사용
from google.cloud import vision
from google.cloud import vision_v1
import tempfile

# 번역
from google.cloud import translate_v2 as translate
translator = translate.Client()


os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'back/fastapi/glim/example/i4mz-vision-key.json'
vision_client = vision.ImageAnnotatorClient()

from query_data import get_prompt

from openai import OpenAI
openai_client = OpenAI(api_key=openai_api_key)
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
# initialize the agent (we need to do this for the callbacks)
llm = ChatOpenAI(
    openai_api_key=openai_api_key,
    model_name="gpt-4-1106-preview",
    streaming=True,  # ! important
    callbacks=[]  # ! important (but we will add them later)
)
# 유저별 메모리 관리를 위한 딕셔너리
user_memory = {}
def get_or_create_memory(child_id):
    if child_id not in user_memory:
        # user_memory[child_id] = ConversationBufferWindowMemory(memory_key="chat_history", k=5, return_messages=True, output_key="output")
        user_memory[child_id] = ConversationBufferWindowMemory(memory_key="chat_history", k=5, return_messages=True)
    return user_memory[child_id]

memory = get_or_create_memory(child_id=child_id)
prompt = get_prompt(child_name)

chain = LLMChain(
    llm=llm,
    prompt=prompt,
    verbose=True,
    memory=memory
)

class AsyncCallbackHandler(AsyncIteratorCallbackHandler):
    # content: str = ""
    # final_answer: bool = False

    def __init__(self) -> None:
        super().__init__()

    async def on_llm_new_token(self, token: str, **kwargs: Any) -> None:
        if token is not None and token != "":
            self.queue.put_nowait(token)


async def run_call(query: str, stream_it: AsyncCallbackHandler):
    # assign callback handler
    chain.llm.callbacks = [stream_it]
    # agent.agent.llm_chain.llm.callbacks = [stream_it]
    # now query
    await chain.acall(inputs={"keyword_text": query})

# request input format
class Query(BaseModel):
    text: str

async def create_gen(query: str, stream_it: AsyncCallbackHandler):
    task = asyncio.create_task(run_call(query, stream_it))
    async for token in stream_it.aiter():
        yield token
    await task

# client 별 WebSocket 연결 관리를 위한 딕셔너리
active_websockets = {}
# WebSocket endpoint
@app.websocket("/chat")
async def websocket_chat(websocket: WebSocket):
    await websocket.accept()
    active_websockets[child_id] = websocket
    stream_it = AsyncCallbackHandler()

    async def receive_and_process(websocket: WebSocket):
        while websocket.application_state == WebSocketState.CONNECTED and websocket.client_state == WebSocketState.CONNECTED:
            try:
                # WebSocket에서 메시지 수신
                data = await websocket.receive_text()
                await run_call(data, stream_it)
            except Exception as e:
                print(f"Error input text: {e}")
                break

    async def send_streaming_response(websocket: WebSocket):
        try:
            async for token in stream_it.aiter():
                # Check if the WebSocket is still connected before sending
                if websocket.application_state != WebSocketState.CONNECTED or websocket.client_state != WebSocketState.CONNECTED:
                    break
                # 스트리밍 응답을 WebSocket으로 전송
                await websocket.send_text(token)
        except Exception as e:
            print(f"Error send data: {e}")
        finally:
            if websocket.application_state == WebSocketState.CONNECTED and websocket.client_state == WebSocketState.CONNECTED:
                await websocket.close()
            active_websockets.pop(child_id, None)
    # 두 비동기 작업을 동시에 실행
    try:
        receive_task = asyncio.create_task(receive_and_process(websocket))
        send_task = asyncio.create_task(send_streaming_response(websocket))
        await asyncio.gather(receive_task, send_task)
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        if websocket.application_state == WebSocketState.CONNECTED and websocket.client_state == WebSocketState.CONNECTED:
            await websocket.close()
        active_websockets.pop(child_id, None)

HEART_BEAT_INTERVAL = 5
async def is_websocket_active(ws: WebSocket) -> bool:
    if not (ws.application_state == WebSocketState.CONNECTED and ws.client_state == WebSocketState.CONNECTED):
        return False
    try:
        await asyncio.wait_for(ws.send_json({'type': 'ping'}), HEART_BEAT_INTERVAL)
        message = await asyncio.wait_for(ws.receive_json(), HEART_BEAT_INTERVAL)
        assert message['type'] == 'pong'
    except BaseException:  # asyncio.TimeoutError and ws.close()
        return False
    return True

@app.get("/health")
async def health():
    """Check the api is running"""
    return {"status": "🤙"}



@app.post("/record")
async def record(audio: UploadFile = File(...)):
    print("type: ", audio.content_type)
    contents = await audio.read()  # 파일 데이터를 읽음

    # 임시 파일 생성
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
        temp_file.write(contents)
        temp_file_path = temp_file.name

    # Whisper 모델에 적용
    with open(temp_file_path, 'rb') as file_to_send:
        transcript = openai_client.audio.transcriptions.create(
            model="whisper-1",
            file=file_to_send
        )

    # 결과 반환
    return {"transcript": transcript}


@app.post("/vision")
async def process_image(picture: UploadFile = File(...)):
    print("vision 진입")
    contents = await picture.read()

    image = vision_v1.types.Image(content=contents)

    try:
        response = vision_client.label_detection(image=image)
        labels = response.label_annotations
        descriptions = [label.description for label in labels]

        # 번역
        translated_descriptions = [translator.translate(desc, target_language='ko')['translatedText'] for desc in descriptions]
        print("Translated Descriptions:", translated_descriptions)

    except Exception as e:
        print("Error during image analysis:", e)
        translated_descriptions = []

    return {"descriptions": translated_descriptions}


# JSON 데이터를 파싱하기 위한 Pydantic 모델 정의
class Description(BaseModel):
    sceneDescription: str  # JSON 데이터에 있는 필드 이름과 일치해야 합니다.

import openai

@app.post("/generate_image")
def generate_and_download_image(sceneDescription : Description):
    image_style_keywords = "Please use bright and colorful visuals. The colors should be pastel, giving the image a soft, pleasant atmosphere. The characters in the scene should be well-detailed and joyful."

    # 이미지 생성 요청을 위한 프롬프트 변수
    visual_storytelling_prompt = (
        f"이미지는 오로지 시각적 스토리텔링 요소에만 집중해야 합니다."
        f"배경, 캐릭터, 행동은 시각적으로만 감정과 상황을 전달할 수 있도록 묘사되어야 합니다."
        f"이전 장들의 스타일과 일관성을 유지하며, 아이들의 상상력을 자극할 수 있는 순수한 시각적 경험을 제공해야 합니다."
    )
    image_prompt = (
        f"{visual_storytelling_prompt} "
        f"4세에서 7세를 대상으로 하는 동화입니다."
        f"이미지 당 하나의 장면만 있어야 합니다."
        f"Descriptive scene: {sceneDescription}"
        f"This image must be in the {image_style_keywords} style"
        f"(중요) 예외 상황 처리!! 그림에는 텍스트가 표시되지 않도록 합니다."
        # f"Previous chapters' contents and images: {' '.join([obj.content for obj in previous_chapters['chat_history']])}"
    )

    try:
        response = openai.Image.create(
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
        "websocket_server:app",
        host="localhost",
        port=8000
    )