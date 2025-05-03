// src/utils/textUtils.js
import { saveAs } from "file-saver";

// 텍스트 파일 저장 함수
export const saveArticle = (text, filename) => {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  saveAs(blob, filename);
};

// 텍스트 변경 내용 하이라이트 함수
export const highlightChanges = (oldText, newText) => {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  let result = "";

  // 라인별 비교 및 하이라이트 적용
  const diffResult = diff(oldLines, newLines);

  diffResult.forEach((line) => {
    if (line.removed) {
      result += `<div style="background-color: #444444; color: #ffdddd">${line.value}</div>`;
    } else if (line.added) {
      result += `<div style="background-color: #444444; color: #ddffdd">${line.value}</div>`;
    } else {
      result += `${line.value}<br>`;
    }
  });

  return result;
};

// 간단한 diff 알고리즘 구현
const diff = (oldLines, newLines) => {
  const result = [];

  // 최대 라인 수
  const maxLines = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < maxLines; i++) {
    // 이전 텍스트에만 있는 라인
    if (i >= newLines.length) {
      result.push({ removed: true, value: oldLines[i] });
    }
    // 새 텍스트에만 있는 라인
    else if (i >= oldLines.length) {
      result.push({ added: true, value: newLines[i] });
    }
    // 내용이 다른 라인
    else if (oldLines[i] !== newLines[i]) {
      result.push({ removed: true, value: oldLines[i] });
      result.push({ added: true, value: newLines[i] });
    }
    // 변경 없는 라인
    else {
      result.push({ value: oldLines[i] });
    }
  }

  return result;
};
