// src/components/PDFSourceSection.js
import React, { useState, useEffect, useCallback } from "react";
import { Form, Button, Alert, Card, Badge, Row, Col } from "react-bootstrap";
import axios from "axios";

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

  // API 엔드포인트
  const GET_PDF_LAMBDA_URL = process.env.REACT_APP_GET_PDF_SOURCE_LAMBDA_URL;
  const PUT_PDF_LAMBDA_URL = process.env.REACT_APP_PUT_PDF_SOURCE_LAMBDA_URL;

  // fetchTemplates 함수를 useCallback으로 메모이제이션하여 불필요한 재생성 방지
  const fetchTemplates = useCallback(async () => {
    if (!user) {
      window.console.warn("fetchTemplates: 사용자 정보가 없어 요청 중단");
      return;
    }

    window.console.warn(
      `fetchTemplates: 사용자 ID ${user.id}로 템플릿 목록 요청 시작`
    );
    setLoading(true);
    setError(null);

    try {
      window.console.warn(
        `API 호출: ${GET_PDF_LAMBDA_URL}?action=listTemplates`
      );
      const response = await axios.get(
        `${GET_PDF_LAMBDA_URL}?action=listTemplates`,
        {
          headers: {
            authorization: user.id, // 사용자 ID만 전송
          },
        }
      );

      window.console.warn("템플릿 목록 응답 받음:", response.data);
      setTemplateList(response.data.templates || []);
      window.console.warn(
        `${response.data.templates?.length || 0}개의 템플릿을 받았습니다`
      );
    } catch (err) {
      window.console.error("템플릿 목록을 가져오는 중 오류 발생:", err);
      // 파일 업로드 탭에서는 에러 메시지를 표시하지 않음
      if (pdfSource === "기존 템플릿 활용") {
        setError("템플릿 목록을 가져오는 데 실패했습니다");
      }
    } finally {
      setLoading(false);
      window.console.warn("템플릿 목록 가져오기 완료");
    }
  }, [user, GET_PDF_LAMBDA_URL, pdfSource]);

  // 템플릿 목록 가져오기
  useEffect(() => {
    if (user) {
      window.console.warn("사용자 정보 확인됨, 템플릿 목록 가져오기 시작");
      fetchTemplates();
    } else {
      window.console.warn("사용자 정보 없음, 템플릿 목록 가져오기 건너뜀");
    }
  }, [user, fetchTemplates]); // eslint-disable-line react-hooks/exhaustive-deps

  // 템플릿 선택 처리
  const handleTemplateSelect = async (fileId) => {
    if (!fileId) {
      window.console.warn("handleTemplateSelect: fileId가 없어 요청 중단");
      return;
    }

    window.console.warn(
      `handleTemplateSelect: 템플릿 선택 - fileId: ${fileId}`
    );
    setSelectedTemplate(fileId);
    setLoading(true);
    setError(null);

    try {
      window.console.warn(
        `API 호출: ${GET_PDF_LAMBDA_URL}?action=getTemplate&fileId=${encodeURIComponent(
          fileId
        )}`
      );
      const response = await axios.get(
        `${GET_PDF_LAMBDA_URL}?action=getTemplate&fileId=${encodeURIComponent(
          fileId
        )}`,
        {
          headers: {
            authorization: user.id, // 사용자 ID만 전송
          },
        }
      );

      window.console.warn("템플릿 데이터 응답 받음:", response.data);
      onSetPdfContent(response.data.url, response.data.metadata);
      window.console.warn("템플릿 URL 설정됨:", response.data.url);
    } catch (err) {
      window.console.error("템플릿을 가져오는 중 오류 발생:", err);
      setError("템플릿을 가져오는 데 실패했습니다");
    } finally {
      setLoading(false);
      window.console.warn("템플릿 선택 처리 완료");
    }
  };

  // 파일 업로드 처리
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 직접적인 DOM 접근을 통한 콘솔 출력
      window.console.warn(
        `파일 선택됨: ${file.name}, 크기: ${file.size} 바이트, 타입: ${file.type}`
      );
      setUploadedFile(file);

      // 파일 선택 시 에러 메시지 초기화
      setError(null);
    } else {
      window.console.warn("파일 선택이 취소됨");
    }
  };

  // 파일 업로드 제출
  const handleSubmitUpload = async () => {
    if (!uploadedFile) {
      window.console.warn("handleSubmitUpload: 업로드할 파일이 선택되지 않음");
      setError("업로드할 파일을 선택해주세요");
      return;
    }

    window.console.warn(`파일 업로드 시작: ${uploadedFile.name}`);
    setLoading(true);
    setError(null);
    setSuccessMessage("");

    try {
      // 파일 업로드를 위한 pre-signed URL 요청
      window.console.warn("Pre-signed URL 요청 중...");
      window.console.warn(
        `파일 설명: ${fileDescription}, 공유 설정: ${isPublic}`
      );

      const presignedResponse = await axios.get(
        `${PUT_PDF_LAMBDA_URL}?action=getPresignedUrl&fileName=${encodeURIComponent(
          uploadedFile.name
        )}&fileType=upload&isPublic=${isPublic}&description=${encodeURIComponent(
          fileDescription
        )}`,
        {
          headers: {
            Authorization: user.id, // 사용자 ID만 전송
          },
        }
      );

      const { uploadUrl, fileMetadata } = presignedResponse.data;
      window.console.warn("Pre-signed URL 받음:", uploadUrl);
      window.console.warn("파일 메타데이터:", fileMetadata);

      // pre-signed URL을 사용하여 S3에 직접 업로드
      window.console.warn("S3에 파일 업로드 중...");
      await axios.put(uploadUrl, uploadedFile, {
        headers: {
          "Content-Type": uploadedFile.type,
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          window.console.warn(`업로드 진행률: ${percentCompleted}%`);
        },
      });
      window.console.warn("S3 업로드 완료");

      // 파일 메타데이터를 DynamoDB에 저장
      window.console.warn("DynamoDB에 메타데이터 저장 중...");
      await axios.post(
        `${PUT_PDF_LAMBDA_URL}?action=saveFileMetadata`,
        fileMetadata,
        {
          headers: {
            Authorization: user.id, // 사용자 ID만 전송
            "Content-Type": "application/json",
          },
        }
      );
      window.console.warn("메타데이터 저장 완료");

      // 업로드 성공 후 파일 URL 가져오기
      window.console.warn(
        `업로드된 파일 정보 가져오기: ${fileMetadata.fileId}`
      );
      const getFileResponse = await axios.get(
        `${PUT_PDF_LAMBDA_URL}?action=getUploadedFile&fileId=${encodeURIComponent(
          fileMetadata.fileId
        )}`,
        {
          headers: {
            authorization: user.id, // 사용자 ID만 전송
          },
        }
      );

      window.console.warn("업로드된 파일 URL:", getFileResponse.data.url);
      onSetPdfContent(getFileResponse.data.url, getFileResponse.data.metadata);
      setSuccessMessage("파일이 성공적으로 업로드되었습니다!");

      // 파일 목록 새로고침
      if (pdfSource === "기존 템플릿 활용") {
        window.console.warn("템플릿 목록 새로고침");
        fetchTemplates();
      }
    } catch (err) {
      window.console.error("파일 업로드 중 오류 발생:", err);
      if (err.response) {
        window.console.error("서버 응답:", err.response.data);
      }
      setError("파일 업로드에 실패했습니다");
    } finally {
      setLoading(false);
      window.console.warn("파일 업로드 프로세스 완료");
    }
  };

  // 파일 삭제 처리
  const handleDeleteFile = async (fileId) => {
    if (!window.confirm("정말로 이 파일을 삭제하시겠습니까?")) {
      window.console.warn("파일 삭제 취소됨");
      return;
    }

    window.console.warn(`파일 삭제 시작: fileId = ${fileId}`);
    setLoading(true);
    setError(null);

    try {
      window.console.warn(
        `API 호출: ${PUT_PDF_LAMBDA_URL}?action=deleteFile&fileId=${encodeURIComponent(
          fileId
        )}`
      );
      await axios.delete(
        `${PUT_PDF_LAMBDA_URL}?action=deleteFile&fileId=${encodeURIComponent(
          fileId
        )}`,
        {
          headers: {
            authorization: user.id, // 사용자 ID만 전송
          },
        }
      );

      window.console.warn("파일 삭제 성공");
      setSuccessMessage("파일이 성공적으로 삭제되었습니다");

      // 선택된 템플릿이 삭제된 파일인 경우 선택 해제
      if (selectedTemplate === fileId) {
        window.console.warn(
          "삭제된 파일이 현재 선택된 템플릿이었으므로 선택 해제"
        );
        setSelectedTemplate("");
        onSetPdfContent("", null);
      }

      // 파일 목록 새로고침
      window.console.warn("파일 삭제 후 템플릿 목록 새로고침");
      fetchTemplates();
    } catch (err) {
      window.console.error("파일 삭제 중 오류 발생:", err);
      if (err.response) {
        window.console.error("서버 응답:", err.response.data);
      }
      setError("파일 삭제에 실패했습니다");
    } finally {
      setLoading(false);
      window.console.warn("파일 삭제 프로세스 완료");
    }
  };

  // 소스 변경 처리
  const handleSourceChange = (value) => {
    window.console.warn(`소스 변경: ${value}`);

    // 소스 변경 시 에러 메시지 초기화
    setError(null);
    setPdfSource(value);

    // 만약 '기존 템플릿 활용'으로 변경되면 템플릿 목록 새로고침
    if (value === "기존 템플릿 활용") {
      fetchTemplates();
    }
  };

  // 컴포넌트 렌더링 시 로그
  window.console.warn("PDFSourceSection 렌더링 - 현재 상태:", {
    로그인상태: !!user,
    선택된소스: pdfSource,
    템플릿수: templateList.length,
    선택된템플릿: selectedTemplate,
    업로드파일: uploadedFile ? uploadedFile.name : "없음",
    로딩중: loading,
  });

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
                    onClick={() => {
                      window.console.warn("템플릿 목록 새로고침 버튼 클릭");
                      fetchTemplates();
                    }}
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
                          onClick={() => {
                            window.console.warn(
                              `템플릿 카드 클릭: ${template.fileName}`
                            );
                            handleTemplateSelect(template.fileId);
                          }}
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
                                    window.console.warn(
                                      `삭제 버튼 클릭: ${template.fileName}`
                                    );
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
                    onChange={(e) => {
                      window.console.warn(`파일 설명 변경: ${e.target.value}`);
                      setFileDescription(e.target.value);
                    }}
                    disabled={loading}
                  />
                </Form.Group>

                <Form.Group className="mt-3">
                  <Form.Check
                    type="checkbox"
                    label="조직 내 공유 (같은 소속의 다른 사용자에게 공개)"
                    checked={isPublic}
                    onChange={(e) => {
                      window.console.warn(
                        `공유 설정 변경: ${e.target.checked}`
                      );
                      setIsPublic(e.target.checked);
                    }}
                    disabled={loading}
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  className="mt-3"
                  onClick={() => {
                    window.console.warn("파일 업로드 버튼 클릭");
                    handleSubmitUpload();
                  }}
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
