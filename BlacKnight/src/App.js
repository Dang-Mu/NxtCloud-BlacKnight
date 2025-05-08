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

function App({ user, onLogout }) {
  // 상태 관리
  const [pdfContent, setPdfContent] = useState(null);
  const [article, setArticle] = useState("");
  const [previousArticle, setPreviousArticle] = useState("");
  // 로딩 상태를 분리하여 관리
  const [isGeneratingArticle, setIsGeneratingArticle] = useState(false);
  const [isModifyingArticle, setIsModifyingArticle] = useState(false);
  // 새 기사 생성 여부를 추적하는 상태 변수 추가
  const [isNewArticle, setIsNewArticle] = useState(true);
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

  // 기사 생성 처리 함수
  const handleGenerateArticle = async (formData) => {
    if (!pdfContent) {
      showNotification("PDF 소스를 먼저 선택하고 처리해주세요.", "warning");
      return;
    }

    // 조직 정보가 없으면 사용자 조직 정보 사용
    if (!formData.organization && user?.organization) {
      formData.organization = user.organization;
    }

    // 새 기사 생성임을 표시
    setIsNewArticle(true);

    // 기사를 새로 생성할 때 기존 기사 내용 초기화
    // 이전 기사 정보도 초기화하여 "새로 생성된 기사" 섹션이 표시되지 않도록 함
    setPreviousArticle("");
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

    setIsGeneratingArticle(true); // 생성 버튼에만 스피너 표시
    try {
      const generatedArticle = await generateArticle(prompt);
      if (generatedArticle) {
        // 기사 생성 시 이전 기사를 참조하지 않음
        setArticle(generatedArticle);
        showNotification("흑기사가 초안 작성을 완료하였습니다.", "success");
      }
    } catch (error) {
      showNotification(`기사 생성 중 오류 발생: ${error.message}`, "danger");
    } finally {
      setIsGeneratingArticle(false);
    }
  };

  // 기사 수정 처리 함수
  const handleModifyArticle = async (modificationRequest) => {
    if (!article) {
      showNotification("먼저 기사를 생성해주세요.", "warning");
      return;
    }

    // 수정 작업임을 표시
    setIsNewArticle(false);

    const prompt = `
      원본 기사:
      ${article}

      수정 요청 사항:
      ${modificationRequest}

      위의 요청 사항을 반영하여 기사를 수정해라
      최종 결과물 앞에, "생성하겠습니다.", "수정한 결과입니다" 등의 메시지가 반드시 없이 바로 기사 제목과 내용이 나와야한다.
      최종 결과물은 한글로 1000자 이상이어야한다
    `;

    setIsModifyingArticle(true); // 수정 버튼에만 스피너 표시
    try {
      const modifiedArticle = await generateArticle(prompt);
      if (modifiedArticle) {
        setPreviousArticle(article);
        setArticle(modifiedArticle);
        // 변경 사항 하이라이트
        const diff = highlightChanges(article, modifiedArticle);
        setHighlightedDiff(diff);
        showNotification("흑기사가 수정을 완료했습니다.", "success");
      }
    } catch (error) {
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
            {/* 왼쪽 하단: 생성된 기사 */}
            <ArticleSection article={article} />
          </Col>

          <Col md={6}>
            {/* 오른쪽 하단: 수정 요청 */}
            <ModificationSection
              article={article}
              highlightedDiff={highlightedDiff}
              onModifyArticle={handleModifyArticle}
              isLoading={isModifyingArticle} // 수정 버튼에만 로딩 표시
            />
          </Col>
        </Row>

        {/* 수정된 기사 전문 - 실제 수정된 경우에만 표시 */}
        {previousArticle &&
          article &&
          previousArticle !== article &&
          !isNewArticle && (
            <>
              <h3 className="text-gray font-italic section-header">
                수정된 기사 전문
              </h3>
              <hr className="divider-gray" />
              <div className="modified-article">{article}</div>
              <button
                className="btn btn-outline-secondary mt-3"
                onClick={() => saveArticle(article, "modified_article.txt")}
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
