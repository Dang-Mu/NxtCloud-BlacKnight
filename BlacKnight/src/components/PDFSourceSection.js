import React, { useState, useEffect, useCallback, useRef } from "react";
import { Form, Button, Alert, Card, Badge, Row, Col } from "react-bootstrap";
import axios from "axios";

// 프로덕션 환경에서는 로깅 비활성화
const logger = {
  log: process.env.NODE_ENV === "production" ? () => {} : console.log,
  warn: process.env.NODE_ENV === "production" ? () => {} : console.warn,
  error: process.env.NODE_ENV === "production" ? () => {} : console.error,
};

// 환경 변수를 직접 참조하지 않고 서비스 객체 사용
const pdfService = {
  // API 엔드포인트를 빌드 시점에 환경 변수에서 가져오고 런타임에는 직접 참조하지 않음
  apiEndpoints: {
    get: process.env.REACT_APP_GET_PDF_SOURCE_LAMBDA_URL || "/api/pdf/get",
    put: process.env.REACT_APP_PUT_PDF_SOURCE_LAMBDA_URL || "/api/pdf/put",
  },
};

// Props로 user와 함께 onSetPdfContent 함수 전달받음
const PDFSourceSection = ({ user, onSetPdfContent }) => {
  const [pdfSource, setPdfSource] = useState("기존 템플릿 활용");
  const [templateList, setTemplateList] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileDescription, setFileDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // 파일 입력 요소에 대한 ref 생성
  const fileInputRef = useRef(null);

  // 파일 상태 초기화 함수
  const resetFileState = () => {
    setUploadedFile(null);
    setFileDescription("");
    setIsPublic(false);

    // 파일 input 요소 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 사용자 인증 헤더 생성 - 토큰 기반 인증 사용
  const getAuthHeaders = useCallback(() => {
    if (!user) return {};
    // 사용자 ID를 직접 전송하지 않고 토큰 사용
    return {
      authorization: user.token || user.id, // 토큰 우선, 토큰 없을 경우 ID 사용
    };
  }, [user]);

  // fetchTemplates 함수를 useCallback으로 메모이제이션하여 불필요한 재생성 방지
  const fetchTemplates = useCallback(async () => {
    if (!user) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${pdfService.apiEndpoints.get}?action=listTemplates`,
        {
          headers: getAuthHeaders(),
        }
      );

      setTemplateList(response.data.templates || []);
    } catch (err) {
      // 프로덕션에서만 에러 로깅 최소화
      if (process.env.NODE_ENV !== "production") {
        logger.error("템플릿 목록을 가져오는 중 오류 발생");
      }

      // 파일 업로드 탭에서는 에러 메시지를 표시하지 않음
      if (pdfSource === "기존 템플릿 활용") {
        setError("템플릿 목록을 가져오는 데 실패했습니다");
      }
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders, pdfSource]);

  // 템플릿 목록 가져오기
  useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  }, [user, fetchTemplates]);

  // 템플릿 선택 처리
  const handleTemplateSelect = async (fileId) => {
    if (!fileId) {
      return;
    }

    setSelectedTemplate(fileId);
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${
          pdfService.apiEndpoints.get
        }?action=getTemplate&fileId=${encodeURIComponent(fileId)}`,
        {
          headers: getAuthHeaders(),
        }
      );

      onSetPdfContent(response.data.url, response.data.metadata);
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        logger.error("템플릿을 가져오는 중 오류 발생");
      }
      setError("템플릿을 가져오는 데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  // 파일 업로드 처리
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      // 파일 선택 시 에러 메시지 초기화
      setError(null);
    } else {
      setUploadedFile(null); // 파일 선택 취소 시에도 상태 초기화
    }
  };

  // 파일 업로드 제출
  const handleSubmitUpload = async () => {
    if (!uploadedFile) {
      setError("업로드할 파일을 선택해주세요");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage("");

    try {
      // 파일 업로드를 위한 pre-signed URL 요청
      const presignedResponse = await axios({
        method: "GET",
        url: `${
          pdfService.apiEndpoints.put
        }?action=getPresignedUrl&method=GET&fileName=${encodeURIComponent(
          uploadedFile.name
        )}&fileType=upload&isPublic=${isPublic}&description=${encodeURIComponent(
          fileDescription
        )}`,
        headers: getAuthHeaders(),
      });

      const { uploadUrl, fileMetadata } = presignedResponse.data;

      // pre-signed URL을 사용하여 S3에 직접 업로드
      await axios.put(uploadUrl, uploadedFile, {
        headers: {
          "Content-Type": uploadedFile.type,
        },
      });

      // 파일 메타데이터를 DynamoDB에 저장
      await axios({
        method: "POST",
        url: `${pdfService.apiEndpoints.put}?action=saveFileMetadata&method=POST`,
        data: fileMetadata,
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
      });

      // 업로드 성공 후 파일 URL 가져오기
      const getFileResponse = await axios({
        method: "GET",
        url: `${
          pdfService.apiEndpoints.put
        }?action=getUploadedFile&method=GET&fileId=${encodeURIComponent(
          fileMetadata.fileId
        )}`,
        headers: getAuthHeaders(),
      });

      onSetPdfContent(getFileResponse.data.url, getFileResponse.data.metadata);
      setSuccessMessage("파일이 성공적으로 업로드되었습니다!");

      // 중요: 업로드 성공 후 파일 상태 초기화
      resetFileState();

      // 파일 목록 새로고침
      fetchTemplates();
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        logger.error("파일 업로드 중 오류 발생");
      }
      setError("파일 업로드에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  // 파일 삭제 처리
  const handleDeleteFile = async (fileId) => {
    if (!window.confirm("정말로 이 파일을 삭제하시겠습니까?")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await axios.delete(
        `${
          pdfService.apiEndpoints.put
        }?action=deleteFile&fileId=${encodeURIComponent(fileId)}`,
        {
          headers: getAuthHeaders(),
        }
      );

      setSuccessMessage("파일이 성공적으로 삭제되었습니다");

      // 선택된 템플릿이 삭제된 파일인 경우 선택 해제
      if (selectedTemplate === fileId) {
        setSelectedTemplate("");
        onSetPdfContent("", null);
      }

      // 파일 목록 새로고침
      fetchTemplates();
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        logger.error("파일 삭제 중 오류 발생");
      }
      setError("파일 삭제에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  // 소스 변경 처리
  const handleSourceChange = (value) => {
    // 소스 변경 시 기본 상태 초기화
    setError(null);
    setSuccessMessage("");

    // 이전 소스와 새 소스가 다를 때만 상태 초기화 처리
    if (pdfSource !== value) {
      // 소스 변경 시 항상 파일 관련 상태 초기화
      resetFileState();

      // 새 소스 설정
      setPdfSource(value);

      // 기존 템플릿으로 변경 시 템플릿 목록 새로고침
      if (value === "기존 템플릿 활용") {
        fetchTemplates();
      }
    } else {
      // 같은 소스를 다시 선택한 경우 소스만 재설정
      setPdfSource(value);
    }
  };

  return (
    <>
      <h3 className="text-gray font-italic section-header">PDF 소스 선택</h3>
      <hr className="divider-gray" />

      {error && pdfSource === "기존 템플릿 활용" && (
        <Alert variant="danger">{error}</Alert>
      )}
      {error && pdfSource === "파일 업로드" && uploadedFile === null && (
        <Alert variant="danger">{error}</Alert>
      )}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {!user ? (
        <Alert variant="warning">
          PDF 파일 관리를 위해 로그인이 필요합니다.
        </Alert>
      ) : (
        <>
          <Form>
            <Form.Group>
              <Form.Check
                type="radio"
                label="기존 템플릿 활용"
                name="pdfSource"
                value="기존 템플릿 활용"
                checked={pdfSource === "기존 템플릿 활용"}
                onChange={(e) => handleSourceChange(e.target.value)}
              />
              <Form.Check
                type="radio"
                label="파일 업로드"
                name="pdfSource"
                value="파일 업로드"
                checked={pdfSource === "파일 업로드"}
                onChange={(e) => handleSourceChange(e.target.value)}
              />
            </Form.Group>

            {pdfSource === "기존 템플릿 활용" ? (
              <div className="template-container mt-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>사용 가능한 템플릿</h5>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={fetchTemplates}
                    disabled={loading}
                  >
                    <i className="fa fa-refresh"></i> 새로고침
                  </Button>
                </div>

                {loading ? (
                  <div className="text-center py-3">
                    <div className="spinner-border text-primary" role="status">
                      <span className="sr-only">...</span>
                    </div>
                  </div>
                ) : templateList.length === 0 ? (
                  <Alert variant="info">
                    사용 가능한 템플릿이 없습니다. 파일을 업로드하여 템플릿을
                    추가하세요.
                  </Alert>
                ) : (
                  <Row>
                    {templateList.map((template) => (
                      <Col md={6} lg={4} key={template.fileId} className="mb-3">
                        <Card
                          className={`template-card ${
                            selectedTemplate === template.fileId
                              ? "border-primary"
                              : ""
                          }`}
                          onClick={() => handleTemplateSelect(template.fileId)}
                        >
                          <Card.Body>
                            <div className="d-flex justify-content-between">
                              <Card.Title className="h6 mb-2">
                                {template.fileName}
                              </Card.Title>
                              {template.isOwner && (
                                <Button
                                  variant="light"
                                  size="sm"
                                  className="p-0 px-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFile(template.fileId);
                                  }}
                                >
                                  <i className="fa fa-trash text-danger"></i>
                                </Button>
                              )}
                            </div>
                            <Card.Text className="small text-muted mb-1">
                              {template.description || "설명 없음"}
                            </Card.Text>
                            <div className="d-flex justify-content-between align-items-center">
                              <small className="text-muted">
                                {new Date(
                                  template.createdAt
                                ).toLocaleDateString()}
                              </small>
                              {template.isPublic && (
                                <Badge bg="info" pill>
                                  공유됨
                                </Badge>
                              )}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </div>
            ) : (
              <div className="upload-container mt-3">
                <Form.Group>
                  <Form.Label>PDF 파일을 업로드하세요</Form.Label>
                  <Form.Control
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                    disabled={loading}
                  />
                </Form.Group>

                <Form.Group className="mt-3">
                  <Form.Label>파일 설명</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="파일에 대한 설명을 입력하세요"
                    value={fileDescription}
                    onChange={(e) => setFileDescription(e.target.value)}
                    disabled={loading}
                  />
                </Form.Group>

                <Form.Group className="mt-3">
                  <Form.Check
                    type="checkbox"
                    label="조직 내 공유 (같은 소속의 다른 사용자에게 공개)"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    disabled={loading}
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  className="mt-3"
                  onClick={handleSubmitUpload}
                  disabled={!uploadedFile || loading}
                >
                  {loading ? "업로드 중..." : "업로드"}
                </Button>
              </div>
            )}
          </Form>
        </>
      )}
    </>
  );
};

export default PDFSourceSection;
