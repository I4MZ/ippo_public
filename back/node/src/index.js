"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const https_1 = __importDefault(require("https"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const midjourney_1 = require("midjourney");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const cors_1 = __importDefault(require("cors"));
//npm run build
//npm run start
//Server running on port 3001
dotenv_1.default.config();
// AWS S3 정보
const s3 = new aws_sdk_1.default.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
const upload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            cb(null, "src/uploads/");
        },
        filename: (req, file, cb) => {
            // 현재 미드저니에서 외부 png 링크를 인식하지 못하는 유명한 문제가 있는 듯 함
            // 그렇기에 파일 확장자를 추출하여 .jpg로 변경
            const ext = path_1.default.extname(file.originalname);
            cb(null, `childImg-${Date.now()}${ext}`);
        },
    }),
});
const app = (0, express_1.default)();
// 모든 출처에서의 요청을 허용
app.use((0, cors_1.default)());
const PORT = parseInt(process.env.PORT, 10) || 3001;
// 이미지를 다운로드하고 Buffer로 반환하는 함수
const downloadImage = (url) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        https_1.default
            .get(url, (res) => {
            const data = [];
            res.on("data", (chunk) => data.push(chunk));
            res.on("end", () => resolve(Buffer.concat(data)));
        })
            .on("error", (err) => reject(err));
    });
});
// S3에 이미지를 업로드하고 URL을 반환하는 함수
const uploadImageToS3 = (imageBuffer, bucketName, contentType = "image/jpeg") => __awaiter(void 0, void 0, void 0, function* () {
    const fileName = `resultImg-${Date.now()}.jpg`;
    const params = {
        Bucket: bucketName,
        Key: fileName,
        Body: imageBuffer,
        ACL: "public-read",
        ContentType: contentType,
    };
    yield s3.upload(params).promise();
    return `https://${bucketName}.s3.amazonaws.com/${encodeURIComponent(fileName)}`;
});
// S3에 파일 업로드하고 URL 반환하는 함수
const uploadFileAndGetUrl = (filePath, bucketName) => {
    return new Promise((resolve, reject) => {
        const fileContent = fs_1.default.readFileSync(filePath);
        const fileName = path_1.default.basename(filePath);
        const mimeType = "image/jpeg"; // 이 부분은 실제 파일 유형에 따라 달라질 수 있습니다.
        const params = {
            Bucket: bucketName,
            Key: fileName,
            Body: fileContent,
            ACL: "public-read", // 공개 읽기 권한으로 설정
            ContentType: mimeType, // MIME 타입 설정
        };
        s3.upload(params, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                const fileUrl = `https://${bucketName}.s3.amazonaws.com/${encodeURIComponent(fileName)}`;
                resolve(fileUrl);
            }
        });
    });
};
// Midjourney 작업 처리 함수
function processMidjourney(client, prompt) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const imagine = yield client.Imagine(prompt, (uri, progress) => {
            console.log("loading", uri, "progress", progress);
        });
        if (!imagine) {
            console.log("no message");
            return undefined;
        }
        const u1CustomID = (_b = (_a = imagine.options) === null || _a === void 0 ? void 0 : _a.find((o) => o.label === "U1")) === null || _b === void 0 ? void 0 : _b.custom;
        if (!u1CustomID) {
            console.log("no U1");
            return undefined;
        }
        const upscale = yield client.Custom({
            msgId: imagine.id,
            flags: imagine.flags,
            customId: u1CustomID,
            loading: (uri, progress) => {
                console.log("loading", uri, "progress", progress);
            },
        });
        /* 이미지 생성한 uri */
        console.log(upscale === null || upscale === void 0 ? void 0 : upscale.uri);
        return upscale === null || upscale === void 0 ? void 0 : upscale.uri;
    });
}
// 이미지 생성 및 업로드 처리 API
app.post("/node/doduk/generateImage", upload.single("image"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const storySummary = req.body.storySummary;
        const childImgFile = req.file ? req.file.path : null;
        //const childImgFile = req.file?.path; // multer에 의해 저장된 파일 정보
        if (!childImgFile) {
            return res
                .status(400)
                .send({ message: "이미지가 업로드되지 않았습니다." });
        }
        // S3 버킷 이름 설정 나중에 env에 넣기
        const bucketName = "tuktakbucket";
        // 파일을 S3에 업로드하고 URL을 가져옴
        const childImgUrl = yield uploadFileAndGetUrl(childImgFile, bucketName);
        console.log(childImgUrl);
        // Midjourney 클라이언트 초기화
        const client = new midjourney_1.Midjourney({
            ServerId: process.env.SERVER_ID,
            ChannelId: process.env.CHANNEL_ID,
            SalaiToken: process.env.SALAI_TOKEN,
            Debug: true,
            Ws: true,
        });
        yield client.init();
        //동화 내용을 요약한 커맨드
        const prompt1 = storySummary +
            ", light-hearted adventurous mood, dynamic atmosphere, --ar 2:3";
        //합성 전 토대가 될 일러스트 삽화를 생성
        const imageUrl1 = yield processMidjourney(client, prompt1);
        //업로드 받은 아이의 얼굴과, 생성된 일러스트 삽화를 동화 내용에 맞추어 합성
        const prompt2 = imageUrl1 +
            " " +
            childImgUrl +
            " is protagonist and children. " +
            storySummary +
            ", light-hearted adventurous mood, dynamic atmosphere, --ar 2:3";
        const imageUrl2 = yield processMidjourney(client, prompt2);
        // imageUrl2가 유효한지 확인하고 다운로드 및 S3에 업로드를 진행
        if (imageUrl2) {
            const imageBuffer = yield downloadImage(imageUrl2);
            const resultImgUrl = yield uploadImageToS3(imageBuffer, bucketName);
            console.log("이미지 결과물을 확인합니다. : " + resultImgUrl);
            res.json({
                message: "이미지 생성 및 S3 업로드 완료",
                imageUrl: resultImgUrl,
            });
        }
        else {
            // imageUrl2가 undefined인 경우, 오류 메시지를 반환
            res.status(500).send({ message: "이미지 생성에 실패했습니다." });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ message: "서버 오류 발생" });
    }
}));
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
