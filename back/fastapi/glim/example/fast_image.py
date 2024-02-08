from fastapi import FastAPI, File, UploadFile
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import cv2 as cv
import numpy as np
from io import BytesIO

app = FastAPI()


origins = [ "*" ]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


if __name__ == '__main__':
    import uvicorn
    # 서버를 실행합니다.
    uvicorn.run(app, host="0.0.0.0", port=8000)
