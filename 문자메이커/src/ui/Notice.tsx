export function Notice({ onClose }: { onClose: () => void }) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="안내">
      <div className="modal">
        <div className="modal-h">
          <h2>수신함 — 그 시절 화면을 그대로</h2>
          <p>2000년대 한국 폰·PC 화면을 그대로 띄워놓고 글자만 고쳐 이미지로 뽑는 도구</p>
        </div>

        <div className="modal-b">
          <h3>사용법</h3>
          <ol>
            <li>
              화면 속 글자를 <b>직접 눌러서</b> 고칩니다. 따로 입력창을 찾을 필요 없습니다.
            </li>
            <li>
              오른쪽 패널에서는 글자로 못 고치는 것(백라이트 색·배경 사진·글자 크기)을 조정합니다.
            </li>
            <li>
              다 만들면 오른쪽 위 <b>PNG 저장</b>. 점선과 커서는 저장본에 안 나옵니다.
            </li>
            <li>
              <b>프리셋 저장</b>으로 .json 을 받아두면 나중에 <b>불러오기</b>로 이어서 편집할 수
              있습니다.
            </li>
            <li>
              되돌리기 <b>Ctrl+Z</b> · 저장 <b>Ctrl+S</b> · 내용은 새로고침해도 남아 있습니다.
            </li>
          </ol>

          <h3>주의사항</h3>
          <ul>
            <li className="warn">화면 속 통신사·서비스 이름은 전부 자체 제작한 가짜 워드마크입니다.</li>
            <li>만든 이미지가 실제 문자·통화기록으로 오해받을 수 있는 용도로는 쓰지 마세요.</li>
            <li>올린 사진은 이 브라우저 안에만 저장되며 어디로도 전송되지 않습니다.</li>
          </ul>
        </div>

        <p className="buildmark">판 {__BUILD__}</p>

        <div className="modal-f">
          <button className="btn btn-primary" onClick={onClose}>
            시작하기
          </button>
        </div>
      </div>
    </div>
  )
}
