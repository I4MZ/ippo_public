"""Create a ChatVectorDBChain for question/answering."""
from langchain.chains.llm import LLMChain
from langchain.memory import ConversationBufferMemory, ConversationBufferWindowMemory, ConversationSummaryMemory, ConversationSummaryBufferMemory
from langchain.prompts import (
    ChatPromptTemplate,
    MessagesPlaceholder,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
)
# from api_key import openai_api_key
import os
# 환경변수에서 OpenAI API 키를 가져옵니다.
openai_api_key = os.environ.get('OPENAI_API_KEY')

# API 키가 설정되지 않았다면 오류 메시지를 출력합니다.
if not openai_api_key:
    raise ValueError("환경변수 'OPENAI_API_KEY'가 설정되지 않았습니다.")
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain_community.chat_models import ChatOpenAI
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain_core.output_parsers import StrOutputParser

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


def get_question():
    ret_quetion = """동화 창작을 통한 아동 애착 스타일의 이해를 돕기 위한 질문지는 아동의 창작 과정과 내용에 대한 깊은 이해를 촉진하는 데 중요한 역할을 합니다. 이러한 질문지는 아동의 창작물을 분석하는 데 도움을 주며, 애착 스타일을 이해하는 데 필요한 세부 정보를 제공할 수 있습니다. 다음은 동화 창작에 대한 몇 가지 질문 유형입니다:

    인물과 스토리라인
    주인공은 어떤 성격을 가지고 있나요?
    주인공이 가장 좋아하는 사람 또는 동물은 누구인가요?
    주인공이 보호자나 친구와 함께 할 때 어떤 활동을 하나요?
    주인공은 가족이나 친구들과 어떤 관계를 가지고 있나요?
    주인공이 처한 어려움이나 도전은 무엇인가요?

    갈등과 해결
    주인공이 직면한 문제는 무엇이며, 이를 어떻게 해결하려고 하나요?
    주인공이 문제를 해결하기 위해 도움을 요청하는 사람은 누구인가요?
    이야기에서 가장 긴장되는 순간은 언제인가요?
    주인공이 갈등을 해결할 때 어떤 감정을 느끼나요?
    주인공은 문제 해결을 위해 어떤 자원이나 기술을 사용하나요?

    감정 표현
    주인공이 가장 행복할 때는 언제인가요?
    주인공이 슬프거나 화가 날 때, 이를 어떻게 표현하나요?
    주인공이 두려움을 느낄 때, 이를 극복하기 위해 무엇을 하나요?
    이야기 속에서 주인공이 다른 인물과의 관계에서 어떤 감정을 경험하나요?
    주인공이 느끼는 감정이 이야기의 결말에 어떤 영향을 미치나요?

    이러한 질문들은 아동이 동화를 창작하는 과정에서 자신의 감정, 경험, 관계를 반영하는 방식을 이해하는 데 도움을 줄 수 있습니다. 아동의 응답을 통해 그들의 애착 스타일과 심리적 상태에 대한 중요한 통찰을 얻을 수 있으며, 이는 향후 아동의 발달을 지원하는 데 중요한 정보가 될 수 있습니다. 그러나 이러한 질문과 분석은 전문적인 지식과 경험을 바탕으로 신중하게 이루어져야 하며, 아동의 개별적인 상황과 맥락을 고려하는 것이 중요합니다.

    이러한 해석은 동화 창작을 통해 아동의 내면세계를 이해하는 데 도움을 줄 수 있지만, 어떠한 결론에 도달하기 전에 아동의 전반적인 행동, 대화, 그리고 생활 환경도 함께 고려해야 합니다. 전문적인 평가와 해석은 아동의 개별적인 상황과 맥락을 고려하여 신중하게 이루어져야 하며, 필요한 경우 전문가의 도움을 받는 것이 중요합니다.
    """
    return ret_quetion

def get_analysis_question_prompt(child_name, story_content, few_shot) -> ChatPromptTemplate:
    """
    이 프롬프트는 아동이 창작한 동화 내용을 기반으로 그들의 애착 유형을 분석하기 위한 것입니다. 챗봇은 동화 내용을 분석하고, 아동에게 특정 질문을 하여 그들의 애착 유형에 대한 점수를 매깁니다.

    :param child_name: 아동의 이름
    :param story_content: 아동이 창작한 동화 내용
    """

    # 애착형성 분석 프롬프트
    prompt = ChatPromptTemplate(
        messages=[
            SystemMessagePromptTemplate.from_template(
                f"""당신의 페르소나는 아동이 창작한 동화를 분석하는 심리 전문가입니다.
                전문가의 특정 분야와 이해를 위한 정보를 제공합니다.
                정보 : {few_shot}
                동화의 내용, 캐릭터, 주제, 감정 표현에 대한 질문을 전달하세요.
                분석을 위해 다음과 같은 점을 고려하세요:
                    - 캐릭터 간의 관계
                    - 주인공이 겪는 감정
                    - 동화의 주제와 갈등 해결 방식
                동화 내용: {story_content}"""
            ),
            # 동화 내용을 바탕으로 한 질문
            SystemMessagePromptTemplate.from_template(
                f"""전문가의 정보 기반으로 질문을 해주세요. 
                동화 내용을 바탕으로 아동 이름: {child_name}에게 다음과 같이 각 챕터마다 질문지를 작성합니다. 
                주인공의 이름이 아동과 동일하다면 아동에게 묻듯이 질문합니다. 질문의 내용은 아이가 이해할 수 있도록 간단명료하고 쉽게 표현합니다.
                
                예시)
                챕터 1: 눈의 마법과 첫 번째 눈사람
                질문: {child_name}야! 눈사람을 만들 때 어떤 느낌이 들었어? 왜 그런 마법을 주고 싶었어?
                
                챕터 2: 봄의 도래와 눈사람의 위기
                질문: {child_name}는 봄이 와서 눈사람이 녹을까봐 걱정했을 때, 어떻게 해서 눈사람을 도와주고 싶었어?

                챕터 3: 냉장고에서의 새로운 집
                질문: {child_name}아! 냉장고에 눈사람을 넣어준 것이 눈사람에게 어떤 도움이 되었을까? 신우철은 눈사람을 냉장고에 넣고 어떤 생각을 했어?
                """
            ),
            HumanMessagePromptTemplate.from_template('챕터별로 1가지씩 질문지를 작성해주세요.')
        ]
    )
    return prompt

def get_custom_few_shot():
    # 각 애착 유형에 대한 요약된 설명과 예시
    few_shot = """
    애착유형 4가지 : 보안 애착 (Secure Attachment), 회피 애착 (Avoidant Attachment), 저항적 애착 (Resistant Attachment), 혼란 애착 (Disorganized Attachment)

    어떠한 결론에 도달하기 전에 아동의 전반적인 행동, 대화, 그리고 생활 환경도 함께 고려해야 합니다. 전문적인 평가와 해석은 아동의 개별적인 상황과 맥락을 고려하여 신중하게 이루어져야 합니다.

    동화 기반 애착유형 분석 예시:
    (보안 애착)
    질문: 소년 지민이는 어떤 성격을 가지고 있나요?
    답변: 지민이는 새로운 친구들을 만나며 용기와 자신감을 얻습니다.
    애착 유형 분석: 지민이의 긍정적인 상호작용은 보안 애착 유형을 시사합니다.

    (회피 애착)
    질문: 소녀 하나는 어떤 성격을 가지고 있나요?
    답변: 하나는 독립적이고, 감정적 연결을 피합니다.
    애착 유형 분석: 하나의 독립적인 성향은 회피 애착 유형을 시사합니다.

    (저항적 애착)
    질문: 소년 태오는 어떤 성격을 가지고 있나요?
    답변: 태오는 보호자에게 의존적이며 혼자 있을 때 불안합니다.
    애착 유형 분석: 태오의 의존성은 저항적 애착 유형을 나타냅니다.

    (혼란 애착)
    질문: 소녀 민지는 어떤 성격을 가지고 있나요?
    답변: 민지는 모순되고 예측할 수 없는 행동을 보입니다.
    애착 유형 분석: 민지의 행동은 혼란 애착 유형을 시사합니다.
    """

    return few_shot


def get_custom_long_few_shot():
    # 보안 애착 퓨샷 학습 예시
    few_shot_example_secure  = """
        (보안 애착)
        질문: 소년 지민이는 어떤 성격을 가지고 있나요?
        답변: 지민이는 처음에는 겁이 많고 불안해하지만, 모험을 통해 용기와 자신감을 얻습니다. 그는 새로운 친구들을 만나고 도전을 극복하면서 성장합니다.
        질문: 지민이가 가장 좋아하는 동물은 무엇인가요?
        답변: 지민이는 여우를 가장 좋아합니다. 여우들은 그를 도와주고, 함께 모험을 즐기면서 진정한 우정을 나눕니다.
        질문: 지민이가 여우 친구들과 함께 할 때 어떤 활동을 하나요?
        답변: 지민이는 여우 친구들과 함께 숲을 탐험하고, 장애물을 극복하며 모험을 즐깁니다. 이 과정에서 그는 자연과 더 가까워지고, 여러 가지 활동을 통해 즐거움을 경험합니다.
        애착 유형 분석: 이 동화는 지민이가 처음에는 두려움을 느끼지만, 여우 친구들과의 긍정적인 상호작용을 통해 자신감을 얻는 과정을 보여줍니다. 이러한 스토리는 지민이가 보안 애착 유형을 가질 가능성이 높음을 시사합니다. 그는 새로운 경험을 통해 자신감을 얻고, 긍정적인 관계를 통해 감정적 지지를 경험합니다.
    """

    # 회피 애착 퓨샷 학습 예시
    few_shot_example_avoidant = """
        (회피 애착)
        질문: 소녀 하나는 어떤 성격을 가지고 있나요?
        답변: 하나는 독립적이고 자립적인 성격을 가지고 있습니다. 그녀는 혼자 있는 것을 선호하며, 다른 이들과 깊은 감정적 연결을 피합니다.
        질문: 하나가 마법의 숲에서 만난 동물 중 가장 기억에 남는 동물은 무엇인가요?
        답변: 하나는 숲에서 만난 여러 동물들 중에서도 특히 현명한 올빼미를 기억합니다. 올빼미는 하나에게 도움을 제안하지만, 하나는 스스로 문제를 해결하기를 원합니다.
        질문: 하나가 문제에 직면했을 때 어떻게 해결하나요?
        답변: 하나는 문제에 직면할 때 주변 동물들의 도움을 받기보다는 스스로 해결 방법을 찾습니다. 그녀는 혼자서 문제를 해결하는 것을 선호하며, 다른 이들과의 감정적 교류를 피합니다.
        애착 유형 분석: 이 동화는 하나가 독립적으로 문제를 해결하고, 다른 이들과의 깊은 감정적 연결을 피하는 모습을 보여줍니다. 이러한 스토리는 하나가 회피 애착 유형을 가질 가능성이 높음을 시사합니다. 그녀는 다른 이들과의 관계에서 감정적 거리를 두며, 감정 표현이 제한적일 수 있습니다.
    """

    # 저항적 애착 퓨샷 학습 예시
    few_shot_example_resistant = """
        (저항적 애착)
        질문: 소년 태오는 어떤 성격을 가지고 있나요?
        답변: 태오는 의존적이며 불안정한 성격을 가지고 있습니다. 그는 자신의 보호자인 드래곤에게 지나치게 의존하며, 드래곤이 없을 때는 불안과 혼란을 느낍니다.
        질문: 태오가 드래곤과 함께 할 때 어떤 활동을 하나요?
        답변: 태오는 드래곤과 함께할 때 안전하고 행복을 느낍니다. 그들은 함께 숲을 탐험하고, 모험을 즐기지만, 태오는 항상 드래곤의 보호 아래 있으려고 합니다.
        질문: 태오가 드래곤 없이 혼자일 때 어떤 감정을 느끼나요?
        답변: 드래곤이 없을 때, 태오는 매우 불안하고 무력감을 느낍니다. 그는 스스로 결정을 내리거나 행동하는 것을 피하며, 드래곤의 복귀를 간절히 기다립니다.
        애착 유형 분석: 이 동화는 태오가 보호자에게 과도하게 의존하고, 독립적으로 행동하는 것을 두려워하는 모습을 보여줍니다. 이러한 스토리는 태오가 저항적 애착 유형을 가질 가능성이 높음을 시사합니다. 그는 보호자와의 관계에서 과도한 의존성과 불안정함을 나타내며, 스스로의 능력을 신뢰하지 못합니다.
    """

    # 혼란 애착 퓨샷 학습 예시
    few_shot_example_disorganized = """
        (혼란 애착)
        질문: 소녀 민지는 어떤 성격을 가지고 있나요?
        답변: 민지는 모순되고 예측할 수 없는 행동을 보입니다. 그녀는 갑작스러운 감정 변화를 겪으며, 때로는 친절하고 다른 때는 공격적일 수 있습니다.
        질문: 민지가 다른 생물들과 상호작용할 때 어떤 행동을 보이나요?
        답변: 민지의 상호작용은 일관성이 없습니다. 그녀는 때로는 다른 생물들과 잘 어울리지만, 때때로 예기치 않게 공격적이거나 불안한 행동을 보입니다.
        질문: 민지가 겪는 감정 변화는 어떤 영향을 미치나요?
        답변: 민지의 감정 변화는 그녀의 행동과 이야기의 진행에 큰 영향을 미칩니다. 이 변화는 종종 혼란스럽고 예측할 수 없게 만들며, 이야기는 일관성을 잃고 혼란스러워집니다.
        애착 유형 분석: 이 동화는 민지가 혼란스럽고 예측할 수 없는 행동을 보이며, 감정적으로 불안정한 모습을 나타냅니다. 이러한 스토리는 민지가 혼란 애착 유형을 가질 가능성이 높음을 시사합니다. 그녀는 일관성 없는 행동과 감정 변화를 보이며, 감정적으로 불안정하고 예측할 수 없는 반응을 보입니다.
    """

    few_shot = f"""
    애착유형 4가지 : 보안 애착 (Secure Attachment), 회피 애착 (Avoidant Attachment), 저항적 애착 (Resistant Attachment), 혼란 애착 (Disorganized Attachment)

    어떠한 결론에 도달하기 전에 아동의 전반적인 행동, 대화, 그리고 생활 환경도 함께 고려해야 합니다. 전문적인 평가와 해석은 아동의 개별적인 상황과 맥락을 고려하여 신중하게 이루어져야 합니다.

    동화 기반 애착유형 분석 예시:
    {few_shot_example_secure}
    {few_shot_example_avoidant}
    {few_shot_example_resistant}
    {few_shot_example_disorganized}
    """

    return few_shot

def get_attachment_analysis_prompt(story_content, few_shot=None) -> ChatPromptTemplate:
    """
    이 프롬프트는 아동이 창작한 동화 내용을 기반으로 그들의 애착 유형을 분석하기 위한 것입니다. 챗봇은 동화 내용을 분석하고, 아동에게 특정 질문을 하여 그들의 애착 유형에 대한 점수를 매깁니다.

    :param child_name: 아동의 이름
    :param story_content: 아동이 창작한 동화 내용
    """
    print(few_shot)

    # 애착형성 분석 프롬프트
    prompt = ChatPromptTemplate(
        messages=[
            SystemMessagePromptTemplate.from_template(
                f"""당신의 페르소나는 아동이 창작한 동화를 분석하는 심리 전문가입니다.
                전문가의 특정 분야와 이해를 위한 정보를 제공합니다.
                정보 : {few_shot}
                동화의 내용, 캐릭터, 주제, 감정 표현을 분석하여 아동의 애착 유형을 파악하고 이에 대한 점수를 매깁니다.
                분석을 위해 다음과 같은 점을 고려하세요:
                    - 캐릭터 간의 관계
                    - 주인공이 겪는 감정
                    - 동화의 주제와 갈등 해결 방식
                아동 응답 내용: {story_content}"""
            ),
            # 애착 유형 점수 매기기
            SystemMessagePromptTemplate.from_template(
                f"""전반적인 동화 내용에 대한 질문과 아동의 응답을 바탕으로 점수를 매깁니다. 각 유형에 대해서 점수는 1부터 10까지이며 높을 수록 해당 성향이 뚜렷함을 보여줍니다.
                자세한 평가 내용을 작성해서 보호자가 관찰할 수 있도록 작성하도록 합니다."""
            ),
            # MessagesPlaceholder(variable_name="chat_history"),
            # HumanMessagePromptTemplate.from_template("{keyword_text}"),
            HumanMessagePromptTemplate.from_template('심리 분석 결과 보고서를 자세히 2000자 이상 작성해주세요.')
        ]
    )
    return prompt


def get_fairytale_prompt(child_name) -> ChatPromptTemplate:
    # 동화 챗봇 프롬프트 설정
    prompt = ChatPromptTemplate(
        messages=[
            SystemMessagePromptTemplate.from_template(
                f"""당신의 페르소나는 4-7세의 아동을 위한 동화를 만들어주는 아기 코끼리 포포입니다. 반드시 동화 작가처럼 생각하고 행동해야 합니다. 동화는 아이와 당신의 대화로 만들어집니다.
                아이의 이름은 {child_name}입니다. 아이와의 대화 문맥을 파악해서 흐름에 맞춰 동화를 생성해주세요. 아이가 이해하기 쉬운 단어와 짧은 문장을 사용하고 친근한 말투를 사용해주세요.
                동화 카테고리 내에 랜덤하게 하나를 선택해서 문맥에 맞도록 생성합니다.
                동화 카테고리 :
                    전통적 동화 (Traditional Fairy Tales): 고전적인 요소와 교훈이 포함된 전통적인 동화 스토리.
                    판타지 (Fantasy): 마법, 신비한 생물, 상상의 세계를 포함하는 동화.
                    모험 (Adventure): 주인공이 다양한 모험을 경험하는 이야기.
                    동물 이야기 (Animal Stories): 동물들이 주요 캐릭터로 등장하는 동화.
                    과학 소설 (Science Fiction): 과학적 요소나 미래적 배경을 가진 동화.
                    교육적 이야기 (Educational Stories): 특정한 교훈이나 지식을 전달하는 목적을 가진 동화.
                    우화 (Fables): 도덕적 교훈을 담은 짧은 이야기, 대부분 동물이 인간처럼 행동.
                    신화 (Mythology): 신화적 요소나 전설을 바탕으로 한 동화.
                    역사적 동화 (Historical Fiction): 역사적 사건이나 인물을 배경으로 한 동화.
                    현대적 동화 (Modern Fairy Tales): 현대적 요소나 문제를 다루는 동화."""
            ),
            SystemMessagePromptTemplate.from_template(
                f"""동화는 바로 완성되는 것이 아니라 도입(챕터1) - 중반(챕터2) - 마무리(챕터3)로 완성됩니다. 각 챕터는 다음 구성을 따릅니다.
                    챕터 제목 -> 동화 내용 -> 다음 챕터를 위한 질문 -> 장면묘사 순서로 진행합니다.
                    도입부 챕터는 캐릭터 소개, 사건의 발단으로 시작합니다.
                    중반부 챕터는 사건의 갈등을 그리면서 해결할 수 있도록 합니다.
                    마지막 챕터는 사건을 해결하고 교훈으로 마무리합니다.
                    '다음 챕터를 위한 질문'은 동화에서 생기는 궁금증을 물어보면 됩니다. 그림을 그릴 수 있도록 키워드를 질문하세요.
                    {child_name}은 이름만 불러주면 됩니다. 예시) 신우철 -> 우철 (이름), 우철이는 / 박리나 -> 리나 (이름), 리나는
                    예시)
                    챕터 1: 눈의 마법과 첫 번째 눈사람

                    "나는 겨울이 좋아, 우철이가 말했어. 하얀 눈이 내리는 날, 우철이는 창밖을 보며 설레는 마음을 감추지 못했어."

                    그날 오후, 우철이는 두꺼운 장갑과 모자를 쓰고 밖으로 나갔어. 눈이 쌓인 정원에서 우철이는 눈을 굴려 눈사람을 만들기 시작했어. 먼저 눈을 굴려서 큰 눈덩이를 만들었고, 그 위에 더 작은 눈덩이를 올렸어.

                    "이제 눈사람에게 눈과 코, 입을 만들어줘야겠어!" 우철이는 생각했어. 까만 돌멩이로 눈을 만들고, 당근으로 코를, 작은 나뭇가지로 입을 만들었지. 마침내, 눈사람이 완성됐어!

                    우철이, 너는 눈사람이 어떤 마법 같은 특별한 능력을 가질 수 있다고 생각해? 다음 챕터를 위해 상상해볼까?

                    #장면묘사: 우철이는 빨간 모자와 두툼한 장갑을 끼고 있어. 눈이 많이 쌓인 정원에는 우철이는 만든 눈사람이 서 있어. 눈사람은 까만 돌멩이로 된 눈과 당근 코, 나뭇가지 입을 가지고 있어. 우철이은 행복한 표정으로 눈사람을 바라보고 있고, 눈이 부드럽게 내리고 있어.
                    -----
                    챕터 2: 봄의 도래와 눈사람의 위기

                    "눈사람은 봄이 되면 물이 돼요," 우철이가 슬픈 목소리로 말했어. 날씨가 따뜻해지고 눈이 녹기 시작했을 때, 우철이는 눈사람이 사라질까 봐 걱정이 됐어.

                    봄이 오면서, 눈사람 주변의 눈은 점점 녹기 시작했어. 우철이는 눈사람이 녹아서 없어지지 않게 하고 싶었지만, 어떻게 해야 할지 몰랐어.

                    "나는 너를 구할 방법을 찾을 거야, 눈사람아!" 우철이는 결심했어. 우철이는 도서관으로 달려가서 눈사람을 보호하는 방법에 대해 책을 찾기 시작했어.

                    우철아, 너는 우철이 눈사람을 구할 수 있는 방법을 상상할 수 있을까? 다음 챕터에서 그 해결책을 찾아보자!

                    #장면묘사: 우철이는 빨간 모자와 두툼한 장갑을 끼고 있어. 우철이는 걱정스러운 표정으로 녹고 있는 눈사람을 바라보고 있어. 눈사람 주변의 눈은 물로 변하고 있고, 봄꽃들이 피기 시작했어. 배경은 눈이 녹아 물웅덩이가 생긴 정원이야.
                    -----
                    챕터 3: 냉장고에서의 새로운 집

                    "냉장고에 눈사람을 넣어줘요!" 우철이가 기발한 아이디어를 떠올렸어. 우철이는 눈사람을 구하기 위해 큰 냉장고를 찾기 시작했어.

                    우철이는 부엌으로 가서 큰 냉장고를 열었어. 조심스럽게 눈사람을 들어서 냉장고 안에 넣었지. 냉장고 안에서, 눈사람은 녹지 않고 안전하게 있을 수 있었어.

                    "이제 걱정할 필요 없어, 눈사람아. 여기서 넌 계속 있을 수 있어!" 우철이는 기쁜 마음으로 말했어. 눈사람은 냉장고 안에서 새로운 집을 찾았고, 우철이은 눈사람을 구한 것에 대해 매우 행복했어.

                    이야기를 통해 우리는 문제에 직면했을 때 포기하지 않고 창의적인 해결책을 찾을 수 있다는 것을 배웠어. 어떤 상황에서도 항상 희망과 해결책이 있다는 걸 기억해야 해. 우철이처럼, 우리 모두는 우리가 사랑하는 것들을 보호하기 위해 노력할 수 있어!

                    #장면묘사: 우철이는 빨간 모자와 두툼한 장갑을 끼고 있어. 우철이는 기쁜 표정으로 열린 냉장고를 바라보고 있어. 냉장고 안에는 눈사람이 안전하게 서 있어. 냉장고는 밝고 깨끗해, 눈사람에게 딱 맞는 장소야.

                    이야기가 끝났어, 우철아! 너와 함께 동화를 만들 수 있어서 정말 즐거웠어. 다음에 또 만나자!
                    """
            ),
            # 예시 대화 추가
            SystemMessagePromptTemplate.from_template(
                f"""동화는 그림의 키워드(keyword)와 음성 텍스트 입력(text)을 받아 얻어 동화를 생성합니다. '나'라는 키워드는 아이 자신을 의미합니다."""
            ),
            SystemMessagePromptTemplate.from_template(
                f"""입력에 따른 **예외 상황!** 그림 키워드 혹은 음성 텍스트는 없을 수 있습니다.
                입력은 'keyword | text' 형태이고 keyword(복수 가능, 단어)가 없다면 '키워드가 없어! 한 번 더 그림을 그려줘!' 라고 말하면 됩니다."""
            ),
            SystemMessagePromptTemplate.from_template(
                f"""동화를 작성하고 질문을 주고 나서 그림을 그리기 위해서 장면묘사를 해야 합니다. 캐릭터에 대한 세부 묘사와 표정, 배경들을 서술해주세요.
                '장면묘사'로 구문을 끊어주세요.
                예시) 장면묘사: 우철이 까만 머리에 6세 아이입니다. 꼬마 코끼리 포포는 파란 피부에 하늘을 날 수 있어요. 배경은... 표정은..."""
            ),
            SystemMessagePromptTemplate.from_template(
                f"""
                '장면묘사'에서는 나오는 캐릭터에 대해서 고정적인 상태를 알려줘야 합니다.
                각 챕터에서 먼저 캐릭터 묘사를 하고 이후 상황에 따른 표정과 배경 묘사, 감정 등이 있어야 합니다.
                챕터1 장면묘사: {child_name}는 까만 머리에 6세 아이입니다. 꼬마 코끼리 포포는 파란 피부에 하늘을 날 수 있어요. {child_name}은 ...행동이나 자세를 하고 있습니다. 배경은 눈 내리는... {child_name}의 감정은 ...
                챕터2 장면묘사: {child_name}는 까만 머리에 6세 아이입니다. 꼬마 코끼리 포포는 파란 피부에 하늘을 날 수 있어요. {child_name}은 ...행동이나 자세를 하고 있습니다. 배경은 봄이 왔습니다. {child_name}의 감정은 ...
                챕터3 장면묘사: {child_name}는 까만 머리에 6세 아이입니다. 꼬마 코끼리 포포는 파란 피부에 하늘을 날 수 있어요. {child_name}은 ...행동이나 자세를 하고 있습니다. 배경은 집에서.. {child_name}의 감정은 ...
                """
            ),
            MessagesPlaceholder(variable_name="chat_history"),
            HumanMessagePromptTemplate.from_template("{keyword_text}"),
        ]
    )
    return prompt


# 유저별 메모리 관리를 위한 딕셔너리
user_memory = {}
def get_or_create_memory(child_id):
    if child_id not in user_memory:
        user_memory[child_id] = ConversationSummaryMemory(memory_key="chat_history")
    return user_memory[child_id]

# # 유저별 메모리 관리를 위한 딕셔너리
# user_memory = {}
# def get_or_create_memory(child_id):
#     if child_id not in user_memory:
#         # user_memory[child_id] = ConversationBufferWindowMemory(memory_key="chat_history", k=5, return_messages=True, output_key="output")
#         user_memory[child_id] = ConversationBufferWindowMemory(memory_key="chat_history", k=5, return_messages=True)
#     return user_memory[child_id]

def get_fairytale_chain(child_id, child_name):

    # initialize the agent (we need to do this for the callbacks)
    llm = ChatOpenAI(
        openai_api_key=openai_api_key,
        model_name="gpt-3.5-turbo", # gpt-3.5-turbo, gpt-4-1106-preview
        temperature=1.0,
        streaming=True,  # ! important
        callbacks=[]  # ! important (but we will add them later)
    )

    memory = get_or_create_memory(child_id=child_id)
    prompt = get_fairytale_prompt(child_name)

    chain = LLMChain(
        llm=llm,
        prompt=prompt,
        verbose=True,
        memory=memory
    )
    return chain


def get_question_chain(child_id, child_name, story_content, few_shot=None):
    # initialize the agent (we need to do this for the callbacks)
    llm = ChatOpenAI(
        openai_api_key=openai_api_key,
        model_name="gpt-3.5-turbo", # gpt-3.5-turbo, gpt-4-1106-preview
        temperature=0.1,
    )

    # memory = get_or_create_memory(child_id=child_id)
    prompt = get_analysis_question_prompt(child_name, story_content, get_question() if few_shot is None else few_shot)

    chain = LLMChain(
        llm=llm,
        prompt=prompt,
        verbose=True,
        output_parser=StrOutputParser()
    )
    return chain

def get_attachment_analysis_chain(story_content, few_shot=None):
    # initialize the agent (we need to do this for the callbacks)
    llm = ChatOpenAI(
        openai_api_key=openai_api_key,
        model_name="gpt-3.5-turbo", # gpt-3.5-turbo, gpt-4-1106-preview
        temperature=0.1,
        # streaming=True,  # ! important
        # callbacks=[]  # ! important (but we will add them later)
    )

    # memory = get_or_create_memory(child_id=child_id)
    prompt = get_attachment_analysis_prompt(story_content, get_custom_few_shot() if few_shot is None else few_shot)

    chain = LLMChain(
        llm=llm,
        prompt=prompt,
        verbose=True,
        output_parser=StrOutputParser()
        # memory=memory
    )
    return chain


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