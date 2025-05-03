// src/components/PDFSourceSection.js
import React, { useState, useEffect } from "react";
import { Form } from "react-bootstrap";

const PDFSourceSection = ({ onSetPdfContent }) => {
  const [pdfSource, setPdfSource] = useState("템플릿 활용");
  const [templateList, setTemplateList] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);

  // 템플릿 목록 가져오기 (백엔드 통합 시 API 호출로 변경)
  useEffect(() => {
    // 여기서는 예시 템플릿 목록 사용
    setTemplateList(["템플릿1.pdf", "템플릿2.pdf", "템플릿3.pdf"]);
  }, []);

  // 템플릿 선택 처리
  const handleTemplateSelect = (e) => {
    const template = e.target.value;
    setSelectedTemplate(template);
    onSetPdfContent(`템플릿 PDF: ${template}`);
  };

  // 파일 업로드 처리
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      onSetPdfContent(`업로드된 PDF: ${file.name}`);
    }
  };

  return (
    <>
      <h3 className="text-gray font-italic section-header">PDF 소스 선택</h3>
      <hr className="divider-gray" />

      <Form>
        <Form.Group>
          <Form.Check
            type="radio"
            label="템플릿 활용"
            name="pdfSource"
            value="템플릿 활용"
            checked={pdfSource === "템플릿 활용"}
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

        {pdfSource === "템플릿 활용" ? (
          <Form.Group>
            <Form.Label>템플릿을 선택하세요:</Form.Label>
            <Form.Control
              as="select"
              value={selectedTemplate}
              onChange={handleTemplateSelect}
            >
              <option value="">선택하세요</option>
              {templateList.map((template, index) => (
                <option key={index} value={template}>
                  {template}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
        ) : (
          <Form.Group>
            <Form.Label>PDF 파일을 업로드하세요</Form.Label>
            <Form.Control
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
            />
          </Form.Group>
        )}
      </Form>
    </>
  );
};

export default PDFSourceSection;
