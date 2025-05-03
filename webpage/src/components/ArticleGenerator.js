import React, { useState, useEffect } from 'react';
import ArticleViewer from './ArticleViewer';
import VersionHistory from './VersionHistory';

const ArticleGenerator = ({ user }) => {
  const [pdfSource, setPdfSource] = useState('template');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [formData, setFormData] = useState({
    organization: '',
    project: '',
    company: '',
    keywords: '',
    additional: ''
  });
  const [article, setArticle] = useState('');
  const [previousArticle, setPreviousArticle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  const [modificationRequest, setModificationRequest] = useState('');
  const [modifiedArticle, setModifiedArticle] = useState('');
  const [diffHighlight, setDiffHighlight] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentVersion, setCurrentVersion] = useState(0);
  const [articleId, setArticleId] = useState(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  
  // Mock template list - would be fetched from API in a real app
  const templates = [
    { id: 1, name: '대학 보도자료 템플릿', filename: 'university_press.pdf' },
    { id: 2, name: '기업 행사 기사 템플릿', filename: 'corporate_event.pdf' },
    { id: 3, name: '연구 성과 발표 템플릿', filename: 'research_announcement.pdf' },
    { id: 4, name: '기술 제품 출시 템플릿', filename: 'product_launch.pdf' }
  ];

  // Initialize form with user's organization if available
  useEffect(() => {
    if (user && user.organization) {
      setFormData(prev => ({
        ...prev,
        organization: user.organization
      }));
    }
  }, [user]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
      setSuccessMessage(`파일이 성공적으로 업로드되었습니다: ${file.name}`);
    } else {
      setErrorMessage('PDF 파일만 업로드 가능합니다.');
      setUploadedFile(null);
    }
  };

  const validateForm = () => {
    if (!formData.organization || !formData.project || !formData.company || !formData.keywords) {
      setErrorMessage('모든 필수 필드(*)를 입력해주세요.');
      return false;
    }
    
    if (pdfSource === 'template' && !selectedTemplate) {
      setErrorMessage('템플릿을 선택해주세요.');
      return false;
    }
    
    if (pdfSource === 'upload' && !uploadedFile) {
      setErrorMessage('PDF 파일을 업로드해주세요.');
      return false;
    }
    
    return true;
  };

  const generateArticle = async () => {
    if (!validateForm()) return;
    
    setIsGenerating(true);
    setErrorMessage('');
    
    // Prepare reference information
    const referenceInfo = pdfSource === 'template' 
      ? `템플릿: ${selectedTemplate}` 
      : `업로드된 PDF: ${uploadedFile.name}`;

    try {
      // In a real app, this would be an API call to your Lambda function
      // Simulating API call with timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock article - in a real app this would come from the API
      const generatedArticle = generateMockArticle(formData);
      
      setPreviousArticle('');
      setArticle(generatedArticle);
      setCurrentVersion(1);
      setArticleId(Date.now().toString()); // Mock ID for this demo
      setSuccessMessage('흑기사가 초안 작성을 완료하였습니다.');
      
      // Clear modification-related states when generating a new article
      setModificationRequest('');
      setModifiedArticle('');
      setDiffHighlight('');
    } catch (error) {
      setErrorMessage('기사 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error('Error generating article:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const modifyArticle = async () => {
    if (!modificationRequest.trim()) {
      setErrorMessage('수정 요청 사항을 입력해주세요.');
      return;
    }
    
    if (!article) {
      setErrorMessage('수정할 기사가 없습니다. 먼저 기사를 생성해주세요.');
      return;
    }
    
    setIsModifying(true);
    setErrorMessage('');
    
    try {
      // In a real app, this would be an API call
      // Simulating API call with timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock modified article
      const modified = modifyMockArticle(article, modificationRequest);
      
      setPreviousArticle(article);
      setArticle(modified);
      setModifiedArticle(modified);
      
      // Generate mock diff highlight - in a real app this would be more sophisticated
      setDiffHighlight(generateMockDiffHighlight(article, modified));
      
      setSuccessMessage('흑기사가 수정을 완료했습니다.');
    } catch (error) {
      setErrorMessage('기사 수정 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error('Error modifying article:', error);
    } finally {
      setIsModifying(false);
    }
  };

  const finalizeArticle = () => {
    if (!article) {
      setErrorMessage('확정할 기사가 없습니다.');
      return;
    }
    
    // Update current version
    setCurrentVersion(prev => prev + 1);
    setSuccessMessage(`버전 ${currentVersion + 1}이(가) 저장되었습니다.`);
  };

  const downloadArticle = () => {
    if (!article) {
      setErrorMessage('다운로드할 기사가 없습니다.');
      return;
    }
    
    const element = document.createElement('a');
    const file = new Blob([article], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `article_v${currentVersion}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Mock article generation function
  const generateMockArticle = (data) => {
    const { organization, project, company, keywords, additional } = data;
    const keywordList = keywords.split(',').map(k => k.trim());
    
    return `# ${project} 성공적으로 진행 중
    
${organization}는 ${company}와 함께 ${project}를 성공적으로 추진하고 있다. 이번 프로젝트는 ${keywordList.join(', ')} 등의 핵심 기술을 활용하여 혁신적인 솔루션을 개발하는 것을 목표로 한다.

${organization}의 관계자는 "이번 프로젝트를 통해 우리 기관의 역량을 한 단계 더 발전시킬 수 있을 것으로 기대한다"고 밝혔다. ${company}의 대표는 "양 기관의 협력이 시너지를 발휘하여 좋은 결과를 가져올 것"이라고 말했다.

${additional ? additional + '\n\n' : ''}프로젝트의 첫 번째 단계는 이미 완료되었으며, 다음 단계는 내년 초에 시작될 예정이다. ${organization}와 ${company}는 앞으로도 지속적인 협력을 통해 혁신적인 성과를 창출해 나갈 계획이다.`;
  };

  // Mock article modification function
  const modifyMockArticle = (originalArticle, request) => {
    // Simple mock modification - in a real app this would call the API
    const lines = originalArticle.split('\n');
    let modified = originalArticle;
    
    // Add a new paragraph based on the modification request
    if (request.includes('추가')) {
      modified += `\n\n또한, ${request.replace('추가', '').trim()}`;
    }
    
    // Replace content if the request mentions "변경"
    if (request.includes('변경')) {
      // Find something to replace
      const target = request.split('변경')[0].trim();
      const replacement = request.split('변경')[1].trim();
      modified = modified.replace(target, replacement);
    }
    
    return modified;
  };

  // Mock diff highlight generation
  const generateMockDiffHighlight = (oldText, newText) => {
    if (oldText === newText) return '변경 사항이 없습니다.';
    
    // Get arrays of lines
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    
    // Find added lines (simplified)
    const addedLines = newLines.filter(line => !oldLines.includes(line));
    
    // Construct simple HTML diff
    let diffHtml = '<div class="diff-container">';
    
    if (addedLines.length > 0) {
      diffHtml += '<div><strong>추가된 내용:</strong></div>';
      addedLines.forEach(line => {
        diffHtml += `<div class="diff-added">추가: ${line}</div>`;
      });
    }
    
    // Check for modifications (very simplified approach)
    oldLines.forEach((oldLine, index) => {
      if (newLines[index] && oldLine !== newLines[index]) {
        diffHtml += '<div><strong>변경된 내용:</strong></div>';
        diffHtml += `<div class="diff-deleted">삭제: ${oldLine}</div>`;
        diffHtml += `<div class="diff-added">추가: ${newLines[index]}</div>`;
      }
    });
    
    diffHtml += '</div>';
    return diffHtml;
  };

  return (
    <div className="article-generator">
      <h1 className="page-title">BlackKnight <span>AI 기사 생성기</span></h1>
      <div className="chess-border"></div>

      {errorMessage && (
        <div className="alert alert-error">
          {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div className="alert alert-success">
          {successMessage}
        </div>
      )}
      
      <div className="grid grid-2">
        <div>
          <div className="card">
            <div className="card-header">
              <h2>PDF 소스 선택</h2>
            </div>
            
            <div className="form-group">
              <label>형식을 참고할 파일 소스를 선택하세요:</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="pdfSource"
                    value="template"
                    checked={pdfSource === 'template'}
                    onChange={() => setPdfSource('template')}
                  />
                  템플릿 활용
                </label>
                <label>
                  <input
                    type="radio"
                    name="pdfSource"
                    value="upload"
                    checked={pdfSource === 'upload'}
                    onChange={() => setPdfSource('upload')}
                  />
                  파일 업로드
                </label>
              </div>
            </div>
            
            {pdfSource === 'template' && (
              <div className="form-group">
                <label htmlFor="template">템플릿을 선택하세요:</label>
                <select
                  id="template"
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                >
                  <option value="">템플릿 선택...</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.filename}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {pdfSource === 'upload' && (
              <div className="form-group">
                <label htmlFor="pdfUpload">PDF 파일을 업로드하세요:</label>
                <input
                  type="file"
                  id="pdfUpload"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                />
                {uploadedFile && (
                  <div className="uploaded-file">
                    선택된 파일: {uploadedFile.name}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="card">
            <div className="card-header">
              <h2>요구사항 입력</h2>
            </div>
            
            <div className="form-group">
              <label htmlFor="organization">주최 기관/학교/조직/회사 이름 *</label>
              <input
                type="text"
                id="organization"
                name="organization"
                value={formData.organization}
                onChange={handleFormChange}
                placeholder="예: 00대학교"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="project">사업 또는 프로젝트 이름 *</label>
              <input
                type="text"
                id="project"
                name="project"
                value={formData.project}
                onChange={handleFormChange}
                placeholder="예: 2025 클라우드 AI 연구 프로젝트"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="company">협력 업체 또는 단체 이름 *</label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleFormChange}
                placeholder="예: 넥스트클라우드"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="keywords">핵심 키워드 *</label>
              <input
                type="text"
                id="keywords"
                name="keywords"
                value={formData.keywords}
                onChange={handleFormChange}
                placeholder="예: 인공지능, 빅데이터, 머신러닝"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="additional">기타 추가 내용</label>
              <textarea
                id="additional"
                name="additional"
                value={formData.additional}
                onChange={handleFormChange}
                placeholder="추가로 포함하고 싶은 내용을 자유롭게 작성해주세요."
                rows={4}
              />
            </div>
            
            <button
              className="btn btn-primary"
              onClick={generateArticle}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <div className="loading-inline">
                  <span className="spinner-small"></span> 생성 중...
                </div>
              ) : (
                '기사 생성'
              )}
            </button>
          </div>
        </div>
        
        <div>
          {article ? (
            <div className="card article-container">
              <div className="card-header">
                <h2>생성된 기사</h2>
                <div className="actions">
                  {currentVersion > 0 && (
                    <span className="version-badge">버전 {currentVersion}</span>
                  )}
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={downloadArticle}
                  >
                    다운로드
                  </button>
                </div>
              </div>
              
              <ArticleViewer content={article} />
            </div>
          ) : (
            <div className="card article-placeholder">
              <div className="card-header">
                <h2>생성된 기사</h2>
              </div>
              <div className="placeholder-content">
                <p>기사를 생성하면 여기에 표시됩니다.</p>
              </div>
            </div>
          )}
          
          {article && (
            <div className="card">
              <div className="card-header">
                <h2>수정 요청</h2>
              </div>
              
              <div className="form-group">
                <label htmlFor="modificationRequest">수정 요청 사항을 입력하세요:</label>
                <textarea
                  id="modificationRequest"
                  value={modificationRequest}
                  onChange={(e) => setModificationRequest(e.target.value)}
                  placeholder="어떤 부분을 수정하고 싶으신가요? 예: '첫 문단에 00총장님 이름을 추가해주세요'"
                  rows={4}
                />
              </div>
              
              <button
                className="btn btn-primary"
                onClick={modifyArticle}
                disabled={isModifying}
              >
                {isModifying ? (
                  <div className="loading-inline">
                    <span className="spinner-small"></span> 수정 중...
                  </div>
                ) : (
                  '수정 요청'
                )}
              </button>
            </div>
          )}
          
          {previousArticle && diffHighlight && (
            <div className="card">
              <div className="card-header">
                <h2>변경 사항</h2>
              </div>
              <div 
                className="diff-highlight"
                dangerouslySetInnerHTML={{ __html: diffHighlight }}
              />
              
              <div className="form-actions">
                <button
                  className="btn btn-primary"
                  onClick={finalizeArticle}
                >
                  수정된 기사로 확정
                </button>
              </div>
            </div>
          )}
          
          {articleId && (
            <div className="card">
              <div className="card-header">
                <h2>버전 히스토리</h2>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowVersionHistory(!showVersionHistory)}
                >
                  {showVersionHistory ? '닫기' : '보기'}
                </button>
              </div>
              
              {showVersionHistory && <VersionHistory articleId={articleId} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleGenerator;