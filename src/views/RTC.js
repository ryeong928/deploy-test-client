import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import StyledContent from "../styled/content";
import { ws } from '../App'

let mediaStream
let PC
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
/*
free STUN, TURN server : https://www.metered.ca/tools/openrelay/

The Open Relay runs on port 80 and 443 to bypass corporate firewalls, 
many corporate/enterprise firewall only allow port 80 or 443, 
it also supports turns + SSL for maximum compatibility.
*/

function wsSend(msg){
  ws.send(JSON.stringify(msg))
}
async function getDevices(){
  try{
    const videos = []
    const audios = []
    const devices = await window.navigator.mediaDevices.enumerateDevices()
    devices.forEach(d => {
      if(d.kind === "videoinput") videos.push(d)
      if(d.kind === "audioinput") audios.push(d)
    })
    return {videos, audios}
  }catch(err){
    console.log("getDevices err: ", err)
    window.alert("getDevices err")
  }
}
async function getMediaStream(deviceId = {}){
  try{
    const {V, A} = deviceId
    const constraints = {
      video: V ? {deviceId: {exact: V}} : true, 
      audio: A ? {deviceId: {exact: A}} : true
    }
    return await window.navigator.mediaDevices.getUserMedia(constraints)
  }catch(err){
    console.log('getMediaStream err: ', err)
  }
}

export default function RTC(){
  const navigate = useNavigate()
  const {name} = useParams()
  const props = useLocation().state
  // video rendering
  const localRef = useRef(null)
  const remoteRef = useRef(null)
  // devices
  const [videos, setVideos] = useState([])
  const [audios, setAudios] = useState([])
  // current device in usage
  const [crtVideo, setCrtVideo] = useState('')
  const [crtAudio, setCrtAudio] = useState('')
  // on/off 
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)

  const connect = useCallback(() => {
    PC = new RTCPeerConnection({iceServers})
    PC.addEventListener("icecandidate", (e) => {
      console.log('send candidate')
      wsSend({type: 'ice', data: e.candidate})
    })
    PC.addEventListener("track", (e) => {
      console.log("remote track added")
      remoteRef.current.srcObject = e.streams[0]
    })
    mediaStream.getTracks().forEach(t => PC.addTrack(t, mediaStream))
  }, [])

  const stop = useCallback(() => {
    if(mediaStream){
      mediaStream.getTracks().forEach(t => t.stop())
      mediaStream = null
    }
    if(PC){
      PC.close()
      PC = null
    }
  }, [])

  const getMedia = useCallback(async function (deviceId = {}){
    try{
      mediaStream?.getTracks().forEach(t => t.stop())
      getDevices().then(res => {
        setVideos(res.videos)
        setAudios(res.audios)
      })

      mediaStream = await getMediaStream(deviceId)
      localRef.current.srcObject = mediaStream

      setCrtVideo(mediaStream.getVideoTracks()[0])
      setCrtAudio(mediaStream.getAudioTracks()[0])
    }catch(err){
      console.log(err)
    }
  }, [])

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
          console.log('send offer')
          wsSend({type: "offer", data: offer})
        })
      }
      if(type === "full") {
        window.alert("방이 꽉 찼습니다")
        return navigate(-1)
      }
      if(type === "leave"){
        console.log("the other left")
      }
      // 시그널링
      if(type === "offer"){
        PC.setRemoteDescription(data)
        PC.createAnswer().then(answer => {
          PC.setLocalDescription(answer)
          console.log("send answer")
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
    Promise.resolve(true)
    .then(() => getMedia())
    .then(() => connect())
    .then(() => wsSend({type: 'join', data: name}))

    return () => {
      wsSend({type: 'leave', data: name})
      stop()
    }
  }, [name, props, getMedia, navigate, connect, stop])


  async function changeVideo(e){
    setCrtVideo(videos.find(v => v.deviceId === e.target.value))
    await getMedia({V: e.target.value})
    if(true){
        const videoTrack = mediaStream.getVideoTracks()[0]
        const videoSender = PC.getSenders().find(s => s.track.kind === "video")
        videoSender.replaceTrack(videoTrack)
    }
  }
  async function changeAudio(e){
    setCrtAudio(audios.find(a => a.deviceId === e.target.value))
    await getMedia({A: e.target.value})
    if(true){
      const audioTrack = mediaStream.getAudioTracks()[0]
      const audioSender = PC.getSenders().find(s => s.track.kind === "audio")
      audioSender.replaceTrack(audioTrack)
    }
  }
  function onoffVideo(){
    mediaStream.getVideoTracks().forEach(track => track.enabled = !track.enabled)
    setIsVideoOn(prev => !prev)
  }
  function onoffAudio(){
    mediaStream.getAudioTracks().forEach(t => t.enabled = !t.enabled)
    setIsAudioOn(prev => !prev)
  }
  return(
    <StyledContent.RTC>
      <header>v0.2 RTC room {name}</header>
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