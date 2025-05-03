// src/App.js
import React, { useState } from "react";
import { Container, Row, Col, Alert, Spinner } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

// 컴포넌트 가져오기
import ImageSection from "./components/ImageSection";
import PDFSourceSection from "./components/PDFSourceSection";
import RequirementsSection from "./components/RequirementsSection";
import ArticleSection from "./components/ArticleSection";
import ModificationSection from "./components/ModificationSection";

// API 서비스 가져오기
import { generateArticle } from "./services/api";

function App() {
  // 상태 관리
  const [pdfContent, setPdfContent] = useState(null);
  const [article, setArticle] = useState("");
  const [previousArticle, setPreviousArticle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

    const prompt = `
      다음 정보를 바탕으로 기사를 작성해주세요:
      형식 참고 예시: ${pdfContent}
      기관/조직: ${formData.organization}
      사업명: ${formData.project}
      업체명: ${formData.company}
      핵심 키워드: ${formData.keywords}
      추가 내용: ${formData.additional}
      최종 결과물은 한글로 1000자 이상이어야 한다
    `;

    setIsLoading(true);
    try {
      const generatedArticle = await generateArticle(prompt);
      if (generatedArticle) {
        setPreviousArticle(article);
        setArticle(generatedArticle);
        showNotification("흑기사가 초안 작성을 완료하였습니다.", "success");
      }
    } catch (error) {
      console.error("기사 생성 오류:", error);
      showNotification(`기사 생성 중 오류 발생: ${error.message}`, "danger");
    } finally {
      setIsLoading(false);
    }
  };

  // 기사 수정 처리 함수
  const handleModifyArticle = async (modificationRequest) => {
    if (!article) {
      showNotification("먼저 기사를 생성해주세요.", "warning");
      return;
    }

    const prompt = `
      원본 기사:
      ${article}

      수정 요청 사항:
      ${modificationRequest}

      위의 요청 사항을 반영하여 기사를 수정해라
      최종 결과물 앞에, "생성하겠습니다.", "수정한 결과입니다" 등의 메시지가 반드시 없이 바로 기사 제목과 내용이 나와야한다.
      최종 결과물은 한글로 1000자 이상이어야한다
    `;

    setIsLoading(true);
    try {
      const modifiedArticle = await generateArticle(prompt);
      if (modifiedArticle) {
        setPreviousArticle(article);
        setArticle(modifiedArticle);
        setHighlightedDiff(modifiedArticle); // 실제로는 highlightChanges 함수에서 처리
        showNotification("흑기사가 수정을 완료했습니다.", "success");
      }
    } catch (error) {
      showNotification(`기사 수정 중 오류 발생: ${error.message}`, "danger");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container fluid className="app-container">
      <h1 className="text-gray font-italic">BlacKnight : 📰 ✍ ♞</h1>
      <h4 className="text-gray font-italic">AI 기사 생성 및 수정 흑기사</h4>
      <hr className="divider-gray" />

      <Row>
        <Col md={6}>
          {/* 왼쪽 섹션: 이미지 및 PDF 소스 */}
          <ImageSection />
          <PDFSourceSection onSetPdfContent={handleSetPdfContent} />
        </Col>

        <Col md={6}>
          {/* 오른쪽 섹션: 요구사항 입력 */}
          <RequirementsSection
            onGenerateArticle={handleGenerateArticle}
            isLoading={isLoading}
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
            isLoading={isLoading}
          />
        </Col>
      </Row>

      {previousArticle && article && previousArticle !== article && (
        <>
          <h3 className="text-gray font-italic section-header">
            수정된 기사 전문
          </h3>
          <hr className="divider-gray" />
          <div className="modified-article">{article}</div>
          <button
            className="btn btn-outline-secondary mt-3"
            onClick={() => {
              const blob = new Blob([article], {
                type: "text/plain;charset=utf-8",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "modified_article.txt";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}
          >
            수정된 기사 다운로드
          </button>
        </>
      )}
    </Container>
  );
}

export default App;
