import os
import asyncio
import cv2 as cv
import numpy as np
from io import BytesIO
from typing import Any, Dict, List, Optional

import uvicorn
from fastapi import FastAPI, Body, WebSocket, WebSocketDisconnect, File, UploadFile, Request, APIRouter
from starlette.websockets import WebSocketState
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from queue import Queue
from pydantic import BaseModel
import tempfile

import os
# 환경변수에서 OpenAI API 키를 가져옵니다.
openai_api_key = os.environ.get('OPENAI_API_KEY')

# API 키가 설정되지 않았다면 오류 메시지를 출력합니다.
if not openai_api_key:
    raise ValueError("환경변수 'OPENAI_API_KEY'가 설정되지 않았습니다.")
from langchain.callbacks.streaming_aiter import AsyncIteratorCallbackHandler
from query_data import *

from openai import OpenAI
openai_client = OpenAI(api_key=openai_api_key)
import requests
import time
from PIL import Image
import tempfile
from enum import Enum
import json
import platform

# vision 사용
from google.cloud import vision
from google.cloud import vision_v1
import tempfile

# 운영 체제 확인
os_type = platform.system()

# Windows OS인 경우
if os_type == 'Windows':
   os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = './i4mz-vision-key.json'
# Ubuntu OS인 경우
elif os_type == 'Linux':
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/app/i4mz-vision-key.json'
else:
   print("지원되지 않는 운영 체제입니다.")

vision_client = vision.ImageAnnotatorClient()

# 번역
from google.cloud import translate_v2 as translate
translator = translate.Client()

router = APIRouter()
app = FastAPI()
app.include_router(router, prefix="/glim")

origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AsyncCallbackHandler(AsyncIteratorCallbackHandler):
    # content: str = ""
    # final_answer: bool = False

    def __init__(self) -> None:
        super().__init__()

    async def on_llm_new_token(self, token: str, **kwargs: Any) -> None:
        if token is not None and token != "":
            self.queue.put_nowait(token)


async def run_call(chain, query: str, stream_it: AsyncCallbackHandler):
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

async def string_streamer(string: str):
    for char in string:
        await asyncio.sleep(0.01)  # Sleep for 1 second
        yield char

class StoryVersion(str, Enum):
    chapter1 = "chapter1"
    chapter2 = "chapter2"
    chapter3 = "chapter3"

class ChatMessage(BaseModel):
    child_name: str
    child_id: str
    text: str


@app.websocket("/glim/ws/chat/{version}")
async def websocket_endpoint(websocket: WebSocket, version: StoryVersion):
    print("websocket 진입: ", websocket)
    print("version: ", version)
    await websocket.accept()
    try:
        data = await websocket.receive_text()
        print("data: ", data)
        # print("data: ", data) # keyword 반환값 확인
        # JSON 문자열을 Pydantic 모델로 변환
        chat_message = ChatMessage.model_validate_json(data)

        if version == StoryVersion.chapter1:
            string = f"""챕터 1: 눈의 마법과 첫 번째 눈사람

                    "나는 겨울이 좋아, {chat_message.child_name}가 말했어. 하얀 눈이 내리는 날, {chat_message.child_name}는 창밖을 보며 설레는 마음을 감추지 못했어."

                    그날 오후, {chat_message.child_name}는 두꺼운 장갑과 모자를 쓰고 밖으로 나갔어. 눈이 쌓인 정원에서 {chat_message.child_name}은 눈을 굴려 눈사람을 만들기 시작했어. 먼저 눈을 굴려서 큰 눈덩이를 만들었고, 그 위에 더 작은 눈덩이를 올렸어.

                    "이제 눈사람에게 눈과 코, 입을 만들어줘야겠어!" {chat_message.child_name}이 생각했어. 까만 돌멩이로 눈을 만들고, 당근으로 코를, 작은 나뭇가지로 입을 만들었지. 마침내, 눈사람이 완성됐어!

                    {chat_message.child_name}, 너는 눈사람이 어떤 마법 같은 특별한 능력을 가질 수 있다고 생각해? 다음 챕터를 위해 상상해볼까?

                     장면묘사: {chat_message.child_name}는 빨간 모자와 두툼한 장갑을 끼고 있어. 눈이 많이 쌓인 정원에는 {chat_message.child_name}이 만든 눈사람이 서 있어. 눈사람은 까만 돌멩이로 된 눈과 당근 코, 나뭇가지 입을 가지고 있어. {chat_message.child_name}은 행복한 표정으로 눈사람을 바라보고 있고, 눈이 부드럽게 내리고 있어."""


            # ... 첫 번째 이야기 전송 로직
        elif version == StoryVersion.chapter2:
            string = f"""챕터 2: 봄의 도래와 눈사람의 위기

                    "눈사람은 봄이 되면 물이 돼요," {chat_message.child_name}가 슬픈 목소리로 말했어. 날씨가 따뜻해지고 눈이 녹기 시작했을 때, {chat_message.child_name}는 눈사람이 사라질까 봐 걱정이 됐어.

                    봄이 오면서, 눈사람 주변의 눈은 점점 녹기 시작했어. {chat_message.child_name}은 눈사람이 녹아서 없어지지 않게 하고 싶었지만, 어떻게 해야 할지 몰랐어.

                    "나는 너를 구할 방법을 찾을 거야, 눈사람아!" {chat_message.child_name}이 결심했어. {chat_message.child_name}은 도서관으로 달려가서 눈사람을 보호하는 방법에 대해 책을 찾기 시작했어.

                    {chat_message.child_name}, 너는 {chat_message.child_name}이 눈사람을 구할 수 있는 방법을 상상할 수 있을까? 다음 챕터에서 그 해결책을 찾아보자!

                     장면묘사: {chat_message.child_name}는 빨간 모자와 두툼한 장갑을 끼고 있어. {chat_message.child_name}은 걱정스러운 표정으로 녹고 있는 눈사람을 바라보고 있어. 눈사람 주변의 눈은 물로 변하고 있고, 봄꽃들이 피기 시작했어. 배경은 눈이 녹아 물웅덩이가 생긴 정원이야."""

        elif version == StoryVersion.chapter3:
            string = f"""챕터 3: 냉장고에서의 새로운 집

                    "냉장고에 눈사람을 넣어줘요!" {chat_message.child_name}이 기발한 아이디어를 떠올렸어. {chat_message.child_name}는 눈사람을 구하기 위해 큰 냉장고를 찾기 시작했어.

                    {chat_message.child_name}은 부엌으로 가서 큰 냉장고를 열었어. 조심스럽게 눈사람을 들어서 냉장고 안에 넣었지. 냉장고 안에서, 눈사람은 녹지 않고 안전하게 있을 수 있었어.

                    "이제 걱정할 필요 없어, 눈사람아. 여기서 넌 계속 있을 수 있어!" {chat_message.child_name}이 기쁜 마음으로 말했어. 눈사람은 냉장고 안에서 새로운 집을 찾았고, {chat_message.child_name}은 눈사람을 구한 것에 대해 매우 행복했어.

                    이야기를 통해 우리는 문제에 직면했을 때 포기하지 않고 창의적인 해결책을 찾을 수 있다는 것을 배웠어. 어떤 상황에서도 항상 희망과 해결책이 있다는 걸 기억해야 해. {chat_message.child_name}처럼, 우리 모두는 우리가 사랑하는 것들을 보호하기 위해 노력할 수 있어!

                    이야기가 끝났어, {chat_message.child_name}! 너와 함께 동화를 만들 수 있어서 정말 즐거웠어. 다음에 또 만나자!

                    장면묘사: {chat_message.child_name}는 빨간 모자와 두툼한 장갑을 끼고 있어. {chat_message.child_name}은 기쁜 표정으로 열린 냉장고를 바라보고 있어. 냉장고 안에는 눈사람이 안전하게 서 있어. 냉장고는 밝고 깨끗해, 눈사람에게 딱 맞는 장소야."""

        async for token in string_streamer(string):
            # WebSocket 상태 확인 및 메시지 전송
            if websocket.application_state != WebSocketState.CONNECTED or websocket.client_state != WebSocketState.CONNECTED:
                break
            await websocket.send_text(token)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await websocket.close()

@app.websocket("/chat1/")
async def websocket_chat(websocket: WebSocket):
    await websocket.accept()

    stream_it = AsyncCallbackHandler()

    async def receive_and_process(websocket: WebSocket):
        while websocket.application_state == WebSocketState.CONNECTED and websocket.client_state == WebSocketState.CONNECTED:
            try:
                # WebSocket에서 메시지 수신
                data = await websocket.receive_text()
                print(data)
                chat_message = ChatMessage.model_validate_json(data)
                chain = get_fairytale_chain(chat_message.child_id, chat_message.child_name)

                await run_call(chain, chat_message.text, stream_it)
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

class ChapterData(BaseModel):
    child_id: int
    child_name: str
    chapter1: str
    chapter2: str
    chapter3: str

@app.post("/glim/questions/")
async def create_questions(chapter_data: ChapterData):

    # chain = get_question_chain(chapter_data.child_id, chapter_data.child_name, (chapter_data.chapter1, chapter_data.chapter2, chapter_data.chapter3))
    # print(chain.predict())
    # return chain.predict()
    predict = """챕터 1: 눈의 마법과 첫 번째 눈사람
질문: 신우철아, 눈사람을 만들 때 가장 재미있었던 부분은 무엇이었니? 눈사람에게 특별한 능력을 주고 싶었던 이유가 뭐야?

챕터 2: 봄의 도래와 눈사람의 위기
질문: 신우철아, 눈사람이 녹아 없어질까 봐 걱정될 때 어떤 감정을 느꼈니? 눈사람을 도와주고 싶었던 마음은 어디에서 왔다고 생각해?

챕터 3: 냉장고에서의 새로운 집
질문: 신우철아, 냉장고에 눈사람을 넣어준 건 정말 창의적인 생각이었어! 눈사람을 냉장고에 넣고 나서 기분이 어땠니? 눈사람이 새로운 집에서 어떻게 지낼 것 같아?"""
    return predict

class Message(BaseModel):
    text: Optional[str] = None
    keywords: Optional[str] = None
    sender: str
    gender: Optional[str] = None
    imageUrl: Optional[str] = None

class Chapter(BaseModel):
    chapter_number: int
    chapter_content: List[Message]

class StoryContent(BaseModel):
    story: List[Chapter]

@app.post("/glim/analysis/")
async def create_analysis_report(request: Request):
    text_data = await request.body()
    contents = text_data.decode('utf-8')
    print(contents)
    chain = get_attachment_analysis_chain(contents)
    # return chain.predict()
    temp = f"""아동의 동화 응답을 토대로 애착 유형을 분석한 결과, 아동은 보안 애착 유형을 나타내고 있습니다. 보안 애착 유형은 안정적이고 안전한 환경에서 자라는 아동들이 보여주는 특징적인 애착 유형입니다. 이 유형의 아동들은 보호자와의 관계에서 안정감과 신뢰를 느끼며, 새로운 경험에 대한 호기심과 자신감을 가지고 있습니다.

아동의 동화 응답에서는 주인공인 신우철이 눈사람을 만들고 보호하기 위해 노력하는 이야기가 나타났습니다. 이는 아동이 친밀한 관계를 형성하고 유지하기 위해 노력하는 보안 애착 유형의 특징을 보여줍니다. 신우철은 눈사람을 만들 때 자신감과 용기를 가지고 있으며, 눈사람에게 특별한 능력을 부여하고 싶어하는 모습을 보입니다. 이는 보안 애착 유형의 아동들이 새로운 경험을 통해 자신의 능력을 발휘하고 성장하려는 성향을 나타냅니다.

또한, 아동의 동화 응답에서는 신우철이 눈사람이 녹아 없어질까 봐 걱정하는 모습이 나타났습니다. 이는 보안 애착 유형의 아동들이 보호자와의 연결을 유지하고 싶어하는 욕구를 보여줍니다. 신우철은 눈사람을 구하기 위해 노력하고, 냉장고에 눈사람을 넣어 안전하게 보호하려는 모습을 보입니다. 이는 보안 애착 유형의 아동들이 보호자와의 관계에서 안정감과 안전을 찾으며, 보호자의 도움과 지원을 필요로 한다는 특징을 나타냅니다.

아동의 동화 응답에서는 보안 애착 유형의 특징뿐만 아니라, 자신의 능력을 발휘하고 신뢰를 가지며 새로운 경험에 호기심을 가지는 모습도 나타났습니다. 이는 보안 애착 유형의 아동들이 안정적인 관계에서 자신감을 키우고 성장하는 경향을 보여줍니다.

이러한 분석 결과를 토대로 보호자는 아동의 애착 유형을 이해하고, 아동과의 상호작용에서 안정감과 신뢰를 중요시하는 접근 방식을 채택할 수 있습니다. 또한, 아동의 자신감을 키우고 새로운 경험에 대한 호기심을 지원하며, 보호자와의 관계에서 안정감과 안전을 제공하는 것이 중요합니다.

이러한 평가 결과는 아동의 개별적인 상황과 맥락을 고려하여 신중하게 해석되어야 합니다. 보호자는 아동의 전반적인 행동, 대화, 그리고 생활 환경을 함께 고려하여 아동의 애착 유형을 이해하고 적절한 지원을 제공할 수 있도록 노력해야 합니다.

이 보고서는 아동의 애착 유형을 파악하고 이에 대한 이해를 돕기 위해 작성되었습니다. 추가적인 평가와 상담이 필요한 경우, 전문가와의 상담을 권장합니다."""
    return temp

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

@app.get("/glim/health")
async def health():
    """Check the api is running"""
    return {"status": "🤙"}


@app.post("/glim/record/")
async def record(audio: UploadFile = File(...)):
    print("type: ", audio.content_type)
    contents = await audio.read()  # 파일 데이터를 읽음

    # 임시 파일 생성
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
        temp_file.write(contents)
        temp_file_path = temp_file.name

    # 결과 반환
    # return {"transcript": transcript}
    return {"transcript": {"text": "결과 반환"}}

# JSON 데이터를 파싱하기 위한 Pydantic 모델 정의
class Description(BaseModel):
    sceneDescription: str  # JSON 데이터에 있는 필드 이름과 일치해야 합니다.


@app.post("/glim/generate_image/{version}/")
def generate_and_image(descript : Description, version: StoryVersion):
    try:
        if version == StoryVersion.chapter1:
            image_path = 'images/image_1704366705.jpg'

        elif version == StoryVersion.chapter2:
            image_path = 'images/image_1704366864.jpg'

        elif version == StoryVersion.chapter3:
            image_path = 'images/image_1704366968.jpg'

        # 이미지 파일이 존재하는지 확인
        if os.path.exists(image_path):
            return FileResponse(image_path, media_type="image/jpeg")
        else:
            return {"error": "File not found"}
    except Exception as e:
        print(f"Error in API call: {e}")
        return None


@app.post("/glim/generate_image1/")
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
        # DALL-E 모델을 호출하여 이미지 생성
        response = openai_client.images.generate(
            model="dall-e-3",
            prompt=image_prompt,
            n=1,
            size="1024x1024"
        )
        # 다운로드할 이미지의 URL 추출
        image_url = response.data[0].url
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

@app.post("/glim/convert-to-cartoon/")
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

@app.post("/glim/convert-to-sketch/")
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


@app.post("/glim/vision")
async def process_image(picture: UploadFile = File(...)):
    print("vision 진입")
    contents = await picture.read()

    image = vision_v1.types.Image(content=contents)

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



if __name__ == "__main__":
    uvicorn.run(
        app,
        host="localhost",
        port=8000
    )
