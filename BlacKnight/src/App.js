// src/App.js
import React, { useState } from "react";
import { Container, Row, Col, Alert } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

// 컴포넌트 가져오기
import Header from "./components/Header";
import ImageSection from "./components/ImageSection";
import PDFSourceSection from "./components/PDFSourceSection";
import RequirementsSection from "./components/RequirementsSection";
import ArticleSection from "./components/ArticleSection";
import ModificationSection from "./components/ModificationSection";

// API 서비스 가져오기
import { generateArticle } from "./services/api";
import { saveArticle, highlightChanges } from "./utils/textUtils";

// 로깅 유틸리티 추가
const logger = {
  log: process.env.NODE_ENV === "production" ? () => {} : console.log,
  warn: process.env.NODE_ENV === "production" ? () => {} : console.warn,
  error: process.env.NODE_ENV === "production" ? () => {} : console.error,
};

function App({ user, onLogout }) {
  // 상태 관리
  const [pdfContent, setPdfContent] = useState(null);
  const [currentArticle, setCurrentArticle] = useState(""); // ArticleSection에 표시할 기사
  const [modifiedArticle, setModifiedArticle] = useState(""); // 수정된 기사 전문에 표시할 기사
  // 로딩 상태를 분리하여 관리
  const [isGeneratingArticle, setIsGeneratingArticle] = useState(false);
  const [isModifyingArticle, setIsModifyingArticle] = useState(false);
  // 기사가 수정되었는지 여부 추적
  const [isArticleModified, setIsArticleModified] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });
  const [highlightedDiff, setHighlightedDiff] = useState("");

  // 알림 표시 함수
  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "" }),
      3000
    );
  };

  // PDF 소스 설정 함수
  const handleSetPdfContent = (content) => {
    setPdfContent(content);
    showNotification("PDF 소스가 선택되었습니다.", "success");
  };

  // 기사 생성 처리 함수 - 콜백 함수 추가
  const handleGenerateArticle = async (formData, callback) => {
    if (!pdfContent) {
      showNotification("PDF 소스를 먼저 선택하고 처리해주세요.", "warning");
      return;
    }

    // 조직 정보가 없으면 사용자 조직 정보 사용
    if (!formData.organization && user?.organization) {
      formData.organization = user.organization;
    }

    // 새 기사 생성 시 기존 상태 초기화
    setModifiedArticle("");
    setIsArticleModified(false);
    setHighlightedDiff("");

    const prompt = `
      다음 정보를 바탕으로 기사를 작성해주세요:
      형식 참고 예시: ${pdfContent}
      기관/조직: ${formData.organization}
      사업명: ${formData.project}
      업체명: ${formData.company}
      핵심 키워드: ${formData.keywords}
      추가 내용: ${formData.additional}
      최종 결과물은 한글로 1000자 이상이어야한다
    `;

    logger.log("기사 생성 시작", {
      organization: formData.organization,
      project: formData.project,
    });
    setIsGeneratingArticle(true); // 생성 버튼에만 스피너 표시

    try {
      const generatedArticle = await generateArticle(prompt);
      if (generatedArticle) {
        logger.log("기사 생성 성공", generatedArticle.substring(0, 50) + "...");
        setCurrentArticle(generatedArticle);
        showNotification("흑기사가 초안 작성을 완료하였습니다.", "success");

        // 콜백 함수가 제공된 경우 생성된 기사를 전달
        if (typeof callback === "function") {
          logger.log("콜백 함수 호출");
          callback(generatedArticle);
        }
      }
    } catch (error) {
      logger.error("기사 생성 실패", error);
      showNotification(`기사 생성 중 오류 발생: ${error.message}`, "danger");

      // 에러 발생 시 콜백에 null 전달
      if (typeof callback === "function") {
        callback(null);
      }
    } finally {
      setIsGeneratingArticle(false);
    }
  };

  // 기사 수정 처리 함수
  const handleModifyArticle = async (modificationRequest) => {
    if (!currentArticle) {
      showNotification("먼저 기사를 생성해주세요.", "warning");
      return;
    }

    // 기사를 수정할 소스 결정 - 이미 수정된 기사가 있다면 그것을 기반으로 수정
    const sourceArticle = isArticleModified ? modifiedArticle : currentArticle;

    const prompt = `
      원본 기사:
      ${sourceArticle}

      수정 요청 사항:
      ${modificationRequest}

      위의 요청 사항을 반영하여 기사를 수정해라
      최종 결과물 앞에, "생성하겠습니다.", "수정한 결과입니다" 등의 메시지가 반드시 없이 바로 기사 제목과 내용이 나와야한다.
      최종 결과물은 한글로 1000자 이상이어야한다
    `;

    logger.log("기사 수정 시작", {
      수정요청: modificationRequest.substring(0, 50) + "...",
    });
    setIsModifyingArticle(true); // 수정 버튼에만 스피너 표시

    try {
      const newModifiedArticle = await generateArticle(prompt);
      if (newModifiedArticle) {
        logger.log(
          "기사 수정 성공",
          newModifiedArticle.substring(0, 50) + "..."
        );

        // 이미 수정된 기사가 있다면, 그 기사를 현재 기사로 이동
        if (isArticleModified) {
          setCurrentArticle(modifiedArticle);
        }
        // 새로 수정된 기사를 수정된 기사 전문에 설정
        setModifiedArticle(newModifiedArticle);
        setIsArticleModified(true);

        // 변경 사항 하이라이트
        const diff = highlightChanges(sourceArticle, newModifiedArticle);
        setHighlightedDiff(diff);
        showNotification("흑기사가 수정을 완료했습니다.", "success");
      }
    } catch (error) {
      logger.error("기사 수정 실패", error);
      showNotification(`기사 수정 중 오류 발생: ${error.message}`, "danger");
    } finally {
      setIsModifyingArticle(false);
    }
  };

  return (
    <>
      <Header user={user} onLogout={onLogout} />

      <Container fluid className="app-container">
        {user && (
          <div className="user-welcome mb-4">
            <h2>
              안녕하세요, {user.organization ? `${user.organization}` : ""}
              {user.role === "admin" && " (관리자)"}님
            </h2>
            <p className="text-muted">
              {user.role === "admin"
                ? "관리자 모드로 접속 중입니다."
                : "일반 사용자 모드로 접속 중입니다."}
            </p>
          </div>
        )}

        <h1 className="text-gray font-italic">BlacKnight : 📰 ✍ ♞</h1>
        <h4 className="text-gray font-italic">AI 기사 생성 및 수정 흑기사</h4>
        <hr className="divider-gray" />

        <Row>
          <Col md={6}>
            {/* 왼쪽 섹션: 이미지 및 PDF 소스 */}
            <ImageSection />
            <PDFSourceSection
              user={user}
              onSetPdfContent={handleSetPdfContent}
            />
          </Col>

          <Col md={6}>
            {/* 오른쪽 섹션: 요구사항 입력 */}
            <RequirementsSection
              onGenerateArticle={handleGenerateArticle}
              isLoading={isGeneratingArticle} // 생성 버튼에만 로딩 표시
              defaultOrganization={user?.organization || ""}
            />
          </Col>
        </Row>

        <hr className="divider-gray" />

        {notification.show && (
          <Alert variant={notification.type}>{notification.message}</Alert>
        )}

        <Row>
          <Col md={6}>
            {/* 왼쪽 하단: 생성된/현재 작업 중인 기사 */}
            <ArticleSection article={currentArticle} />
          </Col>

          <Col md={6}>
            {/* 오른쪽 하단: 수정 요청 */}
            <ModificationSection
              article={isArticleModified ? modifiedArticle : currentArticle} // 가장 최신 기사를 수정 대상으로 사용
              highlightedDiff={highlightedDiff}
              onModifyArticle={handleModifyArticle}
              isLoading={isModifyingArticle} // 수정 버튼에만 로딩 표시
            />
          </Col>
        </Row>

        {/* 수정된 기사 전문 - 실제 수정된 경우에만 표시 */}
        {isArticleModified && modifiedArticle && (
          <>
            <h3 className="text-gray font-italic section-header">
              수정된 기사 전문
            </h3>
            <hr className="divider-gray" />
            <div className="modified-article">{modifiedArticle}</div>
            <button
              className="btn btn-outline-secondary mt-3"
              onClick={() =>
                saveArticle(modifiedArticle, "modified_article.txt")
              }
            >
              수정된 기사 다운로드
            </button>
          </>
        )}
      </Container>
    </>
  );
}

export default App;
