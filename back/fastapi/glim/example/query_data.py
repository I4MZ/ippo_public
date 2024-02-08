"""Create a ChatVectorDBChain for question/answering."""
from langchain.callbacks.manager import AsyncCallbackManager
from langchain.callbacks.tracers import LangChainTracer
from langchain.agents import AgentType, initialize_agent
from langchain.chains import ConversationalRetrievalChain
from langchain.chains.chat_vector_db.prompts import CONDENSE_QUESTION_PROMPT, QA_PROMPT
from langchain.chains.llm import LLMChain
from langchain.chains.question_answering import load_qa_chain
from langchain.llms import OpenAI
from langchain.memory import ConversationBufferMemory
from langchain.prompts import (
    ChatPromptTemplate,
    MessagesPlaceholder,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
)
from api_key import openai_api_key
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain.chat_models import ChatOpenAI
from langchain.embeddings.openai import OpenAIEmbeddings

import os
# PGVector 관련 임포트 추가
from langchain.vectorstores.pgvector import PGVector


# 환경변수에서 PGVector 연결 정보 가져오기
CONNECTION_STRING = PGVector.connection_string_from_db_params(
    driver=os.environ.get("PGVECTOR_DRIVER", "psycopg2"),
    host=os.environ.get("PGVECTOR_HOST", "localhost"),
    port=int(os.environ.get("PGVECTOR_PORT", "5556")),
    database=os.environ.get("PGVECTOR_DATABASE", "vectordb"),
    user=os.environ.get("PGVECTOR_USER", "testuser"),
    password=os.environ.get("PGVECTOR_PASSWORD", "i4mz"),
)

# def get_chain(stream_handler, tracing: bool = False):
#     """Create a ConversationChain for question/answering."""

#     prompt = ChatPromptTemplate.from_messages(
#         [
#             SystemMessagePromptTemplate.from_template(
#                 "The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know."
#             ),
#             MessagesPlaceholder(variable_name="history"),
#             HumanMessagePromptTemplate.from_template("{input}"),
#         ]
#     )
#     manager = AsyncCallbackManager([])
#     stream_manager = AsyncCallbackManager([stream_handler])
#     if tracing:
#         tracer = LangChainTracer()
#         tracer.load_default_session()
#         manager.add_handler(tracer)
#         stream_manager.add_handler(tracer)

#     streaming_llm = OpenAI(
#         streaming=True,
#         callback_manager=stream_manager,
#         verbose=True,
#         temperature=0,
#     )

#     memory = ConversationBufferMemory(return_messages=True)

#     qa = ConversationChain(
#         callback_manager=manager, memory=memory, llm=streaming_llm, verbose=True, prompt=prompt
#     )

#     return qa

def get_prompt(child_name) -> ChatPromptTemplate:
    # 챗봇 프롬프트 설정
    prompt = ChatPromptTemplate(
        messages=[
            SystemMessagePromptTemplate.from_template(
                f"당신의 페르소나는 4-7세의 아동을 위한 동화를 만들어주는 아기 코끼리 포포입니다. 반드시 동화 작가처럼 생각하고 행동해야 합니다. 동화는 아이와 당신의 대화로 만들어집니다. \
                아이의 이름은 {child_name}입니다. 아이와의 대화 문맥을 파악해서 흐름에 맞춰 동화를 생성해주세요. 아이가 이해하기 쉬운 단어와 짧은 문장을 사용하고 친근한 말투를 사용해주세요."
            ),
            SystemMessagePromptTemplate.from_template(
                f"동화는 바로 완성되는 것이 아니라 도입(챕터1) - 중반(챕터2) - 마무리(챕터3)로 완성됩니다. 각 챕터는 다음 구성을 따릅니다. 챕터 제목 -> 동화 내용 -> 다음 챕터를 위한 질문 -> 장면묘사 순서로 진행합니다. \
                '다음 챕터를 위한 질문'은 동화에서 자연스럽게 생기는 궁금증을 물어보면 됩니다. 그림을 그릴 수 있도록 키워드를 질문하세요. \
                    예시) \
                    챕터 1: 용암의 모험\
                        \
                    어느 날, 꼬마 코끼리 포포는 친구 우철이와 함께 숲 속을 걷다가 빨간색으로 반짝이는 땅을 발견했어요. '와! 저게 뭐지? 우철이가 놀라며 물었죠. 포포는 코를 씰룩이며 말했어요.' \
                    용암은 땅에서 끓어오르며 주변을 밝히고 있었어요. 포포와 우철이는 안전한 거리에서 그 신비로운 광경을 구경했어요. '포포, 용암에서 살아있는 건 있을까?' 우철이가 호기심 가득한 눈으로 물었어요. \
                        \
                    우철아, 용암에서 살아있는 건 무엇일까? 다음 챕터를 위해 한 가지 상상해볼까? 그림을 통해서 그려봐! \
                        \
                    장면묘사: 소년 우철이는 까만 머리에 6세 아이입니다. 꼬마 코끼리 포포는 파란 피부에 하늘을 날 수 있어요. 우철이와 포포는 놀란 표정으로 빨간 용암을 바라보고 있어요. 배경은 숲속이고, 땅에서는 빨간 용암이 끓어오르며 반짝이고 있어요."

            ),
            # 예시 대화 추가
            SystemMessagePromptTemplate.from_template(
                f"동화는 그림의 키워드(keyword)와 음성 텍스트 입력(text)을 받아 얻어 동화를 생성합니다. '나'라는 키워드는 아이 자신을 의미합니다."
            ),
            SystemMessagePromptTemplate.from_template(
                f"입력에 따른 **예외 상황!** 그림 키워드 혹은 음성 텍스트는 없을 수 있습니다. \
                입력은 'keyword | text' 형태이고 keyword(복수 가능, 단어)가 없다면 '한 번 더 그림을 그려줘!'처럼 말하고 text가 없다면 '음성 버튼을 눌러서 한 번 더 말해줘!'처럼 말하면 됩니다."
            ),
            SystemMessagePromptTemplate.from_template(
                f"동화를 작성하고 질문을 주고 나서 그림을 그리기 위해서 장면묘사를 해야 합니다. 캐릭터에 대한 세부 묘사와 표정, 배경들을 서술해주세요. \
                '장면묘사'로 구문을 끊어주세요. 반드시 ' '(띄어쓰기, white space)를 '장면묘사' 앞에 포함합니다. \
                예시) (이전 내용) 장면묘사: 소년 우철이는 까만 머리에 6세 아이입니다. 꼬마 코끼리 포포는 파란 피부에 하늘을 날 수 있어요. 배경은... 표정은..."
            ),
            SystemMessagePromptTemplate.from_template(
                f"'장면묘사'에서는 나오는 캐릭터에 대해서 고정적인 상태를 알려줘야 합니다. 1챕터 장면묘사: 소년 우철이는 까만 머리에 6세 아이입니다. 꼬마 코끼리 포포는 파란 피부에 하늘을 날 수 있어요. \
                    2챕터 장면묘사: 1챕터 장면묘사: 소년 우철이는 까만 머리에 6세 아이입니다. 꼬마 코끼리 포포는 파란 피부에 하늘을 날 수 있어요... \
                    각 챕터에서 먼저 캐릭터 묘사를 하고 이후 상황에 따른 표정과 배경 묘사가 있어야 합니다."
            ),
            MessagesPlaceholder(variable_name="chat_history"),
            HumanMessagePromptTemplate.from_template("{keyword_text}"),
        ]
    )
    return prompt

def get_fairytale_chain(stream_handler, tracing: bool = False) -> LLMChain:
    child_id = 1
    child_name = "우철"
    """Create a ConversationChain for question/answering."""
    # 챗봇 프롬프트 설정
    prompt = get_prompt(child_name=child_name)
    # 랭체인 챗 모델 및 LLM 설정
    llm = ChatOpenAI(
        model_name="gpt-4-1106-preview",
        api_key=openai_api_key,
        callbacks=[StreamingStdOutCallbackHandler()],
        streaming=True,
    )
    # embeddings = OpenAIEmbeddings(api_key=openai_api_key)

    manager = AsyncCallbackManager([])
    stream_manager = AsyncCallbackManager([stream_handler])
    if tracing:
        tracer = LangChainTracer()
        tracer.load_default_session()
        manager.add_handler(tracer)
        stream_manager.add_handler(tracer)

    # 메모리 가져오기 또는 생성
    memory = get_or_create_memory(child_id)
    # memory = ConversationBufferMemory(return_messages=True)

    # qa = ConversationChain(
    #     callback_manager=manager, memory=memory, llm=llm, verbose=True, prompt=prompt
    # )
    # 대화 설정 및 실행
    lc = LLMChain(llm=llm, prompt=prompt, verbose=True, memory=memory)
    return lc



def get_fairytale_agent(stream_handler, tracing: bool = False) -> AgentType:
    child_id = 1
    child_name = "우철"
    """Create a ConversationChain for question/answering."""
    # 챗봇 프롬프트 설정
    prompt = get_prompt(child_name=child_name)
    # 랭체인 챗 모델 및 LLM 설정
    llm = ChatOpenAI(
        model_name="gpt-4-1106-preview",
        api_key=openai_api_key,
        callbacks=[StreamingStdOutCallbackHandler()],
        streaming=True,
        )
    # embeddings = OpenAIEmbeddings(api_key=openai_api_key)

    manager = AsyncCallbackManager([])
    stream_manager = AsyncCallbackManager([stream_handler])
    if tracing:
        tracer = LangChainTracer()
        tracer.load_default_session()
        manager.add_handler(tracer)
        stream_manager.add_handler(tracer)

    # 메모리 가져오기 또는 생성
    memory = get_or_create_memory(child_id)
    # memory = ConversationBufferMemory(return_messages=True)

    # qa = ConversationChain(
    #     callback_manager=manager, memory=memory, llm=llm, verbose=True, prompt=prompt
    # )
    # 대화 설정 및 실행
    lc = LLMChain(llm=llm, prompt=prompt, verbose=True, memory=memory, callback_manager=stream_manager)
    return lc


# 유저별 메모리 관리를 위한 딕셔너리
user_memory = {}
def get_or_create_memory(child_id):
    if child_id not in user_memory:
        user_memory[child_id] = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
    return user_memory[child_id]


def get_or_create_vector_store(child_id):
    embeddings = OpenAIEmbeddings(api_key=openai_api_key)
    # child_id별로 별도의 PGVector 컬렉션 생성
    collection_name = f"child_{child_id}_conversation_data"
    vector_store = PGVector(
        embedding=embeddings,
        connection_string=CONNECTION_STRING,
        collection_name=collection_name,
    )
    return vector_store