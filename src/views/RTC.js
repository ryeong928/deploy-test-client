import { useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import StyledContent from "../styled/content";
import { socket } from '../App'

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

let DC


export default function RTC(){
  const navigate = useNavigate()
  const {name} = useParams()
  const props = useLocation().state
  // video
  const localRef = useRef(null)
  const remoteRef = useRef(null)

  const init = useCallback(async () => {
    try{
      const constraints = {audio: true, video: true}
      mediaStream = await window.navigator.mediaDevices.getUserMedia(constraints)
      localRef.current.srcObject = mediaStream
      PC = new RTCPeerConnection({iceServers})
      PC.addEventListener("icecandidate", (e) => {
        console.log('icecandidate send')
        socket.emit("ice", e.candidate)
      })
      PC.addEventListener("track", (e) => {
        console.log("remote track added")
        remoteRef.current.srcObject = e.streams[0]
      })
      mediaStream.getTracks().forEach(t => PC.addTrack(t, mediaStream))
      socket.emit("join", name)
    }catch(err){
      console.log(err)
    }
  }, [name])

  useEffect(() => {
    if(props !== name) {
      window.alert("권한이 없습니다")
      return navigate('/', {replace: true})
    }
    socket.on("join", async () => {
      console.log("the other joined!")
      DC = PC.createDataChannel("dc")
      DC.addEventListener("open", (e) => {
        console.log("DC open: ", e)
        DC.send("DC host connected")
      })
      DC.addEventListener("message", (e) => {
        console.log('DC message: ', e.data)
      })
      const offer = await PC.createOffer()
      PC.setLocalDescription(offer)
      console.log("offer send")
      socket.emit("offer", offer)
    })
    socket.on("offer", async (offer) => {
      console.log("offer get")
      PC.addEventListener("datachannel", (e) => {
        console.log("DC open: ", e)
        DC = e.channel
        DC.send("DC guest connected")
        DC.addEventListener("message", (e) => {
          console.log('DC message: ', e.data)
        })
      })
      PC.setRemoteDescription(offer)
      const answer = await PC.createAnswer()
      PC.setLocalDescription(answer)
      console.log("answer send")
      socket.emit("answer", answer)
    })
    socket.on("answer", (answer) => {
      console.log('answer get')
      PC.setRemoteDescription(answer)
    })
    socket.on("ice", (icecandidate) => {
      console.log('icecandidate get')
      PC.addIceCandidate(icecandidate)
    })

    init()

    return () => {
      console.log('data channel unmounted')
      socket.disconnect()
    }
  }, [name, props, init, navigate])





  return(
    <StyledContent.RTC>
      <header>RTC room {name}</header>
      <main>
        <video ref={localRef} autoPlay />
        <video ref={remoteRef} autoPlay />
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