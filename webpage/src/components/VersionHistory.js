import React, { useState } from 'react';

const VersionHistory = ({ articleId }) => {
  // Mock version history data - would be fetched from API in a real app
  const mockHistory = [
    {
      version: 1,
      status: 'created',
      date: '2025-05-02 10:15:23',
      description: '최초 생성 버전',
      requirements: {
        organization: '00대학교',
        project: '2025 클라우드 AI 연구 프로젝트',
        company: '넥스트클라우드',
        keywords: '클라우드, AI, 빅데이터'
      }
    },
    {
      version: 2,
      status: 'updated',
      date: '2025-05-02 10:20:45',
      description: '첫 번째 수정 버전',
      modificationRequest: '총장님 이름을 추가해주세요'
    },
    {
      version: 3,
      status: 'finalized',
      date: '2025-05-02 11:05:18',
      description: '최종 확정 버전',
      modificationRequest: '행사 날짜와 장소를 명시해주세요'
    }
  ];
  
  const [compareVersions, setCompareVersions] = useState(false);
  const [version1, setVersion1] = useState(1);
  const [version2, setVersion2] = useState(3);

  // Function to get status class based on version status
  const getStatusClass = (status) => {
    switch (status) {
      case 'created':
        return 'status-created';
      case 'updated':
        return 'status-updated';
      case 'finalized':
        return 'status-finalized';
      default:
        return '';
    }
  };

  // Function to translate status to Korean
  const translateStatus = (status) => {
    switch (status) {
      case 'created':
        return '최초 생성';
      case 'updated':
        return '수정됨';
      case 'finalized':
        return '최종 확정';
      default:
        return status;
    }
  };

  // Mock function to compare versions (would be API call in real app)
  const compareArticleVersions = () => {
    // This would fetch actual diff data from an API
    return (
      <div className="diff-container">
        <div className="diff-header">
          <h4>버전 {version1}과 버전 {version2} 비교</h4>
        </div>
        <div className="diff-content">
          <div className="diff-deleted">삭제: 00대학교는 넥스트클라우드와 함께 2025 클라우드 AI 연구 프로젝트를 성공적으로 추진하고 있다.</div>
          <div className="diff-added">추가: 00대학교 김철수 총장은 넥스트클라우드와 함께 2025 클라우드 AI 연구 프로젝트를 성공적으로 추진하고 있다고 밝혔다.</div>
          <div className="diff-unchanged">변경 없음: 이번 프로젝트는 클라우드, AI, 빅데이터 등의 핵심 기술을 활용하여 혁신적인 솔루션을 개발하는 것을 목표로 한다.</div>
          <div className="diff-added">추가: 해당 행사는 2025년 6월 15일 00대학교 대강당에서 개최될 예정이다.</div>
        </div>
      </div>
    );
  };

  return (
    <div className="version-history">
      {mockHistory.map((item) => (
        <div key={item.version} className={`version-item ${getStatusClass(item.status)}`}>
          <div className="version-header">
            <span className="version-number">버전 {item.version}</span>
            <span className={`version-status ${getStatusClass(item.status)}`}>
              {translateStatus(item.status)}
            </span>
            <span className="version-date">{item.date}</span>
          </div>
          
          <div className="version-details">
            <p>{item.description}</p>
            
            {item.status === 'created' && item.requirements && (
              <div className="version-requirements">
                <h4>초기 요구사항:</h4>
                <ul>
                  <li>주최 기관: {item.requirements.organization}</li>
                  <li>프로젝트명: {item.requirements.project}</li>
                  <li>협력 업체: {item.requirements.company}</li>
                  <li>핵심 키워드: {item.requirements.keywords}</li>
                </ul>
              </div>
            )}
            
            {(item.status === 'updated' || item.status === 'finalized') && item.modificationRequest && (
              <div className="modification-request">
                <h4>수정 요청사항:</h4>
                <p>{item.modificationRequest}</p>
              </div>
            )}
          </div>
        </div>
      ))}
      
      {mockHistory.length >= 2 && (
        <div className="version-comparison">
          <div className="comparison-header">
            <button 
              className="btn btn-outline"
              onClick={() => setCompareVersions(!compareVersions)}
            >
              {compareVersions ? '비교 닫기' : '버전 비교하기'}
            </button>
          </div>
          
          {compareVersions && (
            <div className="comparison-content">
              <div className="comparison-selectors">
                <div className="form-group">
                  <label htmlFor="version1">첫 번째 버전</label>
                  <select 
                    id="version1" 
                    value={version1}
                    onChange={(e) => setVersion1(parseInt(e.target.value))}
                  >
                    {mockHistory.map(item => (
                      <option key={item.version} value={item.version}>
                        버전 {item.version}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="version2">두 번째 버전</label>
                  <select 
                    id="version2" 
                    value={version2}
                    onChange={(e) => setVersion2(parseInt(e.target.value))}
                  >
                    {mockHistory.map(item => (
                      <option key={item.version} value={item.version}>
                        버전 {item.version}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button className="btn btn-primary" onClick={compareArticleVersions}>
                  비교하기
                </button>
              </div>
              
              <div className="comparison-result">
                {compareArticleVersions()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VersionHistory;