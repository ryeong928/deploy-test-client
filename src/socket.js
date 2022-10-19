
export default function createSocket(){
  function connect(){
    console.log("★ WSS 연결 시도")
    let ws = new WebSocket(process.env.REACT_APP_SOCKET_URL)
    let timer = null
    function stayConnected(boolean){
      if(boolean) timer = setInterval(() => ws.send(JSON.stringify({type: 'interval'})), 25000)
      else clearInterval(timer)
    }

    ws.onopen = (e) => {
      console.log(`★ WSS 연결 ${e.target.url}`)
      stayConnected(true)
    }
    ws.onmessage = (e) => {
      const {type, data} = JSON.parse(e.data)
      console.log(`★ WSS 메시지, ${type}: ${data}`)
    }
    ws.onclose = (e) => {
      console.log('★ WSS 종료: ', e)
      stayConnected(false)
      setTimeout(() => connect(), 2000)
    }
    ws.onerror = (e) => {
      console.log('★ WSS 에러: ', e)
    }
    return ws
  }

  return connect()
}