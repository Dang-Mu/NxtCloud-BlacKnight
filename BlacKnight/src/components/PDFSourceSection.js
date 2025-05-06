// src/components/PDFSourceSection.js
import React, { useState, useEffect } from "react";
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
  const PDF_LAMBDA_URL = process.env.REACT_APP_PDF_SOURCE_LAMBDA_URL;

  // 템플릿 목록 가져오기
  useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  }, [user]);

  const fetchTemplates = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${PDF_LAMBDA_URL}?action=listTemplates`,
        {
          headers: {
            Authorization: user.id, // 사용자 ID만 전송
          },
        }
      );

      setTemplateList(response.data.templates || []);
    } catch (err) {
      // console.error("템플릿 목록을 가져오는 중 오류 발생:", err);
      // setError("템플릿 목록을 가져오는 데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  // 템플릿 선택 처리
  const handleTemplateSelect = async (fileId) => {
    if (!fileId) return;

    setSelectedTemplate(fileId);
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${PDF_LAMBDA_URL}?action=getTemplate&fileId=${encodeURIComponent(
          fileId
        )}`,
        {
          headers: {
            Authorization: user.id, // 사용자 ID만 전송
          },
        }
      );

      onSetPdfContent(response.data.url, response.data.metadata);
    } catch (err) {
      console.error("템플릿을 가져오는 중 오류 발생:", err);
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
      const presignedResponse = await axios.get(
        `${PDF_LAMBDA_URL}?action=getPresignedUrl&fileName=${encodeURIComponent(
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

      // pre-signed URL을 사용하여 S3에 직접 업로드
      await axios.put(uploadUrl, uploadedFile, {
        headers: {
          "Content-Type": uploadedFile.type,
        },
      });

      // 파일 메타데이터를 DynamoDB에 저장
      await axios.post(
        `${PDF_LAMBDA_URL}?action=saveFileMetadata`,
        fileMetadata,
        {
          headers: {
            Authorization: user.id, // 사용자 ID만 전송
            "Content-Type": "application/json",
          },
        }
      );

      // 업로드 성공 후 파일 URL 가져오기
      const getFileResponse = await axios.get(
        `${PDF_LAMBDA_URL}?action=getUploadedFile&fileId=${encodeURIComponent(
          fileMetadata.fileId
        )}`,
        {
          headers: {
            Authorization: user.id, // 사용자 ID만 전송
          },
        }
      );

      onSetPdfContent(getFileResponse.data.url, getFileResponse.data.metadata);
      setSuccessMessage("파일이 성공적으로 업로드되었습니다!");

      // 파일 목록 새로고침
      if (pdfSource === "기존 템플릿 활용") {
        fetchTemplates();
      }
    } catch (err) {
      console.error("파일 업로드 중 오류 발생:", err);
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
        `${PDF_LAMBDA_URL}?action=deleteFile&fileId=${encodeURIComponent(
          fileId
        )}`,
        {
          headers: {
            Authorization: user.id, // 사용자 ID만 전송
          },
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
      console.error("파일 삭제 중 오류 발생:", err);
      setError("파일 삭제에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h3 className="text-gray font-italic section-header">PDF 소스 선택</h3>
      <hr className="divider-gray" />

      {error && <Alert variant="danger">{error}</Alert>}
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
                onChange={(e) => setPdfSource(e.target.value)}
              />
              <Form.Check
                type="radio"
                label="파일 업로드"
                name="pdfSource"
                value="파일 업로드"
                checked={pdfSource === "파일 업로드"}
                onChange={(e) => setPdfSource(e.target.value)}
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
                      <span className="sr-only">로딩 중...</span>
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
                              {template.description}
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
