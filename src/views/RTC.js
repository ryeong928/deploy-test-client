import { useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import StyledContent from "../styled/content";
import { ws } from '../App'

let mediaStream
const iceServers = [
  {
    urls: "stun:openrelay.metered.ca:80",
  },
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
]
let PC
/*
free STUN, TURN server : https://www.metered.ca/tools/openrelay/

The Open Relay runs on port 80 and 443 to bypass corporate firewalls, 
many corporate/enterprise firewall only allow port 80 or 443, 
it also supports turns + SSL for maximum compatibility.
*/

function wsSend(msg){
  ws.send(JSON.stringify(msg))
}

export default function RTC(){
  const navigate = useNavigate()
  const {name} = useParams()
  const props = useLocation().state
  // video
  const localRef = useRef(null)
  const remoteRef = useRef(null)

  const init = useCallback(async () => {
    try{
      // 내 장비 연결
      const constraints = {video: true, audio: true}
      mediaStream = await window.navigator.mediaDevices.getUserMedia(constraints)
      localRef.current.srcObject = mediaStream
      // 연결 준비
      PC = new RTCPeerConnection({iceServers})
      PC.addEventListener("icecandidate", (e) => {
        console.log('icecandidate send')
        wsSend({type: 'ice', data: e.candidate})
      })
      PC.addEventListener("track", (e) => {
        console.log("remote track added")
        remoteRef.current.srcObject = e.streams[0]
      })
      // 전송할 나의 스트림 등록
      mediaStream.getTracks().forEach(t => PC.addTrack(t, mediaStream))

      function connectServer(){
        if(ws.readyState === ws.OPEN) wsSend({type: 'join', data: name})
        else setTimeout(() => connectServer(), 1000)
      }
      connectServer()

    }catch(err){
      console.log(err)
    }
  }, [name])

  useEffect(() => {
    if(props !== name) {
      window.alert("권한이 없습니다")
      return navigate('/', {replace: true})
    }

    ws.onmessage = ((e) => {
      const {type, data} = JSON.parse(e.data)
      if(type === "join"){
        console.log('the other joined')
        PC.createOffer().then(offer => {
          PC.setLocalDescription(offer)
          console.log('offer send')
          wsSend({type: "offer", data: offer})
        })
      }
      if(type === "full") {
        window.alert("방이 꽉 찼습니다")
        return navigate(-1)
      }
      // 시그널링
      if(type === "offer"){
        PC.setRemoteDescription(data)
        PC.createAnswer().then(answer => {
          PC.setLocalDescription(answer)
          console.log("answer send")
          wsSend({type: "answer", data: answer})
        })
      }
      if(type === "answer"){
        console.log("get answer")
        PC.setRemoteDescription(data)
      }
      if(type === "ice"){
        console.log("get candidate")
        PC.addIceCandidate(data)
      }

    })
    init()


    return () => {
      wsSend({type: 'leave', data: name})
      PC.close()
      mediaStream = null
      PC = null
    }
  }, [name, props, init, navigate])



  return(
    <StyledContent.RTC>
      <header>RTC room {name}</header>
      <main>
        <video ref={localRef} autoPlay controls/>
        <video ref={remoteRef} autoPlay controls/>
      </main>
    </StyledContent.RTC>
  )
}

/*
  PC.addTrack(MediaStreamTrack, MediaStream): RTCRtpSender instance
  : 상대방에게 보낼 트랙을 추가
    _MediaStreamTrack : PC에 추가할 객체
    _MediaStream : 트랙이 추가될 객체

  track event : 새로운 트랙이 RTCRtpReceiver에 추가되면 발생하는 이벤트

*/