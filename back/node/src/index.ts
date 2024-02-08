import express, { Express, Request, Response } from "express";
import https from "https";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import multer from "multer";
import { Midjourney } from "midjourney";
import AWS from "aws-sdk";
import cors from "cors";

//npm run build
//npm run start
//Server running on port 3001
dotenv.config();

// AWS S3 정보
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "src/uploads/");
    },
    filename: (req, file, cb) => {
      // 현재 미드저니에서 외부 png 링크를 인식하지 못하는 유명한 문제가 있는 듯 함
      // 그렇기에 파일 확장자를 추출하여 .jpg로 변경
      const ext = path.extname(file.originalname);
      cb(null, `childImg-${Date.now()}${ext}`);
    },
  }),
});

const app: Express = express();
// 모든 출처에서의 요청을 허용
app.use(cors());
const PORT: number = parseInt(process.env.PORT as string, 10) || 3001;

// 이미지를 다운로드하고 Buffer로 반환하는 함수
const downloadImage = async (url: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        const data: any[] = [];
        res.on("data", (chunk) => data.push(chunk));
        res.on("end", () => resolve(Buffer.concat(data)));
      })
      .on("error", (err) => reject(err));
  });
};

// S3에 이미지를 업로드하고 URL을 반환하는 함수
const uploadImageToS3 = async (
  imageBuffer: Buffer,
  bucketName: string,
  contentType: string = "image/jpeg"
): Promise<string> => {
  const fileName = `resultImg-${Date.now()}.jpg`;
  const params: AWS.S3.PutObjectRequest = {
    Bucket: bucketName,
    Key: fileName,
    Body: imageBuffer,
    ACL: "public-read",
    ContentType: contentType,
  };

  await s3.upload(params).promise();

  return `https://${bucketName}.s3.amazonaws.com/${encodeURIComponent(
    fileName
  )}`;
};

// S3에 파일 업로드하고 URL 반환하는 함수
const uploadFileAndGetUrl = (
  filePath: string,
  bucketName: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fileContent = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const mimeType = "image/jpeg"; // 이 부분은 실제 파일 유형에 따라 달라질 수 있습니다.

    const params: AWS.S3.PutObjectRequest = {
      Bucket: bucketName,
      Key: fileName,
      Body: fileContent,
      ACL: "public-read", // 공개 읽기 권한으로 설정
      ContentType: mimeType, // MIME 타입 설정
    };

    s3.upload(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        const fileUrl = `https://${bucketName}.s3.amazonaws.com/${encodeURIComponent(
          fileName
        )}`;
        resolve(fileUrl);
      }
    });
  });
};

// Midjourney 작업 처리 함수
async function processMidjourney(
  client: Midjourney,
  prompt: string
): Promise<string | undefined> {
  const imagine = await client.Imagine(
    prompt,
    (uri: string, progress: string) => {
      console.log("loading", uri, "progress", progress);
    }
  );

  if (!imagine) {
    console.log("no message");
    return undefined;
  }

  const u1CustomID = imagine.options?.find((o) => o.label === "U1")?.custom;
  if (!u1CustomID) {
    console.log("no U1");
    return undefined;
  }

  const upscale = await client.Custom({
    msgId: imagine.id as string,
    flags: imagine.flags,
    customId: u1CustomID,
    loading: (uri: string, progress: string) => {
      console.log("loading", uri, "progress", progress);
    },
  });
  /* 이미지 생성한 uri */
  console.log(upscale?.uri);

  return upscale?.uri;
}

// 이미지 생성 및 업로드 처리 API
app.post(
  "/node/doduk/generateImage",
  upload.single("image"),
  async (req: Request, res: Response) => {
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
      const bucketName = "ippoteambucket/doduk";
      // String fileKey = "tuktak/" + "tuktak_" + dateTimeString; // 예: "test/" 폴더 내에 파일 저장
      // 파일을 S3에 업로드하고 URL을 가져옴
      const childImgUrl = await uploadFileAndGetUrl(childImgFile, bucketName);
      console.log(childImgUrl);

      // Midjourney 클라이언트 초기화
      const client = new Midjourney({
        ServerId: process.env.SERVER_ID as string,
        ChannelId: process.env.CHANNEL_ID as string,
        SalaiToken: process.env.SALAI_TOKEN as string,
        Debug: true,
        Ws: true,
      });

      await client.init();

      //동화 내용을 요약한 커맨드
      const prompt1 =
        storySummary +
        ", light-hearted adventurous mood, dynamic atmosphere, --ar 2:3";
      //합성 전 토대가 될 일러스트 삽화를 생성
      const imageUrl1 = await processMidjourney(client, prompt1);

      //업로드 받은 아이의 얼굴과, 생성된 일러스트 삽화를 동화 내용에 맞추어 합성
      const prompt2 =
        imageUrl1 +
        " " +
        childImgUrl +
        " is protagonist and children. " +
        storySummary +
        ", light-hearted adventurous mood, dynamic atmosphere, --ar 2:3";
      const imageUrl2 = await processMidjourney(client, prompt2);

      // imageUrl2가 유효한지 확인하고 다운로드 및 S3에 업로드를 진행
      if (imageUrl2) {
        const imageBuffer = await downloadImage(imageUrl2);
        const resultImgUrl = await uploadImageToS3(imageBuffer, bucketName);
        console.log("이미지 결과물을 확인합니다. : " + resultImgUrl);

        res.json({
          message: "이미지 생성 및 S3 업로드 완료",
          imageUrl: resultImgUrl,
        });
      } else {
        // imageUrl2가 undefined인 경우, 오류 메시지를 반환
        res.status(500).send({ message: "이미지 생성에 실패했습니다." });
      }
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "서버 오류 발생" });
    }
  }
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
