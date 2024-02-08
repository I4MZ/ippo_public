import os
import asyncio
import cv2 as cv
import numpy as np
from io import BytesIO
from typing import Any

import uvicorn
from fastapi import FastAPI, Body, WebSocket, WebSocketDisconnect, File, UploadFile
from starlette.websockets import WebSocketState
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel

from api_key import openai_api_key
from langchain.chat_models import ChatOpenAI
from langchain.memory import ConversationBufferWindowMemory
from langchain.callbacks.streaming_aiter import AsyncIteratorCallbackHandler


from langchain.chains.llm import LLMChain

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




@app.post("/vision")
async def process_image(picture: UploadFile = File(...)):
    print("vision 진입")
    contents = await picture.read()

    # image = vision_v1.types.Image(content=contents)

    try:
        # response = vision_client.label_detection(image=image)
        # labels = response.label_annotations
        # descriptions = [label.description for label in labels]

        # 번역
        # translated_descriptions = [translator.translate(desc, target_language='ko')['translatedText'] for desc in descriptions]
        # print("Translated Descriptions:", translated_descriptions)
        translated_descriptions = ["눈", "눈사람", "요정", "꼬치", "목도리", "바가지", "똥"]
    except Exception as e:
        print("Error during image analysis:", e)
        translated_descriptions = []

    return {"descriptions": translated_descriptions}




def convert_to_cartoon(image):
    # 이미지를 그레이스케일로 변환합니다.
    gray = cv.cvtColor(image, cv.COLOR_BGR2GRAY)
    # 미디언 블러를 적용하여 노이즈를 줄입니다.
    gray = cv.medianBlur(gray, 5)
    # 어댑티브 쓰레시홀딩을 적용하여 에지 검출을 강화합니다.
    edges = cv.adaptiveThreshold(gray, 255, cv.ADAPTIVE_THRESH_MEAN_C,
                                cv.THRESH_BINARY, 9, 9)
    # Process the frame here
    invert_image = cv.bitwise_not(gray)
    blur_image = cv.GaussianBlur(invert_image, (21, 21), 0)
    invert_blur = cv.bitwise_not(blur_image)
    cartoon = cv.divide(edges, invert_blur, scale=256.0)

    return cartoon

@app.post("/convert-to-cartoon/")
async def create_cartoon_image(file: UploadFile = File(...)):
    # 업로드된 파일을 읽습니다.
    image_stream = await file.read()
    image_stream = BytesIO(image_stream) # Byte stream 객체
    image = np.asarray(bytearray(image_stream.read()), dtype=np.uint8) # byte array 객체로 변환
    image = cv.imdecode(image, cv.IMREAD_COLOR)

    # 만화 스타일 이미지로 변환합니다.
    cartoon_image = convert_to_cartoon(image)

    # 변환된 이미지를 메모리에 저장합니다.
    _, encoded_image = cv.imencode('.png', cartoon_image)
    encoded_image_stream = BytesIO(encoded_image.tobytes())

    # 응답으로 변환된 이미지를 반환합니다.
    return StreamingResponse(encoded_image_stream, media_type="image/png")


def convert_to_sketch(image):
    # 이미지를 그레이스케일로 변환합니다.
    gray_image = cv.cvtColor(image, cv.COLOR_BGR2GRAY)
    # 반전 이미지 생성
    invert_image = cv.bitwise_not(gray_image)
    # 가우시안 블러 적용
    blur_image = cv.GaussianBlur(invert_image, (21, 21), 0)
    # 블러 이미지 반전
    invert_blur = cv.bitwise_not(blur_image)
    # 색상 도드라짐 적용
    sketch = cv.divide(gray_image, invert_blur, scale=256.0)

    return sketch

@app.post("/convert-to-sketch/")
async def create_cartoon_image(file: UploadFile = File(...)):
    # 업로드된 파일을 읽습니다.
    image_stream = await file.read()
    image_stream = BytesIO(image_stream) # Byte stream 객체
    image = np.asarray(bytearray(image_stream.read()), dtype=np.uint8) # byte array 객체로 변환
    image = cv.imdecode(image, cv.IMREAD_COLOR)

    # 만화 스타일 이미지로 변환합니다.
    cartoon_image = convert_to_sketch(image)

    # 변환된 이미지를 메모리에 저장합니다.
    _, encoded_image = cv.imencode('.png', cartoon_image)
    encoded_image_stream = BytesIO(encoded_image.tobytes())

    # 응답으로 변환된 이미지를 반환합니다.
    return StreamingResponse(encoded_image_stream, media_type="image/png")




def convert_to_cartoon(image):
    # 이미지를 그레이스케일로 변환합니다.
    gray = cv.cvtColor(image, cv.COLOR_BGR2GRAY)
    # 미디언 블러를 적용하여 노이즈를 줄입니다.
    gray = cv.medianBlur(gray, 5)
    # 어댑티브 쓰레시홀딩을 적용하여 에지 검출을 강화합니다.
    edges = cv.adaptiveThreshold(gray, 255, cv.ADAPTIVE_THRESH_MEAN_C,
                                cv.THRESH_BINARY, 9, 9)
    # Process the frame here
    invert_image = cv.bitwise_not(gray)
    blur_image = cv.GaussianBlur(invert_image, (21, 21), 0)
    invert_blur = cv.bitwise_not(blur_image)
    cartoon = cv.divide(edges, invert_blur, scale=256.0)

    return cartoon

@app.post("/convert-to-cartoon/")
async def create_cartoon_image(file: UploadFile = File(...)):
    # 업로드된 파일을 읽습니다.
    image_stream = await file.read()
    image_stream = BytesIO(image_stream) # Byte stream 객체
    image = np.asarray(bytearray(image_stream.read()), dtype=np.uint8) # byte array 객체로 변환
    image = cv.imdecode(image, cv.IMREAD_COLOR)

    # 만화 스타일 이미지로 변환합니다.
    cartoon_image = convert_to_cartoon(image)

    # 변환된 이미지를 메모리에 저장합니다.
    _, encoded_image = cv.imencode('.png', cartoon_image)
    encoded_image_stream = BytesIO(encoded_image.tobytes())

    # 응답으로 변환된 이미지를 반환합니다.
    return StreamingResponse(encoded_image_stream, media_type="image/png")


def convert_to_sketch(image):
    # 이미지를 그레이스케일로 변환합니다.
    gray_image = cv.cvtColor(image, cv.COLOR_BGR2GRAY)
    # 반전 이미지 생성
    invert_image = cv.bitwise_not(gray_image)
    # 가우시안 블러 적용
    blur_image = cv.GaussianBlur(invert_image, (21, 21), 0)
    # 블러 이미지 반전
    invert_blur = cv.bitwise_not(blur_image)
    # 색상 도드라짐 적용
    sketch = cv.divide(gray_image, invert_blur, scale=256.0)

    return sketch

@app.post("/convert-to-sketch/")
async def create_cartoon_image(file: UploadFile = File(...)):
    # 업로드된 파일을 읽습니다.
    image_stream = await file.read()
    image_stream = BytesIO(image_stream) # Byte stream 객체
    image = np.asarray(bytearray(image_stream.read()), dtype=np.uint8) # byte array 객체로 변환
    image = cv.imdecode(image, cv.IMREAD_COLOR)

    # 만화 스타일 이미지로 변환합니다.
    cartoon_image = convert_to_sketch(image)

    # 변환된 이미지를 메모리에 저장합니다.
    _, encoded_image = cv.imencode('.png', cartoon_image)
    encoded_image_stream = BytesIO(encoded_image.tobytes())

    # 응답으로 변환된 이미지를 반환합니다.
    return StreamingResponse(encoded_image_stream, media_type="image/png")



if __name__ == "__main__":
    uvicorn.run(
        "websocket_server:app",
        host="localhost",
        port=8000
    )