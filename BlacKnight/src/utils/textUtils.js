// src/utils/textUtils.js

// 간단한 브라우저 내장 다운로드 방식으로 구현
export const saveArticle = (content, filename) => {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  // 다운로드 링크 생성 및 클릭
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  // 정리
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
};

// 텍스트 차이 하이라이트 함수
export const highlightChanges = (oldText, newText) => {
  // 간단한 구현: 단어 단위로 텍스트 비교
  const oldWords = oldText.split(/\s+/);
  const newWords = newText.split(/\s+/);

  let result = "";
  let i = 0;
  let j = 0;

  // 텍스트가 너무 길면 첫 부분만 비교
  const maxWords = 300;

  while (
    i < Math.min(oldWords.length, maxWords) &&
    j < Math.min(newWords.length, maxWords)
  ) {
    if (oldWords[i] === newWords[j]) {
      // 일치하는 단어는 그대로 표시
      result += newWords[j] + " ";
      i++;
      j++;
    } else {
      // 불일치하는 부분 찾기
      let found = false;

      // 삭제된 단어 찾기 (최대 3단어 전방 탐색)
      for (let k = 1; k <= 3 && i + k < oldWords.length; k++) {
        if (oldWords[i + k] === newWords[j]) {
          // 삭제된 단어들 (빨간색 취소선)
          for (let l = 0; l < k; l++) {
            result += `<span style="color: red; text-decoration: line-through">${
              oldWords[i + l]
            }</span> `;
          }
          i += k;
          found = true;
          break;
        }
      }

      if (!found) {
        // 추가된 단어 찾기 (최대 3단어 전방 탐색)
        for (let k = 1; k <= 3 && j + k < newWords.length; k++) {
          if (newWords[j + k] === oldWords[i]) {
            // 추가된 단어들 (녹색)
            for (let l = 0; l < k; l++) {
              result += `<span style="color: green; font-weight: bold">${
                newWords[j + l]
              }</span> `;
            }
            j += k;
            found = true;
            break;
          }
        }
      }

      if (!found) {
        // 변경된 단어 (노란색 배경)
        result += `<span style="color: blue; font-weight: bold">${newWords[j]}</span> `;
        i++;
        j++;
      }
    }
  }

  // 남은 단어 처리
  while (j < Math.min(newWords.length, maxWords)) {
    result += `<span style="color: green; font-weight: bold">${newWords[j]}</span> `;
    j++;
  }

  // 너무 긴 텍스트는 일부분만 표시
  if (newWords.length > maxWords) {
    result += "... (차이점 하이라이트는 처음 300단어만 표시됩니다)";
  }

  return result;
};
