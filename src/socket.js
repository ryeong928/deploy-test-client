
export default function createSocket(){
  function connect(){
    let ws = new WebSocket(process.env.REACT_APP_SOCKET_URL)

    ws.onopen = (e) => {
      console.log(`★ WSS 연결 ${e.target.url}`)
      window.alert(`★ WSS 연결 ${e.target.url}`)
    }
    ws.onmessage = (e) => {
      const {type, data} = JSON.parse(e.data)
      console.log(`★ WSS 메시지, ${type}: ${data}`)
    }
    ws.onclose = (e) => {
      console.log('★ WSS 종료: ', e)
      setTimeout(() => connect(), 2000)
    }
    ws.onerror = (e) => {
      console.log('★ WSS 에러: ', e)
    }
    return ws
  }

  return connect()
}