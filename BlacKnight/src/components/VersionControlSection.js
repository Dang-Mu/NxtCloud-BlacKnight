// src/components/VersionControlSection.js
import React from "react";
import { Button, Card, ListGroup } from "react-bootstrap";

const VersionControlSection = ({
  versions,
  currentVersionIndex,
  onSelectVersion,
  onSaveCurrentVersion,
  isDisabled,
}) => {
  // 타임스탬프 포맷팅 함수
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // 버전 카드의 스타일
  const cardStyle = {
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
  };

  // 헤더 스타일
  const headerStyle = {
    background: "linear-gradient(135deg, #f5f7fa 0%, #e4e9f2 100%)",
    padding: "15px 20px",
    borderRadius: "10px 10px 0 0",
    borderBottom: "1px solid #e0e0e0",
  };

  // 버전 아이템 스타일
  const getListItemStyle = (isActive) => {
    return {
      transition: "all 0.2s ease",
      background: isActive ? "#e7f3ff" : "transparent",
      borderLeft: isActive ? "4px solid #0d6efd" : "4px solid transparent",
      padding: "12px 15px",
      cursor: "pointer",
    };
  };

  return (
    <div className="mb-5 mt-4">
      <h3 className="text-gray font-italic section-header">버전 관리</h3>
      <hr className="divider-gray" />

      <Card style={cardStyle}>
        <div
          style={headerStyle}
          className="d-flex justify-content-between align-items-center"
        >
          <div>
            <h5 className="mb-0 d-flex align-items-center">
              현재 버전:{" "}
              <span className="badge bg-primary ms-2 me-1">
                {currentVersionIndex + 1}
              </span>
              {versions[currentVersionIndex]?.isModified && (
                <span className="badge bg-info ms-1">수정됨</span>
              )}
            </h5>
          </div>
          <Button
            variant="outline-primary"
            onClick={onSaveCurrentVersion}
            disabled={isDisabled}
          >
            현재 버전 저장
          </Button>
        </div>

        <Card.Body style={{ padding: "0" }}>
          {versions.length > 0 ? (
            <ListGroup variant="flush">
              {versions.map((version, index) => (
                <ListGroup.Item
                  key={index}
                  action
                  onClick={() => onSelectVersion(index)}
                  disabled={isDisabled}
                  style={getListItemStyle(index === currentVersionIndex)}
                  className="border-bottom"
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold d-flex align-items-center">
                        <span
                          className={`badge ${
                            index === currentVersionIndex
                              ? "bg-primary"
                              : "bg-secondary"
                          } me-2`}
                        >
                          {index + 1}
                        </span>
                        {version.isModified ? "수정된 버전" : "원본 버전"}
                      </div>
                      {version.timestamp && (
                        <small className="text-muted">
                          {formatTimestamp(version.timestamp)}
                        </small>
                      )}
                    </div>
                    <div>
                      {version.isModified && (
                        <span
                          className="badge bg-info me-1"
                          style={{ fontSize: "0.8rem", padding: "5px 8px" }}
                        >
                          수정됨
                        </span>
                      )}
                      {index === currentVersionIndex && (
                        <span
                          className="badge bg-success"
                          style={{ fontSize: "0.8rem", padding: "5px 8px" }}
                        >
                          현재
                        </span>
                      )}
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <div className="text-center py-4 text-muted">
              <p className="mb-0">저장된 버전이 없습니다.</p>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default VersionControlSection;
