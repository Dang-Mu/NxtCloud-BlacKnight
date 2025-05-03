// src/services/api.js
import axios from "axios";

// Lambda 함수 URL
const LAMBDA_URL = process.env.REACT_APP_LAMBDA_URL;

// 기사 생성 API 호출
export const generateArticle = async (prompt) => {
  try {
    // 개발 모드이거나 LAMBDA_URL이 설정되지 않은 경우 목업 데이터 사용
    if (process.env.NODE_ENV === "development" || !LAMBDA_URL) {
      console.log("개발 모드: 목업 데이터 사용");
      return await generateMockArticle(prompt);
    }

    console.log("API 요청 전송:", LAMBDA_URL);
    console.log("요청 데이터:", { prompt });

    const response = await axios.post(
      LAMBDA_URL,
      { prompt },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 30000, // 30초 타임아웃
      }
    );

    console.log("API 응답:", response);

    return response.data.output;
  } catch (error) {
    console.error("API 호출 오류:", error);

    // 개발 환경에서는 에러 발생 시 목업 데이터 제공
    if (process.env.NODE_ENV === "development") {
      console.log("개발 모드: 오류 발생 시 목업 데이터 사용");
      return await generateMockArticle(prompt);
    }

    // 오류 유형에 따른 메시지 설정
    if (error.response) {
      // 서버 응답을 받았지만 2xx 범위가 아닌 상태 코드
      console.error("응답 데이터:", error.response.data);
      console.error("응답 상태:", error.response.status);
      throw new Error(
        `서버 오류 (${error.response.status}): ${
          error.response.data.message || "서버에서 오류가 발생했습니다."
        }`
      );
    } else if (error.request) {
      // 요청은 전송되었지만 응답을 받지 못함
      throw new Error(
        "서버에 연결할 수 없습니다. 네트워크 연결을 확인하거나 나중에 다시 시도하세요."
      );
    } else {
      // 요청 설정 중 오류 발생
      throw new Error(`요청 오류: ${error.message}`);
    }
  }
};

// 목업 기사 생성 함수
const generateMockArticle = async (prompt) => {
  // API 호출 시뮬레이션을 위한 지연
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // 프롬프트에서 정보 추출
  const orgMatch = prompt.match(/기관\/조직:\s*([^\n]+)/);
  const projMatch = prompt.match(/사업명:\s*([^\n]+)/);
  const compMatch = prompt.match(/업체명:\s*([^\n]+)/);
  const keyMatch = prompt.match(/핵심 키워드:\s*([^\n]+)/);
  const addMatch = prompt.match(/추가 내용:\s*([^\n]+)/);

  const org = orgMatch ? orgMatch[1].trim() : "00대학교";
  const proj = projMatch ? projMatch[1].trim() : "클라우드 AI 연구 프로젝트";
  const comp = compMatch ? compMatch[1].trim() : "넥스트클라우드";
  const keys = keyMatch ? keyMatch[1].trim() : "클라우드, AI, 빅데이터";
  const add = addMatch ? addMatch[1].trim() : "";

  // 수정 요청 확인
  if (prompt.includes("원본 기사:") && prompt.includes("수정 요청 사항:")) {
    // 원본 기사에서 첫 줄 제목 가져오기
    const originalArticle = prompt
      .split("원본 기사:")[1]
      .split("수정 요청 사항:")[0]
      .trim();
    const titleMatch = originalArticle.match(/^(.+?)(\n|$)/);
    const title = titleMatch ? titleMatch[1] : "기사 제목";

    // 수정 요청 사항
    const modificationRequest = prompt.split("수정 요청 사항:")[1].trim();

    // 수정된 기사 반환
    return `${title} - 수정됨

${org}는 ${comp}와 함께 혁신적인 ${proj}를 성공적으로 진행하고 있습니다. 이번 프로젝트는 ${keys} 등의 첨단 기술을 활용하여 기존 시스템의 효율성을 크게 향상시킬 전망입니다.

${org} 관계자는 "이번 프로젝트를 통해 우리 기관의 기술력을 한 단계 더 발전시킬 수 있을 것"이라고 기대감을 표현했습니다. 또한 ${comp}의 대표는 "양 기관의 전문성이 시너지를 발휘하여 혁신적인 결과물이 나올 것"이라고 밝혔습니다.

${
  modificationRequest.includes("총장")
    ? `${org} 총장 김철수 박사는 "4차 산업혁명 시대에 발맞춰 우리 대학이 선도적인 역할을 하게 되어 기쁘다"고 소감을 밝혔습니다.`
    : ""
}

${
  add ? add + "\n\n" : ""
}특히 이번 프로젝트는 인공지능과 빅데이터 기술을 활용하여 복잡한 데이터를 분석하고 최적화된 솔루션을 제공하는 것이 핵심입니다. 이를 위해 최신 클라우드 인프라를 구축하고, 고성능 AI 알고리즘을 개발하는 데 주력할 예정입니다.

${
  modificationRequest.includes("연구")
    ? "이번 연구의 중간 성과는 다음 달 진행되는 국제 학술 컨퍼런스에서 발표될 예정이며, 관련 산업계에서도 높은 관심을 보이고 있습니다."
    : ""
}

프로젝트 첫 번째 단계는 이미 완료되었으며, 다음 단계는 내년 초에 시작될 예정입니다. 양 기관은 지속적인 협력을 통해 국내 기술 발전에 기여할 것으로 기대됩니다.

${
  modificationRequest.includes("예산")
    ? "이번 프로젝트의 총 예산은 약 10억원으로, 정부 지원금과 양 기관의 매칭 펀드로 구성되어 있습니다. 이는 지난해 대비 30% 증가한 금액으로, 프로젝트의 중요성을 반영하고 있습니다."
    : ""
}`;
  }

  // 새 기사 생성
  return `[${proj} 성공적 진행 중]

${org}는 ${comp}와 함께 혁신적인 ${proj}를 성공적으로 진행하고 있다고 밝혔다. 이번 프로젝트는 ${keys} 등의 첨단 기술을 활용하여 기존 시스템의 효율성을 크게 향상시킬 전망이다.

${org} 관계자는 "이번 프로젝트를 통해 우리 기관의 기술력을 한 단계 더 발전시킬 수 있을 것"이라고 기대감을 표현했다. 또한 ${comp}의 대표는 "양 기관의 전문성이 시너지를 발휘하여 혁신적인 결과물이 나올 것"이라고 밝혔다.

${
  add ? add + "\n\n" : ""
}특히 이번 프로젝트는 인공지능과 빅데이터 기술을 활용하여 복잡한 데이터를 분석하고 최적화된 솔루션을 제공하는 것이 핵심이다. 이를 위해 최신 클라우드 인프라를 구축하고, 고성능 AI 알고리즘을 개발하는 데 주력할 예정이다.

프로젝트 첫 번째 단계는 이미 완료되었으며, 다음 단계는 내년 초에 시작될 예정이다. 양 기관은 지속적인 협력을 통해 국내 기술 발전에 기여할 것으로 기대된다.`;
};
