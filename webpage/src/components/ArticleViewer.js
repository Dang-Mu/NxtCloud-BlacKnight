import React from 'react';
import ReactMarkdown from 'react-markdown';

const ArticleViewer = ({ content }) => {
  return (
    <div className="article-content">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};

export default ArticleViewer;