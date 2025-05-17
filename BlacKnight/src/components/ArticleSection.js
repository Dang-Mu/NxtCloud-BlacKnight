// src/components/ArticleSection.js
import React from "react";
import { Alert, Button } from "react-bootstrap";
import { saveArticle } from "../utils/textUtils";

const ArticleSection = ({ article, isDisabled }) => {
  return (
    <>
      <h3 className="text-gray font-italic section-header">생성된 기사</h3>
      <hr className="divider-gray" />

      {article ? (
        <>
          <div className="article-container">{article}</div>
          <Button
            variant="outline-secondary"
            onClick={() => saveArticle(article, "generated_article.txt")}
            className="mt-3"
            disabled={isDisabled} // 작업 중일 때 비활성화
          >
            기사 다운로드
          </Button>
        </>
      ) : (
        <Alert variant="info">기사를 생성하면 여기에 표시됩니다.</Alert>
      )}
    </>
  );
};

export default ArticleSection;
