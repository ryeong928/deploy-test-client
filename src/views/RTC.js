import { useCallback, useEffect, useRef, useState } from "react";
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
  // options
  const [videos, setVideos] = useState([])
  const [audios, setAudios] = useState([])
  const [crtVideo, setCrtVideo] = useState('')
  const [crtAudio, setCrtAudio] = useState('')
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)

  const init = useCallback(async () => {
    console.log('init')
    try{
      // 사용 가능한 입력 장치 리스트
      window.navigator.mediaDevices.enumerateDevices()
      .then(res => setVideos(res.filter(d => d.kind === "videoinput").map(d => ({deviceId: d.deviceId, label: d.label}))))
      window.navigator.mediaDevices.enumerateDevices()
      .then(res => setAudios(res.filter(d => d.kind === "audioinput").map(d => ({deviceId: d.deviceId, label: d.label}))))
      // 내 장비 연결
      mediaStream = await window.navigator.mediaDevices.getUserMedia({video: true, audio: true})
      localRef.current.srcObject = mediaStream
      console.log('mediaStream: ', mediaStream)
      // 현재 사용중인 카메라/오디오
      setCrtVideo(mediaStream.getVideoTracks()[0])
      setCrtAudio(mediaStream.getAudioTracks()[0])
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
      mediaStream.getTracks().forEach(t => PC.addTrack(t, mediaStream))
      // 시그널링 시도
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
      if(PC){
        PC.close()
        PC = null
        mediaStream = null
      }
    }
  }, [name, props, init, navigate])

  async function changeVideo(e){
    const deviceId = e.target.value
    const constraints = {
      video: {deviceId: {exact: deviceId}},
      audio: true
    }
    try{
      // 새롭게 생성한 mediaStream
      mediaStream = await window.navigator.mediaDevices.getUserMedia(constraints)
      localRef.current.srcObject = mediaStream
      console.log('mediaStream: ', mediaStream)
      // 내 트랙 등록
      mediaStream.getTracks().forEach(t => PC.addTrack(t, mediaStream))
      // 현재 사용중인 카메라/오디오
      setCrtVideo(mediaStream.getVideoTracks()[0])
      setCrtAudio(mediaStream.getAudioTracks()[0])
      if(PC){
        const videoTrack = mediaStream.getVideoTracks()[0]
        const RTCRtpSenders = PC.getSenders()
        const videoSender = RTCRtpSenders.find(s => s.track.kind === "video")
        videoSender.replaceTrack(videoTrack)
      }
    }catch(err){
      console.log("video change error: ", err)
      window.alert("video change error: ", err)
    }
  }
  function changeAudio(e){
    setCrtAudio(audios.find(a => a.deviceId === e.target.value))
  }
  function onoffVideo(){
    const mediaStreamTrack = mediaStream.getVideoTracks()
    mediaStreamTrack.forEach(track => track.enabled = !track.enabled)
    setIsVideoOn(prev => !prev)
  }
  function onoffAudio(){
    mediaStream.getAudioTracks().forEach(t => t.enabled = !t.enabled)
    setIsAudioOn(prev => !prev)
  }

  return(
    <StyledContent.RTC>
      <header>RTC room {name}</header>
      <main>
        <video ref={localRef} autoPlay controls/>
        <video ref={remoteRef} autoPlay controls/>
      </main>
      <section>
        <select onChange={changeVideo}>
          {videos.map(v => (<option key={v.deviceId} value={v.deviceId} selected={v.label === crtVideo.label}>{v.label}</option>))}
        </select>
        <select onChange={changeAudio}>
          {audios.map(a => (<option key={a.deviceId} value={a.deviceId} selected={a.label === crtAudio.label}>{a.label}</option>))}
        </select>
      </section>
      <footer>
        <button onClick={onoffVideo}>Camera {isVideoOn ? "On" : "Off"}</button>
        <button onClick={onoffAudio}>Audio {isAudioOn ? "On" : "Off"}</button>
      </footer>
    </StyledContent.RTC>
  )
}

/*
  !! 양쪽의 mediaStream과 peerConnection 이 전부 생성 된걸 확인하고 나서 시그널링을 시작하자
  -> mediaStream 생성
  -> peerConnection 생성
  -> offer 전달

  !! 카메라(장치)를 변경할 때마다, 새로운 스트림을 생성하고 업데이트하여 재전송
  새로 생성항 stream에서 얻은 새로운 deviceId를 가져다가
  -> Sender : 상대방에게 보내진 나의 스트림의 트랙을 컨트롤하는 기능

  PC.addTrack(MediaStreamTrack, MediaStream): RTCRtpSender instance
  : 상대방에게 보낼 트랙을 추가
    _MediaStreamTrack : PC에 추가할 객체
    _MediaStream : 트랙이 추가될 객체

  track event : 새로운 트랙이 RTCRtpReceiver에 추가되면 발생하는 이벤트

  send offer, candidate
  get offer, candidate
  send answer, candidate
  get answer, candidate

  양쪽에서 상대방의 stream을 받고, srcObject에 등록

*/

