import { useRef, useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import StyledContent from '../styled/content'
import { socket } from '../App'

let mediaStream
let DC // datachannel(peer-to-peer 데이터 전송)은 offer를 생성하기 전에 만들어야 한다
let PC = new RTCPeerConnection({iceServers: [{urls: [
  "stun:stun.l.google.com:19302",
  "stun:stun2.l.google.com:19302",
  "stun:stun3.l.google.com:19302",
  "stun:stun4.l.google.com:19302",
]}]})


export default function RTC(){
  const navigate = useNavigate()
  const props = useLocation().state
  const {name} = useParams()
  const localRef = useRef(null)
  const remoteRef = useRef(null)
  const [cameras, setCameras] = useState([])
  console.log('cameras: ', cameras)
  useEffect(() => {
    if(props !== name) {
      window.alert("권한이 없습니다")
      return navigate('/', {replace: true})
    }

    socket.on("join", async () => {
      console.log("the other joined!")
      // data channel 생성
      DC = PC.createDataChannel("channelName")
      DC.addEventListener("open", (e) => {
        console.log('data channel open: ', e)
      })
      DC.addEventListener("message", (e) => {
        console.log('data channel message: ', e.data)
      })
      // connect the other
      const offer = await PC.createOffer()
      PC.setLocalDescription(offer)
      console.log("offer sent: ", offer)
      socket.emit("offer", offer)
    })
    socket.on("offer", async (offer) => {
      // data channel 취득
      PC.addEventListener("datachannel", (e) => {
        console.log("data channel received: ", e)
        DC = e.channel
        DC.send("i received your data channel received")
        DC.addEventListener("message", (e) => {
          console.log('data channel: ', e.data)
        })
      })
      // connect the other
      console.log("offer received: ", offer)
      PC.setRemoteDescription(offer)
      const answer = await PC.createAnswer()
      PC.setLocalDescription(answer)
      console.log("answer sent: ", answer)
      socket.emit("answer", answer)
    })
    socket.on("answer", (answer) => {
      console.log("answer received: ", answer)
      PC.setRemoteDescription(answer)
    })
    socket.on("ice", (ice) => {
      console.log("ice received: ", ice)
      PC.addIceCandidate(ice)
    })
    async function getCameras(){
      try{
        const devices = await window.navigator.mediaDevices.enumerateDevices()
        const cameras = devices.filter(d => d.kind === "videoinput")
        setCameras(cameras)
      }catch(e){
        console.log('getCameras err: ', e)
      }
    }
    function connectSetting(){
      // answer로 방장이 sdp를 설정하면, icecandidate 이벤트가 발생
      PC.addEventListener("icecandidate", (d) => {
        console.log("ice sent: ", d)
        socket.emit("ice", d.candidate)
      })
      // ice candidate를 등록하고 나면 발생하는 addstream 이벤트
      PC.addEventListener("addstream", (d) => {
        console.log("add remote stream: ", d)
        remoteRef.current.srcObject = d.stream
      })
      // 상대방에게 보낼 나의 mediaStream
      mediaStream.getTracks().forEach(t => PC.addTrack(t, mediaStream))
    }
    async function init(){
      try{
        getCameras()
        // 내 카메라 등록
        const initialConstraints = {audio: true, video: true}
        mediaStream = await window.navigator.mediaDevices.getUserMedia(initialConstraints)
        localRef.current.srcObject = mediaStream
        // 상대방 연결 셋팅
        connectSetting()
        // 상대방 연결 시작
        socket.emit("join", name)
      }catch(err){
        console.log(err)
      }
    }
    init()
    return () => {
      console.log('unmounted')
      socket.emit("leave")
    }
  }, [name, navigate, props])

  function leaveRoom(){
    socket.emit("leave")
    navigate('/')
  }

  return(
    <StyledContent.RTC>
      <header>RTC room {name}</header>
      <main>
        <video ref={localRef} autoPlay />
        <video ref={remoteRef} autoPlay />
      </main>
      <footer>
        <button onClick={leaveRoom}>Leave</button>
      </footer>
    </StyledContent.RTC>
  )
}