from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware
import requests
from io import BytesIO
import re
import json
import uvicorn
import tempfile

app = FastAPI()

# CORS 설정
origins = [ "*" ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration for OpenAI and API Key
from openai import OpenAI
# from api_key import API_KEY
from openai import AsyncOpenAI
from typing import AsyncGenerator, NoReturn
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
import os
# 환경변수에서 OpenAI API 키를 가져옵니다.
API_KEY = os.environ.get('OPENAI_API_KEY')

# API 키가 설정되지 않았다면 오류 메시지를 출력합니다.
if not API_KEY:
    raise ValueError("환경변수 'OPENAI_API_KEY'가 설정되지 않았습니다.")
client = OpenAI(api_key=API_KEY)

class GPTRequest(BaseModel):
    messages: list

async_client = AsyncOpenAI(api_key=API_KEY)

@app.websocket("/tuktak/ws")
async def websocket_endpoint(websocket: WebSocket) -> NoReturn:
    """
    Websocket for AI responses
    """
    await websocket.accept()
    try:
        while True:
             # 클라이언트로부터 사용자 입력 수신
            user_input = await websocket.receive_text()

            # 공감적인 응답 생성을 위한 프롬프트 설정
            empathetic_prompt = (
                f"Generate a kind and empathetic response to the user's input: '{user_input}'. "
                f"Use short sentences and easy words suitable for children."
                f"질문형태로 답변을 하지 마세요"
                f"Please answer in Korean."
                "간략하고 짧은 문장으로 공감을 해주세요"
            )
             # GPT 모델 호출을 위한 요청 데이터 준비
            request_data = GPTRequest(messages=[
                {'role': 'user', 'content': user_input},
                {'role': 'system', 'content': empathetic_prompt}
            ])

            # GPT 모델을 호출하여 스트리밍 응답 생성
            async for response in get_gpt_response(request_data):
                # 클라이언트에 각 응답 조각 전송
                await websocket.send_text(response)

            # 스트리밍 응답이 끝났음을 클라이언트에 알림
            await websocket.send_json({"end_of_stream": True})

    except WebSocketDisconnect:
        print("Client disconnected")

# gpt-3.5-turbo-1106
# gpt-4-1106-preview
async def get_gpt_response(request: GPTRequest) -> AsyncGenerator[str, None]:
    try:
        response = await async_client.chat.completions.create(
            model='gpt-4-1106-preview',
            top_p=0.1,
            temperature=0.7,
            messages=request.messages,
            stream=True,
        )
        # 모델로부터 스트리밍 응답 처리
        all_content = ""
        async for chunk in response:
            content = chunk.choices[0].delta.content
            if content:
                # all_content += content
                # yield all_content
                yield content.replace("\n", "")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Pydantic 모델을 사용하여 요청 데이터 구조 정의
class TuktakTaleRequest(BaseModel):
    chapter: int
    topic: str
    user_input: str
    full_story: list
    conclusion: bool = False

def extract_parts(text):
    # 챕터 제목 추출
    chapter_title_match = re.search(r"### Chapter \d+ - (.+?)###", text)
    chapter_title = chapter_title_match.group(1).strip() if chapter_title_match else ""

    # 챕터 내용 추출
    chapter_content_match = re.search(r"### Chapter Content:(.+?)### Choices:", text, re.DOTALL)
    chapter_content = chapter_content_match.group(1).strip() if chapter_content_match else ""

    # 선택지 추출
    choices_match = re.search(r"### Choices:(.+?)### Interpretations:", text, re.DOTALL)
    choices_text = choices_match.group(1).strip() if choices_match else ""
    choices = re.findall(r"(\d\..+?)(?=\d\.|$)", choices_text)

    # 해석 내용 추출
    interpretations_match = re.search(r"### Interpretations:(.+)", text, re.DOTALL)
    interpretations_text = interpretations_match.group(1).strip() if interpretations_match else ""
    interpretations = re.findall(r"(\d\..+?)(?=\d\.|$)", interpretations_text)

    return chapter_title, chapter_content, choices, interpretations

@app.websocket("/tuktak/tuktak_tale/ws")
async def websocket_tale_endpoint(websocket: WebSocket) -> NoReturn:
    await websocket.accept()
    try:
        while True:
            tale_request_json = await websocket.receive_text()
            tale_request = TuktakTaleRequest(**json.loads(tale_request_json))

            # 챕터 종류 확인 (결말인지 여부)
            chapter_type = 'Conclusion' if tale_request.conclusion else f'Chapter {tale_request.chapter}'

            if len(tale_request.full_story) > 1:
                last_chapter_content = tale_request.full_story[-2]  # 마지막에서 두 번째 요소 (가장 최근의 챕터 내용)
                last_chapter_choice = tale_request.full_story[-1]

            # 시스템 메시지 생성
            if not tale_request.conclusion:
                system_message = (
                    "당신은 전문적인 어린이 동화작가 입니다. "
                    "4-7세 아동을 위해 간단한 단어를 사용해 매력적인 인터랙티브 동화 챕터를 만듭니다. "
                    "동화를 구성하는 문장들이 가독성을 높일 수 있도록 부드럽게 이어지고 부드러운 어투를 사용해주세요. "
                    "동화의 각 챕터는 주요 사건을 포함해야 하며, 이 사건은 스토리의 전개에 중요한 전환점을 제공해야 합니다. "
                    "주요 사건은 사용자에게 의미 있는 선택지를 제시해야 하며, 이 선택지는 스토리의 방향과 캐릭터의 행동에 영향을 미쳐야 합니다. "
                    "사용자의 선택은 스토리의 향후 방향과 결과에 직접적인 영향을 미치며, 각 선택지는 스토리의 주제와 일관성을 유지해야 합니다. "
                    f"챕터 제목은 항상 ### {chapter_type} - Chapter Title 형식으로 시작하게 하세요. "
                    f"챕터 제목은 '{tale_request.topic}'과 동화 내용을 참고해서 내용에 알맞는 창의적인 제목을 짧게 지어주세요. "  # 챕터 제목
                    "동화의 내용은 항상 ### Chapter Content: 형식으로 시작하세요. "
                    f"이 챕터의 주제는 '{tale_request.topic}'입니다. 이 주제를 바탕으로 스토리를 전개하세요. "
                    "선택지는 항상 ### Choices: 형식으로 시작하고, 동화의 내용과 연관된 두 가지 명확한 선택지를 제공하세요. "
                    "선택지는 아동의 성향이나 심리를 반영할 수 있도록 구성해야 합니다. "
                    "해석은 항상 ### Interpretations: 형식으로 시작하며, 각 선택지에 대한 자세하고 명확한 해석을 포함하고 앞에 번호를 붙여주세요 "
                    "챕터의 구성은 제목, 내용, 선택지, 선택지의 해석 이렇게 4가지 파트로 구성됩니다."
                    "먼저 이전 챕터의 주요 사건을 간단히 요약하고, 사용자의 선택이 미치는 영향을 통해 스토리를 자연스럽게 이어가세요. "
                    "캐릭터들은 사용자의 선택에 반응하며, 스토리는 이전 챕터와 일관성을 유지하면서 전개됩니다. "
                    "스토리는 감정적으로 연결되고, 각 챕터는 전체적인 스토리 아크를 따릅니다. "
                    "동화의 내용은 반드시 8문장 이하로 구성되어야하며, 한국어로 작성합니다. "
                )
                if len(tale_request.full_story) > 1:
                    system_message += (
                        f"이전 챕터의 내용: '{last_chapter_content}' "
                        f"이전 챕터의 선택: '{last_chapter_choice}' "
                        "이 내용을 바탕으로 새 챕터를 시작하세요. "
                    )

            else:
                system_message = (
                    "당신은 전문적인 어린이 동화작가입니다. "
                    "이제 동화의 결말을 작성할 시간입니다. "
                    "결말은 동화의 주제와 사용자의 선택을 반영하여 만들어야 합니다. "
                    "결말의 제목은 반드시 ### Chapter - Chapter Title 형식으로 시작합니다. "
                    "결말의 내용은 ### Chapter Content: 형식으로 시작하고, "
                    f"'{tale_request.full_story}'의 내용에 토대로 5문장으로 마무리를 작성합니다 "
                    "동화의 결말은 감동적이고 교훈적인 메시지를 전달해야 합니다. "
                    "결말의 길이는 항상 6문장 이하로 구성하고, 한국어로 작성합니다. "
                )



            # 동화 생성 요청 처리
            full_response = ""  # 전체 응답을 저장할 변수
            last_sent_position = 0  # 마지막으로 전송된 내용의 위치를 추적하는 변수

            async for chunk in get_gpt_response(GPTRequest(messages=[
                {'role': 'system', 'content': system_message}
            ])):
                full_response += chunk  # 각 조각을 전체 응답에 추가

                # "### Chapter Content:"와 "### Choices:" 사이의 텍스트를 일치시키되, "### Choices:"는 제외하는 정규 표현식 패턴을 정의합니다.
                pattern = r"### Chapter Content:(.*?)(?=### Choices:)"

                # 전체 응답에서 패턴을 검색합니다.
                match = re.search(pattern, full_response, re.DOTALL)

                if match:
                    # 마커 사이의 내용을 추출합니다.
                    new_content = match.group(1).strip()

                    # 새로운 내용의 시작과 끝 인덱스를 계산합니다.
                    start = match.start(1)
                    end = match.end(1)

                    # 아직 전송되지 않은 새로운 내용을 스트리밍합니다.
                    if last_sent_position < end:
                        await websocket.send_json({"message": new_content[last_sent_position - start:]})
                        last_sent_position = end  # 마지막 전송 위치를 업데이트합니다.

                # "### Chapter Content:"는 발견되었지만 "### Choices:"는 발견되지 않은 경우
                elif "### Chapter Content:" in full_response:
                    start = full_response.find("### Chapter Content:") + len("### Chapter Content:")
                    new_content = full_response[start:].strip()
                    new_content = new_content.replace("###", "").replace("Choices", "")

                    # 아직 전송되지 않은 새로운 내용을 스트리밍합니다.
                    if last_sent_position < len(full_response):
                        await websocket.send_json({"message": new_content[last_sent_position - start:]})
                        last_sent_position = len(full_response)  # 마지막 전송 위치를 업데이트합니다.

            # 전체 응답을 사용하여 챕터 제목과 내용 추출
            chapter_title, chapter_content, choices, interpretations = extract_parts(full_response)

            # 선택지와 해석본을 포함하는 데이터 전송
            await websocket.send_json({
                "end_of_stream": True,
                "chapter_title": chapter_title,
                "chapter_content": chapter_content,
                "options": choices,
                "interpretations": interpretations
            })

    except WebSocketDisconnect:
        print("Client disconnected")

class UserResponses(BaseModel):
    responses: List[str]  # List of user's responses

@app.post("/tuktak/user_responses", response_model=List[str])
async def process_user_responses(request: UserResponses):
    empathetic_replies = []
    try:
        for user_response in request.responses:
            # Generate an empathetic prompt for the GPT model
            empathetic_prompt = (
                f"Generate a kind and empathetic response to the user's input: '{user_response}'. "
                f"Use short sentences and easy words suitable for children."
                f"Do not provide answers in the form of questions."
                f"Please answer in Korean."
            )

            # Call the GPT model
            gpt_response = await get_gpt_response(GPTRequest(messages=[
                {'role': 'user', 'content': user_response},
                {'role': 'system', 'content': empathetic_prompt}
            ]))

            # Append the GPT-generated response
            empathetic_replies.append(gpt_response)

        return empathetic_replies
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ImageGenerationRequest(BaseModel):
    chapter_content: str
    image_style_keywords: str
    previous_chapters: List[str]

class ImageGenerationResponse(BaseModel):
    image_path: str

# 이미지 생성 함수
def generate_image(chapter_content, image_style_keywords, previous_chapters):
    shortened_content = chapter_content[:3000]  # 이미지 생성을 위한 챕터 내용을 줄임

    # 이미지 스타일 키워드 설정
    visual_style_prompt = "Please create an image with bright, colorful visuals, great characters, and a pleasant atmosphere."

    # 시각적 스토리텔링 프롬프트 구성
    visual_storytelling_prompt = (
        "Create a single image that captures the essence of the scene described, focusing on visual storytelling elements. "
        "The image should convey the emotions and situations of the scene through visuals only, without any text. "
        "Maintain consistency with the style of previous chapters, aligning with the overall theme and atmosphere of the story."
    )

    # 이미지 생성을 위한 프롬프트 구성
    image_prompt = (
        f"{visual_storytelling_prompt} "
        "This image is for an interactive fairy tale for ages 4 to 7. "
        "The scene described is: " + shortened_content +
        " The image must follow this visual style: " + visual_style_prompt +
        " Previous chapters' content and images: " + ', '.join(previous_chapters) +
        " Please ensure the image is free of any text or characters."
    )

    try:
        # DALL-E 모델을 호출하여 이미지 생성
        response = client.images.generate(
            model="dall-e-3",
            prompt=image_prompt,
            n=1,
            size="1024x1024"
        )
        # S3에 업로드 할 이미지의 URL 추출
        image_url = response.data[0].url

        return image_url
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"API 호출 중 오류 발생: {e}")

# FastAPI endpoint for generating and downloading an image
@app.post("/tuktak/generate_image")
async def generate_image_endpoint(request: ImageGenerationRequest):
    try:
        image_response = generate_image(
            request.chapter_content,
            request.image_style_keywords,
            request.previous_chapters
        )

        # 이미지 데이터 다운로드
        response = requests.get(image_response)
        response.raise_for_status()

        # 스프링 부트 엔드포인트로 이미지 데이터 전송
        files = {'file': ('filename.jpg', BytesIO(response.content), 'image/jpeg')}
        spring_boot_url = 'ippo.live:8080/upload'
        spring_boot_response = requests.post(spring_boot_url, files=files)
        spring_boot_response.raise_for_status()

        # S3 URL 반환
        s3_image_url = spring_boot_response.text
        return {"image_url": s3_image_url}

    except requests.HTTPError as http_err:
        print(f'HTTP error occurred: {http_err}')
        raise HTTPException(status_code=500, detail=str(http_err))
    except Exception as e:
        print(f'Other error occurred: {e}')
        raise HTTPException(status_code=500, detail=str(e))

class ImageGenerationRequest(BaseModel):
    chapter_content: str
    image_style_keywords: str
    previous_chapters: List[str]

class InterpretationRequest(BaseModel):
     full_interpretations: List[str]

@app.post("/tuktak/analyze_intepretation")
async def analyze_intepretation_endpoint(request: InterpretationRequest):
    try:
        # 합쳐진 해석을 생성하기 위한 프롬프트
        interpretation_prompt = (
            f"{request.full_interpretations}의 내용은 어린아이가 인터랙티브 동화를 플레이하며 선택한 선택지들의 해석내용입니다. "
            "해석내용들을 보고 이 아이의 심리나 성향을 분석해서 간략하게 종합적인 평가만 내려주세요"
        )

        # OpenAI의 GPT-3 API를 사용하여 해석 생성
        response = await async_client.chat.completions.create(
            model='gpt-4-1106-preview',
            top_p=0.1,
            temperature=0.5,
            messages=[
                {"role": "system", "content": "당신은 아동심리학 전문가입니다."},
                {"role": "user", "content": interpretation_prompt}
            ],
        )

        overall_interpretation = response.choices[0].message.content

        return {"overallInterpretation": overall_interpretation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tuktak/record")
async def record(audio: UploadFile = File(...)):
    contents = await audio.read()  # 파일 데이터를 읽음

    # 임시 파일 생성
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
        temp_file.write(contents)
        temp_file_path = temp_file.name

    # Whisper 모델에 적용
    with open(temp_file_path, 'rb') as file_to_send:
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=file_to_send
        )

    # 결과 반환
    return {"transcript": transcript}

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="localhost",
        port=8002
    )