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
  }
}
async function getMediaStream(deviceId = {}){
  try{
    const {V, A} = deviceId
    const constraints = {
      video: {
        facingMode: "user",
        width: {exact: 160},
        height: {exact: 120}
      }, 
      audio: A ? {deviceId: {exact: A}} : true
    }
    if(V) constraints.video.deviceId = {exact: V}
    return await window.navigator.mediaDevices.getUserMedia(constraints)
  }catch(err){
    console.log('getMediaStream err: ', err)
  }
}
function send(msg){
  ws.send(JSON.stringify(msg))
}
function getStringSize(str){
  return new Blob([str]).size
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
  // sdp
  const [OFFER, setOFFER] = useState()
  const [isOffer, setIsOffer] = useState(false)
  const [ANSWER, setANSWER] = useState()
  const [isAnswer, setIsAnswer] = useState(false)

  const getMedia = useCallback(async function (deviceId = {}){
    mediaStream?.getTracks().forEach(t => t.stop())
    mediaStream = await getMediaStream(deviceId)
    localRef.current.srcObject = mediaStream

    getDevices().then(res => {
      setVideos(res.videos)
      setAudios(res.audios)
      setCrtVideo(mediaStream.getVideoTracks()[0])
      setCrtAudio(mediaStream.getAudioTracks()[0])
    })
  }, [])

  const connect = useCallback(() => {
    PC = new RTCPeerConnection({iceServers})
    PC.addEventListener("icecandidate", (e) => {
      console.log('send candidate')
      send({type: 'ice', data: e.candidate})
    })
    PC.addEventListener("track", (e) => {
      console.log("remote track added")
      remoteRef.current.srcObject = e.streams[0]
    })
    mediaStream.getTracks().forEach(t => PC.addTrack(t, mediaStream))
  }, [])

  useEffect(() => {
    if(props !== name) {
      window.alert("권한이 없습니다")
      return navigate('/', {replace: true})
    }

    ws.onmessage = (e => {
      const {type, data} = JSON.parse(e.data)
      if(type === "join"){
        console.log('the other joined')
        PC.createOffer().then(offer => {
          setOFFER(prev => offer)
          PC.setLocalDescription(offer)
          console.log('send offer')
          send({type: "offer", data: offer})
        })
      }
      if(type === "full") {
        window.alert("방이 꽉 찼습니다")
        return navigate(-1)
      }
      if(type === "leave"){
        console.log("the other left")
        // 상대방 정보 삭제 로직 필요
      }
      // 시그널링
      if(type === "offer"){
        console.log("get offer")
        setOFFER(prev => data)
        PC.setRemoteDescription(data)
        PC.createAnswer().then(answer => {
          PC.setLocalDescription(answer)
          console.log("send answer ", answer)
          setANSWER(prev => answer)
          send({type: "answer", data: answer})
        })
      }
      if(type === "answer"){
        console.log("get answer ", data)
        setANSWER(data)
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
    .then(() => send({type: 'join', data: name}))
    .catch(console.log)

    return () => {
      send({type: 'leave', data: name})
      mediaStream?.getTracks().forEach(t => t.stop())
      mediaStream = null
      PC?.close()
      PC = null
    }
  }, [name, props, getMedia, navigate, connect])

  function checkVideoTrack(){
    console.log('video track constraints : ', mediaStream.getVideoTracks()[0].getConstraints())
  }
  async function changeResolution(){
    try{
      mediaStream?.getTracks().forEach(t => t.stop())
  
      const VC = mediaStream.getVideoTracks()[0].getConstraints()
      VC.width.exact = VC.width.exact === 640 ? 160 : 640
      VC.height.exact = VC.height.exact === 480 ? 120 : 480
      const constraints = {
        video: VC,
        audio: true
      }
      mediaStream = await window.navigator.mediaDevices.getUserMedia(constraints)
      localRef.current.srcObject = mediaStream
    }catch(err){
      console.log('changeResolution error: ', err)
    }
  }
  async function changeChannel(){
    try{
      mediaStream?.getTracks().forEach(t => t.stop())
  
      const VC = mediaStream.getVideoTracks()[0].getConstraints()
      VC.facingMode = VC.facingMode === "user" ? "environment" : "user"
      const constraints = {
        video: VC,
        audio: true
      }
      mediaStream = await window.navigator.mediaDevices.getUserMedia(constraints)
      localRef.current.srcObject = mediaStream
    }catch(err){
      console.log("changeChannel error: ", err)
    }
  }
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

  console.log('mediaStream : ', mediaStream)
  return(
    <StyledContent.RTC>
      <header>v0.3 RTC room {name}</header>
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
      <section>
        <button onClick={checkVideoTrack}>Check VideoTrack</button>
        <button onClick={changeResolution}>Change Resolution</button>
        <button onClick={changeChannel}>Change Channel</button>
      </section>
      <footer>
        <button onClick={onoffVideo}>Camera {isVideoOn ? "On" : "Off"}</button>
        <button onClick={onoffAudio}>Audio {isAudioOn ? "On" : "Off"}</button>
      </footer>
      <section>

      </section>
      <section>
        {OFFER && (<>
          <h4>{OFFER.type}: {getStringSize(JSON.stringify(OFFER))}Bytes</h4>
          <button onClick={() => setIsOffer(prev => !prev)}>{isOffer ? "close" : "open"}</button>
          {isOffer && <div style={{whiteSpace: "pre-line"}}>{OFFER.sdp}</div>}
        </>)}
        {ANSWER && (<>
          <h4>{ANSWER.type}: {getStringSize(JSON.stringify(ANSWER))}Bytes</h4>
          <button onClick={() => setIsAnswer(prev => !prev)}>{isAnswer ? "close" : "open"}</button>
          {isAnswer && <div style={{whiteSpace: "pre-line"}}>{ANSWER.sdp}</div>}
        </>)}
      </section>
    </StyledContent.RTC>
  )
}

/*
  ★★★ 양쪽의 mediaStream과 peerConnection 이 전부 생성 된걸 확인하고 나서 시그널링을 시작하자
  -> mediaStream 생성
  -> peerConnection 생성
  -> offer 전달


  ★★★ window.navigator.mediaDevices
    .enumerateDevices() : 연결된 I/O devices의 MediaDeviceInfo 배열을 반환한다
    .getUserMedia() : 유저 허락을 받아 비디오/음성 mediaStreamTrack으로 구성된 새로운 mediaStream을 반환한다


  ★★★ MediaTrackConstraints
  (video track)
    .width
    .height
    .aspectRatio
    .frameRate
    .facingMode


  ★★★ MediaStream
    .addTrack()
    .getTracks()
    .getTrackById()
    .getVideoTracks() : 해당 스트림의 video track을 나타내는 MediaStreamTrack 인스턴스 배열을 반환
    .getAudioTracks() : 해당 스트림의 audio track을 나타내는 MediaStreamTrack 인스턴스 배열을 반환


  ★★★ MediaStreamTrack
  .getConstraints() : get the set of constraints that are currently applied to the media
  .getSettings() : get a really applied set of constraints
  .applyConstraints(MediaTrackConstraints):Promise : set a set of constraints to the track (frame rate, dimensions, etc)

  ex) function changeMobileCamera(){
    const C = videoTrack.getConstraints()
    C.facingMode = C.facingMode === "user" ? "environment" : "user"
    videoTrack.applyConstraints(C)
  }


  ★★★ SDP(Session Description Protocol, offer/answer) : 사용자의 미디어와 네트워크에 관한 정보
    v : SDP의 현재 프로토콜 버전
    o : SDP를 생성한 Peer의 식별자. username, sessionId, sessionVersion, networkType, addressType, unicastAddress
    s : session name
    t : 세션 활성화 시간. start time, end time
    m : 미디어 라인. 각 장치 스트림에 관한 속성들에 대한 정보를 가지고 있다
    a=rtpmap:프로파일번호 코덱종류/샘플링주기/채널수

  코덱 적용 우선순위 변경하기
    m=video 에서 H.264에 해당하는 프로파일번호를 맨 앞으로 변경하자
*/

/*
  @@ 동영상 압축 기술(MPEG) : 영상 배포의 필요성과 용량 압축의 필요성을 해결
  
  가장 많이 사용되는 포맷은 MPEG4이며, 64Kbps급의 낮은 속도와, 높은 압축률을 구현한다
  가장 흔히 사용되고, 고화질 영상의 뛰어난 압축 효율성을 보이는 H.264 코덱과 함께 사용된다

  -코덱 : 영상이나 음성 신호를 디지털 신호로 변환하거나 반대로 변환하는 기능을 수행하는 기술
*/