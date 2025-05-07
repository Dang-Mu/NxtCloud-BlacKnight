// AWS Lambda 함수: pdfManager.js
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

// AWS 서비스 클라이언트 초기화
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

// 환경 변수
const PDF_BUCKET = process.env.PDF_BUCKET;
const USERS_TABLE = process.env.USERS_TABLE;
const PDF_FILES_TABLE = process.env.PDF_FILES_TABLE;
const URL_EXPIRATION = 3600; // 1시간

exports.handler = async (event) => {
  try {
    // CORS 헤더 설정
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS,DELETE",
      "Content-Type": "application/json",
    };

    // OPTIONS 요청 처리 (CORS Preflight)
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: "CORS enabled" }),
      };
    }

    // 요청에서 사용자 ID 가져오기
    // 실제 구현에서는 JWT 토큰 등에서 추출하거나 Cognito와 연동
    const userId = event.headers?.Authorization || "0";

    // 사용자 정보 가져오기
    const userInfo = await getUserInfo(userId);
    if (!userInfo) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "인증되지 않은 사용자입니다" }),
      };
    }

    // 쿼리 파라미터에서 액션 가져오기
    const action = event.queryStringParameters?.action || "";

    // 액션에 따라 처리
    switch (action) {
      case "listTemplates":
        return await listTemplates(
          userInfo,
          event.queryStringParameters,
          headers
        );
      case "getTemplate":
        return await getTemplate(
          userInfo,
          event.queryStringParameters,
          headers
        );
      case "getPresignedUrl":
        return await getPresignedUrl(
          userInfo,
          event.queryStringParameters,
          headers
        );
      case "getUploadedFile":
        return await getUploadedFile(
          userInfo,
          event.queryStringParameters,
          headers
        );
      case "saveFileMetadata":
        return await saveFileMetadata(
          userInfo,
          JSON.parse(event.body),
          headers
        );
      case "deleteFile":
        return await deleteFile(userInfo, event.queryStringParameters, headers);
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "유효하지 않은 액션입니다" }),
        };
    }
  } catch (error) {
    console.error("오류 발생:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "서버 오류가 발생했습니다" }),
    };
  }
};

// 사용자 정보 가져오기
async function getUserInfo(userId) {
  if (userId === "0") {
    return null;
  }

  try {
    const result = await dynamodb
      .get({
        TableName: USERS_TABLE,
        Key: { id: userId },
      })
      .promise();

    return result.Item;
  } catch (error) {
    console.error("사용자 정보 조회 오류:", error);
    return null;
  }
}

// 사용자가 접근 가능한 템플릿 목록 가져오기
async function listTemplates(userInfo, queryParams, headers) {
  const { organization, role } = userInfo;

  let params;

  if (role === "admin") {
    // 관리자는 조직 내 모든 템플릿을 볼 수 있음
    params = {
      TableName: PDF_FILES_TABLE,
      FilterExpression: "organization = :org",
      ExpressionAttributeValues: {
        ":org": organization,
      },
    };
  } else {
    // 일반 사용자는 자신의 템플릿 + 조직 내 공유된 템플릿을 볼 수 있음
    params = {
      TableName: PDF_FILES_TABLE,
      FilterExpression:
        "organization = :org AND (ownerId = :userId OR isPublic = :isPublic)",
      ExpressionAttributeValues: {
        ":org": organization,
        ":userId": userInfo.id,
        ":isPublic": true,
      },
    };
  }

  const result = await dynamodb.scan(params).promise();

  // 클라이언트에 필요한 정보만 포함하여 반환
  const templates = result.Items.map((item) => ({
    fileId: item.fileId,
    fileName: item.fileName,
    description: item.description || "",
    isPublic: item.isPublic,
    isOwner: item.ownerId === userInfo.id,
    createdAt: item.createdAt,
  }));

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ templates }),
  };
}

// 템플릿 파일에 대한 서명된 URL 생성
async function getTemplate(userInfo, queryParams, headers) {
  if (!queryParams?.fileId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "파일 ID가 필요합니다" }),
    };
  }

  const fileId = queryParams.fileId;

  // DynamoDB에서 파일 메타데이터 조회
  const fileMetadata = await getFileMetadata(fileId);

  if (!fileMetadata) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "파일을 찾을 수 없습니다" }),
    };
  }

  // 접근 권한 확인
  if (!canAccessFile(userInfo, fileMetadata)) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: "파일 접근 권한이 없습니다" }),
    };
  }

  // S3 키 가져오기
  const s3Key = fileMetadata.s3Key;

  // 파일이 존재하는지 확인
  try {
    await s3
      .headObject({
        Bucket: PDF_BUCKET,
        Key: s3Key,
      })
      .promise();
  } catch (error) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "파일을 S3에서 찾을 수 없습니다" }),
    };
  }

  // 서명된 URL 생성
  const url = s3.getSignedUrl("getObject", {
    Bucket: PDF_BUCKET,
    Key: s3Key,
    Expires: URL_EXPIRATION,
  });

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ url, metadata: fileMetadata }),
  };
}

// 파일 업로드를 위한 서명된 URL 생성
async function getPresignedUrl(userInfo, queryParams, headers) {
  if (!queryParams?.fileName) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "파일 이름이 필요합니다" }),
    };
  }

  const fileName = queryParams.fileName;
  const isPublic = queryParams.isPublic === "true";
  const description = queryParams.description || "";

  // 고유한 파일 ID 생성 - 사용자ID_UUID 형식
  const fileId = `${userInfo.id}_${uuidv4()}`;

  // S3 키 생성 (userID/fileName 형식)
  const s3Key = `${userInfo.id}/${fileName}`;

  // PUT 요청을 위한 서명된 URL 생성
  const uploadUrl = s3.getSignedUrl("putObject", {
    Bucket: PDF_BUCKET,
    Key: s3Key,
    Expires: URL_EXPIRATION,
    ContentType: "application/pdf",
  });

  // 파일 메타데이터 준비
  const fileMetadata = {
    fileId,
    s3Key,
    fileName,
    ownerId: userInfo.id,
    organization: userInfo.organization,
    isPublic,
    description,
    createdAt: new Date().toISOString(),
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ uploadUrl, fileMetadata }),
  };
}

// 업로드된 파일 메타데이터 저장
async function saveFileMetadata(userInfo, fileMetadata, headers) {
  if (!fileMetadata || !fileMetadata.fileId || !fileMetadata.s3Key) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "유효하지 않은 파일 메타데이터입니다" }),
    };
  }

  // 소유자 정보 업데이트
  fileMetadata.ownerId = userInfo.id;
  fileMetadata.organization = userInfo.organization;

  try {
    await dynamodb
      .put({
        TableName: PDF_FILES_TABLE,
        Item: fileMetadata,
        ConditionExpression: "attribute_not_exists(fileId)",
      })
      .promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, fileId: fileMetadata.fileId }),
    };
  } catch (error) {
    console.error("파일 메타데이터 저장 오류:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "파일 메타데이터 저장에 실패했습니다" }),
    };
  }
}

// 업로드된 파일에 대한 서명된 URL 생성
async function getUploadedFile(userInfo, queryParams, headers) {
  return await getTemplate(userInfo, queryParams, headers);
}

// 파일 삭제
async function deleteFile(userInfo, queryParams, headers) {
  if (!queryParams?.fileId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "파일 ID가 필요합니다" }),
    };
  }

  const fileId = queryParams.fileId;

  // DynamoDB에서 파일 메타데이터 조회
  const fileMetadata = await getFileMetadata(fileId);

  if (!fileMetadata) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "파일을 찾을 수 없습니다" }),
    };
  }

  // 삭제 권한 확인 (파일 소유자 또는 관리자만 삭제 가능)
  if (fileMetadata.ownerId !== userInfo.id && userInfo.role !== "admin") {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: "파일 삭제 권한이 없습니다" }),
    };
  }

  // S3에서 파일 삭제
  try {
    await s3
      .deleteObject({
        Bucket: PDF_BUCKET,
        Key: fileMetadata.s3Key,
      })
      .promise();
  } catch (error) {
    console.error("S3 파일 삭제 오류:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "S3 파일 삭제에 실패했습니다" }),
    };
  }

  // DynamoDB에서 메타데이터 삭제
  try {
    await dynamodb
      .delete({
        TableName: PDF_FILES_TABLE,
        Key: { fileId },
      })
      .promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error("파일 메타데이터 삭제 오류:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "파일 메타데이터 삭제에 실패했습니다" }),
    };
  }
}

// DynamoDB에서 파일 메타데이터 조회
async function getFileMetadata(fileId) {
  try {
    const result = await dynamodb
      .get({
        TableName: PDF_FILES_TABLE,
        Key: { fileId },
      })
      .promise();

    return result.Item;
  } catch (error) {
    console.error("파일 메타데이터 조회 오류:", error);
    return null;
  }
}

// 파일 접근 권한 확인
function canAccessFile(userInfo, fileMetadata) {
  // 1. 파일 소유자인 경우
  if (fileMetadata.ownerId === userInfo.id) {
    return true;
  }

  // 2. 관리자이고 같은 조직의 파일인 경우
  if (
    userInfo.role === "admin" &&
    fileMetadata.organization === userInfo.organization
  ) {
    return true;
  }

  // 3. 같은 조직이고 파일이 공개(isPublic)된 경우
  if (
    fileMetadata.organization === userInfo.organization &&
    fileMetadata.isPublic
  ) {
    return true;
  }

  return false;
}
