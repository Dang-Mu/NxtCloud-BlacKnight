// src/App.js
import React, { useState } from "react";
import { Container, Row, Col, Alert, Button, Modal } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { v4 as uuidv4 } from 'uuid';

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

// articleService 함수 직접 구현 (새 파일 생성 없이)
const saveArticleToDatabase = async (articleData) => {
  console.log("기사 저장 (실제 DB 저장은 구현되지 않음):", articleData);
  // 지금은 콘솔에만 로그하고 성공으로 가정
  // 실제 구현시 axios를 사용하여 API 호출
  return articleData;
};

function App({ user, onLogout }) {
  // 상태 관리
  const [pdfContent, setPdfContent] = useState(null);
  const [currentArticle, setCurrentArticle] = useState(""); // ArticleSection에 표시할 기사
  const [modifiedArticle, setModifiedArticle] = useState(""); // 수정된 기사 전문에 표시할 기사
  // 로딩 상태를 분리하여 관리
  const [isGeneratingArticle, setIsGeneratingArticle] = useState(false);
  const [isModifyingArticle, setIsModifyingArticle] = useState(false);
  const [isSavingArticle, setIsSavingArticle] = useState(false);
  // 기사가 수정되었는지 여부 추적
  const [isArticleModified, setIsArticleModified] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });
  const [highlightedDiff, setHighlightedDiff] = useState("");
  
  // 새로 추가된 상태
  const [articleVersions, setArticleVersions] = useState([]); // 기사 버전 관리
  const [showModifyConfirm, setShowModifyConfirm] = useState(false); // 수정 확인 모달 상태
  const [isNewArticle, setIsNewArticle] = useState(false); // 새 기사가 생성되었는지 여부
  const [currentVersionId, setCurrentVersionId] = useState(null); // 현재 작업 중인 버전 ID

  // 알림 표시 함수
  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "" }),
      3000
    );
  };

  // PDF 소스 설정 함수
  const handleSetPdfContent = (content, metadata) => {
    setPdfContent(content);
    showNotification("PDF 소스가 선택되었습니다.", "success");
  };

  // 기사 생성 처리 함수
  const handleGenerateArticle = async (formData) => {
    console.log("기사 생성 시작");
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
    setArticleVersions([]);
    setCurrentVersionId(null);
    
    // 새 기사 생성 시 모달 표시 상태도 초기화
    setIsNewArticle(false);
    setShowModifyConfirm(false);

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
      console.log("기사 생성 성공:", !!generatedArticle);
      
      if (generatedArticle) {
        // 순서 중요: 먼저 기사 내용 설정 후 팝업 상태 설정
        setCurrentArticle(generatedArticle);
        console.log("새 기사 상태 설정");
        setIsNewArticle(true);
        setShowModifyConfirm(true); // 명시적으로 모달 표시 설정
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

    setIsModifyingArticle(true); // 수정 버튼에만 스피너 표시
    try {
      const newModifiedArticle = await generateArticle(prompt);
      if (newModifiedArticle) {
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
        
        // 새 버전 ID 생성 및 버전 추가
        const newVersionId = uuidv4();
        setArticleVersions([
          ...articleVersions,
          { 
            id: newVersionId, 
            content: newModifiedArticle,
            timestamp: new Date().toISOString(),
            userId: user?.id,
            organization: user?.organization 
          }
        ]);
        setCurrentVersionId(newVersionId);
        
        // DB에 새 버전 저장
        await saveArticleToDatabase({
          id: newVersionId,
          content: newModifiedArticle,
          userId: user?.id,
          organization: user?.organization,
          timestamp: new Date().toISOString(),
          isLatest: true
        });
        
        showNotification("흑기사가 수정을 완료했습니다. 새 버전이 저장되었습니다.", "success");
      }
    } catch (error) {
      showNotification(`기사 수정 중 오류 발생: ${error.message}`, "danger");
    } finally {
      setIsModifyingArticle(false);
    }
  };

  // 기사 수정 확인 처리 함수
  const handleConfirmModify = async (shouldModify) => {
    console.log("기사 수정 확인 처리:", { shouldModify });
    
    setShowModifyConfirm(false);
    setIsNewArticle(false); // 확인 후에는 더 이상 새 기사가 아님
    
    if (shouldModify) {
      // 사용자가 '예'를 선택했을 때 - 수정 섹션으로 포커스 이동
      showNotification("수정 섹션에서 요청 사항을 입력해주세요.", "info");
      // 포커스 이동 로직
      setTimeout(() => {
        const modificationSection = document.querySelector('.section-header');
        if (modificationSection) {
          modificationSection.scrollIntoView({ behavior: 'smooth' });
        } else {
          console.log("수정 섹션 요소를 찾을 수 없습니다");
          // 대안으로 스크롤 위치 지정
          window.scrollTo({
            top: document.body.scrollHeight / 2,
            behavior: 'smooth'
          });
        }
      }, 300);
    } else {
      // 사용자가 '아니오'를 선택했을 때 - 기사 DB에 저장
      try {
        console.log("기사 저장 시작");
        setIsSavingArticle(true);
        const articleId = uuidv4();
        
        // saveArticleToDatabase 함수가 제대로 구현되었는지 확인
        console.log("DB 저장 요청:", {
          id: articleId,
          contentLength: currentArticle.length,
          userId: user?.id,
          organization: user?.organization
        });
        
        await saveArticleToDatabase({
          id: articleId,
          content: currentArticle,
          userId: user?.id,
          organization: user?.organization,
          timestamp: new Date().toISOString(),
          isLatest: true
        });
        
        // 버전 목록에 추가
        setArticleVersions([
          {
            id: articleId,
            content: currentArticle,
            timestamp: new Date().toISOString(),
            userId: user?.id,
            organization: user?.organization
          }
        ]);
        setCurrentVersionId(articleId);
        
        showNotification("기사가 저장되었습니다.", "success");
      } catch (error) {
        console.error("기사 저장 오류:", error);
        showNotification(`기사 저장 중 오류 발생: ${error.message}`, "danger");
      } finally {
        setIsSavingArticle(false);
      }
    }
  };

  // 기사 DB 저장 함수
  const handleSaveArticle = async () => {
    try {
      setIsSavingArticle(true);
      
      // 현재 표시되고 있는 기사 내용 결정
      const articleToSave = isArticleModified ? modifiedArticle : currentArticle;
      
      // UUID 생성 및 저장
      const articleId = uuidv4();
      await saveArticleToDatabase({
        id: articleId,
        content: articleToSave,
        userId: user?.id,
        organization: user?.organization,
        timestamp: new Date().toISOString(),
        isLatest: true
      });
      
      // 버전 관리 목록에 추가
      setArticleVersions([
        ...articleVersions,
        {
          id: articleId,
          content: articleToSave,
          timestamp: new Date().toISOString(),
          userId: user?.id,
          organization: user?.organization
        }
      ]);
      setCurrentVersionId(articleId);
      
      showNotification("기사가 성공적으로 저장되었습니다.", "success");
    } catch (error) {
      showNotification(`기사 저장 중 오류 발생: ${error.message}`, "danger");
    } finally {
      setIsSavingArticle(false);
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
        
        {process.env.NODE_ENV !== 'production' && (
          <div className="debug-buttons mb-2" style={{ display: 'flex', gap: '10px' }}>
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={() => {
                console.log("Current state:", { 
                  currentArticle: !!currentArticle, 
                  isNewArticle, 
                  showModifyConfirm,
                  articleVersions
                });
              }}
            >
              상태 로깅
            </Button>
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={() => setShowModifyConfirm(true)}
            >
              수정 확인 모달 표시
            </Button>
          </div>
        )}

        <Row>
          <Col md={6}>
            {/* 왼쪽 하단: 생성된/현재 작업 중인 기사 */}
            <ArticleSection 
              article={currentArticle} 
              onSaveArticle={handleSaveArticle}
              // 모달은 App.js에서만 처리하도록 props 제거
              // showModifyConfirm={showModifyConfirm}
              // setShowModifyConfirm={setShowModifyConfirm}
              // isNewArticle={isNewArticle}
              // onConfirmModify={handleConfirmModify}
            />
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
            <Button
              variant="outline-secondary"
              className="mt-3 me-2"
              onClick={() => saveArticle(modifiedArticle, "modified_article.txt")}
            >
              수정된 기사 다운로드
            </Button>
            <Button
              variant="primary"
              className="mt-3"
              onClick={handleSaveArticle}
              disabled={isSavingArticle}
            >
              최종 버전 저장
            </Button>
          </>
        )}
        
        {/* 기사 버전 정보 - 버전이 있는 경우에만 표시 */}
        {articleVersions.length > 0 && (
          <>
            <h3 className="text-gray font-italic section-header mt-4">
              기사 버전 이력
            </h3>
            <hr className="divider-gray" />
            <div className="version-history">
              <ul className="list-group">
                {articleVersions.map((version, index) => (
                  <li 
                    key={version.id} 
                    className={`list-group-item ${currentVersionId === version.id ? 'active' : ''}`}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>버전 {articleVersions.length - index}</strong>
                        {currentVersionId === version.id && <span className="ms-2">(현재 버전)</span>}
                      </div>
                      <div className="text-muted small">
                        {new Date(version.timestamp).toLocaleString('ko-KR')}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
        
        {/* 기사 수정 확인 모달 - App.js에 직접 추가하는 방식 */}
        <Modal 
          show={showModifyConfirm} 
          onHide={() => handleConfirmModify(false)}
          backdrop="static"
          keyboard={false}
          centered
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>기사 수정 확인</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>생성된 기사를 수정하시겠습니까?</p>
            <div className="generated-article-preview mt-3 p-3" style={{ 
              maxHeight: '400px', 
              overflow: 'auto', 
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              backgroundColor: '#f8f9fa'
            }}>
              {currentArticle}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => handleConfirmModify(false)}>
              아니오
            </Button>
            <Button variant="primary" onClick={() => handleConfirmModify(true)}>
              예
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </>
  );
}

export default App;