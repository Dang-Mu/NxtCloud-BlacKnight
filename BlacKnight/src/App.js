// src/App.js
import React, { useState } from "react";
import { Container, Row, Col, Alert } from "react-bootstrap";
import { v4 as uuidv4 } from "uuid";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

// 컴포넌트 가져오기
import Header from "./components/Header";
import ImageSection from "./components/ImageSection";
import PDFSourceSection from "./components/PDFSourceSection";
import RequirementsSection from "./components/RequirementsSection";
import ArticleSection from "./components/ArticleSection";
import ModificationSection from "./components/ModificationSection";
import VersionControlSection from "./components/VersionControlSection";

// API 서비스 가져오기
import { generateArticle, saveArticleVersion } from "./services/api";
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

  // 버전 관리를 위한 상태 추가
  const [versions, setVersions] = useState([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);

  // API 작업 중인지 확인하는 상태값 추가 (기사 생성 또는 수정 중)
  const isProcessing = isGeneratingArticle || isModifyingArticle;

  // 기사 생성 및 수정 시 사용되는 고유 ID
  const [originId, setOriginId] = useState("");

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

  // 현재 버전 저장 함수
  const handleSaveCurrentVersion = () => {
    // 저장할 내용이 없는 경우
    if (!currentArticle && !modifiedArticle) {
      showNotification("저장할 기사가 없습니다.", "warning");
      return;
    }

    // 현재 버전의 기사 내용
    const articleContent = isArticleModified ? modifiedArticle : currentArticle;

    // 새 버전 생성
    const newVersion = {
      content: articleContent,
      timestamp: new Date().toISOString(),
      isModified: isArticleModified,
    };

    // 버전 목록에 추가
    const newVersions = [...versions, newVersion];
    setVersions(newVersions);
    setCurrentVersionIndex(newVersions.length - 1);

    showNotification("버전이 저장되었습니다.", "success");
  };

  // 버전 선택 함수
  const handleSelectVersion = (index) => {
    if (index >= 0 && index < versions.length) {
      const selectedVersion = versions[index];

      // 선택한 버전이 수정된 버전인 경우
      if (selectedVersion.isModified) {
        setModifiedArticle(selectedVersion.content);
        setIsArticleModified(true);
      } else {
        // 원본 기사인 경우
        setCurrentArticle(selectedVersion.content);
        setModifiedArticle("");
        setIsArticleModified(false);
        setHighlightedDiff("");
      }

      setCurrentVersionIndex(index);
      showNotification(`버전 ${index + 1}이 로드되었습니다.`, "success");
    }
  };

  // 기사 생성 처리 함수 - 콜백 함수 추가
  const handleGenerateArticle = async (jsonData, formData, callback) => {
    // 수정 작업 중이면 처리하지 않음
    if (isProcessing) {
      showNotification(
        "다른 작업이 진행 중입니다. 잠시 후 다시 시도해주세요.",
        "warning"
      );
      return;
    }

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
        logger.log("기사 생성 JSON:", jsonData);
        setCurrentArticle(generatedArticle);

        // 최초 버전 생성 및 저장
        const initialVersion = {
          content: generatedArticle,
          timestamp: new Date().toISOString(),
          isModified: false,
        };
        setVersions([initialVersion]);
        setCurrentVersionIndex(0);

        showNotification("흑기사가 초안 작성을 완료하였습니다.", "success");

        const newsId = uuidv4(); // 각 버전마다 고유 ID
        if (!originId) setOriginId(newsId); // 최초 생성 시 originId 설정

        // DB에 기사 저장
        try {
          await saveArticleVersion({
            newsId,
            originId,
            ownerId: user?.id,
            version: 1,
            createdAt: initialVersion.timestamp,
            content: generatedArticle,
            description: jsonData, // 원문 요청 정보
          });
          logger.log("기사 생성 로그 API 전송 완료");
        } catch (apiError) {
          logger.warn("기사 생성 로그 API 전송 실패", apiError);
        }

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

  // 기사 수정 처리 함수 - 콜백 함수 추가
  const handleModifyArticle = async (modificationRequest, callback) => {
    // 생성 작업 중이면 처리하지 않음
    if (isProcessing) {
      showNotification(
        "다른 작업이 진행 중입니다. 잠시 후 다시 시도해주세요.",
        "warning"
      );
      return;
    }

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

        // 새 버전 자동 생성
        const newVersion = {
          content: newModifiedArticle,
          timestamp: new Date().toISOString(),
          isModified: true,
        };
        const newVersions = [...versions, newVersion];
        setVersions(newVersions);
        setCurrentVersionIndex(newVersions.length - 1);

        showNotification("흑기사가 수정을 완료했습니다.", "success");

        // 콜백 함수가 제공된 경우 수정된 기사를 전달
        if (typeof callback === "function") {
          logger.log("수정 콜백 함수 호출");
          callback(newModifiedArticle);
        }
      }
    } catch (error) {
      logger.error("기사 수정 실패", error);
      showNotification(`기사 수정 중 오류 발생: ${error.message}`, "danger");

      // 에러 발생 시 콜백에 null 전달
      if (typeof callback === "function") {
        callback(null);
      }
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
              isLoading={isGeneratingArticle}
              isDisabled={isProcessing} // 작업 중일 때 비활성화
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
            <ArticleSection
              article={currentArticle}
              isDisabled={isProcessing} // 작업 중일 때 비활성화
            />
          </Col>

          <Col md={6}>
            {/* 오른쪽 하단: 수정 요청 */}
            <ModificationSection
              article={isArticleModified ? modifiedArticle : currentArticle} // 가장 최신 기사를 수정 대상으로 사용
              highlightedDiff={highlightedDiff}
              onModifyArticle={handleModifyArticle}
              isLoading={isModifyingArticle}
              isDisabled={isProcessing} // 작업 중일 때 비활성화
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
              className="btn btn-outline-secondary mt-3 mb-4"
              onClick={() =>
                saveArticle(modifiedArticle, "modified_article.txt")
              }
              disabled={isProcessing} // 작업 중일 때 비활성화
            >
              수정된 기사 다운로드
            </button>
          </>
        )}

        {/* 버전 관리 섹션 - 기사가 생성된 후에만 표시 */}
        {versions.length > 0 && (
          <VersionControlSection
            versions={versions}
            currentVersionIndex={currentVersionIndex}
            onSelectVersion={handleSelectVersion}
            onSaveCurrentVersion={handleSaveCurrentVersion}
            isDisabled={isProcessing}
          />
        )}
      </Container>
    </>
  );
}

export default App;
