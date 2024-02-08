from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
import os
from dotenv import load_dotenv
load_dotenv()
# 환경변수에서 OpenAI API 키를 가져옵니다.
API_KEY = os.environ.get('OPENAI_API_KEY')

# API 키가 설정되지 않았다면 오류 메시지를 출력합니다.
if not API_KEY:
    raise ValueError("환경변수 'OPENAI_API_KEY'가 설정되지 않았습니다.")
import requests
import os
import time
import uvicorn
# conda activate fastapi
# uvicorn dodukAPI:app --reload
client = OpenAI(api_key=API_KEY)
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


#동화 GPT API 호출시 필수로 들어와야 하는 값 정의
class StoryRequest(BaseModel):
    previous_story: str = None
    # = None은 안들어와 있어도 상관 없다는 뜻임
    place: str
    firstWord: str
    secondWord: str
    thirdWord: str

#GPT 호출 메서드
def ask_to_get(prompt):
    response = client.chat.completions.create(
        model='gpt-4-1106-preview',
        top_p=0.1,
        temperature=0.3,
        messages=[{'role' : 'system', 'content': prompt}]
    )
    return response.choices[0].message.content

# #GPT 프롬프트 메서드
# def create_story_background(place):
#     if place == '바다':
#         return '동화의 배경이 바다일 경우 해양 오염에 대한 동화를 써주세요.'
#     elif place == '숲':
#         return '동화의 배경이 숲일 경우 생태계 균형 파괴에 대한 동화를 써주세요.'
#     elif place == '도시':
#         return '동화의 배경이 도시일 경우 전염병에 대한 동화를 써주세요.'


# 첫번째 스토리 생성 프롬프트 ---------------------------------------------
@app.post("/doduk/introStory")
async def create_intro_story(request: StoryRequest):
    print("도덕 첫째 진입");
    intro_prompt = f"""
        당신은 전문적인 어린이 동화작가 입니다.
        4-7세 아동을 위해 간단한 단어를 사용해 매력적인 인터랙티브 동화를 만듭니다.
        동화를 구성하는 문장들이 가독성을 높일 수 있도록 부드럽게 이어지고 부드러운 어투를 사용해주세요.
        동화의 주인공은 '우철'이라는 아동이고, 동화의 주제는 환경 오염입니다.
        동화의 배경은 {request.place}이며, 배경에 따라 동화의 전개가 달라집니다.
        {request.firstWord}, {request.secondWord}, {request.thirdWord}들이 동화의 이야기에 소재로 창의적으로 재미있게 반영해 주세요.
        이야기 중 시작, 중간, 끝이 있다면 지금은 시작 부분입니다.
        그중에서도 {request.thirdWord}는 극 중 악당입니다. 악당이 주는 위협을 묘사해주세요.
        챕터의 내용은 반드시 10문장 이하로 구성합니다.
        """
    story = ask_to_get(intro_prompt)  # 첫 번째 스토리를 GPT API로부터 받아옴
    #

    # 첫 번째 스토리 요약 프롬프트
    summary_prompt = f"""
        '{story}'의 이야기를 기반으로 일러스트 삽화를 생성할 겁니다. 이 동화의 내용을 핵심적으로 가장 인상깊은 부분을 영어로 한줄 요약 하세요.
        """
    summary = ask_to_get(summary_prompt)  # 첫 번째 스토리 요약을 GPT API로부터 받아옴

    title_prompt = f"""
        당신은 전문적인 어린이 동화작가 입니다.
        '{story}'의 이야기를 기반으로 동화 제목을 생성해주세요.
        """
    title = ask_to_get(title_prompt)

    # 스토리와 요약을 JSON 형식으로 반환
    return {"story": story, "summary": summary, "title": title}
# 첫번째 스토리 생성 프롬프트 종료 ----------------------------------------

# 두번째 스토리 생성 프롬프트 ---------------------------------------------
@app.post("/doduk/secondStory")
async def create_intro_story(request: StoryRequest):
    # 두번째 스토리 생성 프롬프트
    intro_prompt = f"""
            당신은 전문적인 어린이 동화작가 입니다.
            4-7세 아동을 위해 간단한 단어를 사용해 매력적인 인터랙티브 동화를 만듭니다.
            동화를 구성하는 문장들이 가독성을 높일 수 있도록 부드럽게 이어지고 부드러운 어투를 사용해주세요.
            동화의 배경은 {request.place}이며, 배경에 따라 동화의 전개가 달라집니다.
            단, {request.previous_story} 까지가 이야기의 시작 부분이었습니다. 여기에서 이어지는 내용을 써주세요.
            {request.firstWord}, {request.secondWord}, {request.thirdWord}들이 동화의 이야기에 소재로 창의적으로 재미있게 반영해 주세요.
            이야기 중 시작, 중간, 끝이 있다면 지금은 중간 부분입니다.
            챕터의 내용은 반드시 10문장 이하로 구성합니다.
            마지막에는 분리수거의 필요성을 느꼈기 때문에 분리수거를 시작하는 장면을 넣으면서 서술을 끝내고, 이야기의 결말은 내지 말고 문장을 멈추세요.
        """
    story = ask_to_get(intro_prompt)  # 두번째 스토리를 GPT API로부터 받아옴

    # 두번째 스토리 요약 프롬프트
    summary_prompt = f"""
        '{story}'의 이야기를 기반으로 일러스트 삽화를 생성할 겁니다. 이 동화의 내용을 핵심적으로 가장 인상깊은 부분을 영어로 한줄 요약 하세요.
        """
    summary = ask_to_get(summary_prompt)  # 두번째 스토리 요약을 GPT API로부터 받아옴

    # 스토리와 요약을 JSON 형식으로 반환
    return {"story": story, "summary": summary}
# 두번째 스토리 생성 프롬프트 종료 ----------------------------------------


# 마지막 스토리 생성 프롬프트 ---------------------------------------------
@app.post("/doduk/endingStory")
async def create_intro_story(request: StoryRequest):
    # 마지막 스토리 생성 프롬프트
    intro_prompt = f"""
            당신은 전문적인 어린이 동화작가 입니다.
            4-7세 아동을 위해 간단한 단어를 사용해 매력적인 인터랙티브 동화를 만듭니다.
            동화를 구성하는 문장들이 가독성을 높일 수 있도록 부드럽게 이어지고 부드러운 어투를 사용해주세요.
            이전에 {request.previous_story} 이야기에 이어지는 내용이자, 동화의 엔딩을 서술해주세요.
            그중에서도 {request.thirdWord}는 악당이에요. 악당이 주는 위협을 해결하는 과정을 넣어주세요.
            4세의 아동이 이해할 수 있을 단어를 사용하고, 글의 분량은 10문장을 초과하지 마세요.
        """
    story = ask_to_get(intro_prompt)  # 두번째 스토리를 GPT API로부터 받아옴

    # 마지막 스토리 요약 프롬프트
    summary_prompt = f"""
        '{story}'의 이야기를 기반으로 일러스트 삽화를 생성할 겁니다. 이 동화의 내용을 핵심적으로 가장 인상깊은 부분을 영어로 한줄 요약 하세요.
        """
    summary = ask_to_get(summary_prompt)  # 마지막 스토리 요약을 GPT API로부터 받아옴

    # 스토리와 요약을 JSON 형식으로 반환
    return {"story": story, "summary": summary}
# 마지막 스토리 생성 프롬프트 종료 ----------------------------------------


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="localhost",
        port=8000
    )

