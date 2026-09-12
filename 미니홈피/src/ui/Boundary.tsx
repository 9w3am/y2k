import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * 한 군데가 터져도 화면 전체가 하얘지지 않게 막는다.
 * 하얀 화면은 쓰는 사람 입장에서 "사이트가 죽었다" 와 똑같으므로,
 * 무슨 일이 났는지 알려주고 되돌아갈 길을 준다.
 */
export class Boundary extends Component<{ children: ReactNode }, { err: Error | null }> {
  state: { err: Error | null } = { err: null }

  static getDerivedStateFromError(err: Error) {
    return { err }
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error('아이로그에서 잡힌 오류:', err, info.componentStack)
  }

  render() {
    const { err } = this.state
    if (!err) return this.props.children

    return (
      <div className="crash">
        <div className="crash-box">
          <b>화면을 그리다 멈췄습니다</b>
          <p>
            쓰신 글과 사진은 그대로 있습니다. 아래로 다시 열어보세요.
            <br />
            같은 일이 계속 나면 설정에서 처음 상태로 되돌릴 수 있습니다.
          </p>
          <pre>{err.message}</pre>
          <div className="crash-btns">
            <button
              className="btn btn-main"
              onClick={() => {
                location.hash = '#/'
                location.reload()
              }}
            >
              첫 화면으로
            </button>
            <button className="btn" onClick={() => this.setState({ err: null })}>
              다시 그려보기
            </button>
          </div>
        </div>
      </div>
    )
  }
}
