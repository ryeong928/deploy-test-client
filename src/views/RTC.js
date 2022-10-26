import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import StyledContent from "../styled/content";
import { ws } from '../App'

let mediaStream
let PC
let timer
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
    return undefined
  }
}
function updateTrack(type){
  if(type === "video"){
    const videoTrack = mediaStream.getVideoTracks()[0]
    const videoSender = PC.getSenders().find(s => s.track.kind === "video")
    videoSender.replaceTrack(videoTrack)
  }
  if(type === "audio"){
    const audioTrack = mediaStream.getAudioTracks()[0]
    const audioSender = PC.getSenders().find(s => s.track.kind === "audio")
    audioSender.replaceTrack(audioTrack)
  }
}
async function checkStats(){
  try{
    if(!PC) return
    const start = await PC.getStats()
    await new Promise(res => setTimeout(res, 3000))
    const end = await PC.getStats()
    let bytesSent = 0
    let bytesReceived = 0
    let packetsSent = 0
    let packetsReceived = 0

    for(const stats of end.values()){
      if(stats.type === 'outbound-rtp'){
        const base = start.get(stats.id)
        if(!base) continue
        bytesSent += stats.bytesSent - base.bytesSent
        packetsSent += stats.packetsSent - base.packetsSent
      }
      if(stats.type === 'inbound-rtp'){
        const base = start.get(stats.id)
        if(!base) continue
        bytesReceived += stats.bytesReceived - base.bytesReceived
        packetsReceived += stats.packetsReceived - base.packetsReceived
      }
    }
    return {bytesSent, packetsSent, bytesReceived, packetsReceived}
  }catch(err){
    console.log("check stats error : ", err)
  }
}
function checkVideoTrack(){
  console.log('constraints: ', mediaStream.getVideoTracks()[0].getConstraints())
  console.log('settings: ', mediaStream.getVideoTracks()[0].getSettings())
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
  // network outbound-rtp amount
  const [DataAmount, setDataAmount] = useState(undefined)
  // rotate video view
  const [rotateLocal, setRotateLocal] = useState(false)
  const [rotateRemote, setRotateRemote] = useState(false)

  const getMedia = useCallback(async function (deviceId = {}){
    try{
      mediaStream?.getTracks().forEach(t => t.stop())
      mediaStream = await getMediaStream(deviceId)
      localRef.current.srcObject = mediaStream
  
      getDevices().then(res => {
        setVideos(res.videos)
        setAudios(res.audios)
        setCrtVideo(mediaStream.getVideoTracks()[0])
        setCrtAudio(mediaStream.getAudioTracks()[0])
      })
    }catch(err){
      console.log('getMedia error: ', err)
      return undefined
    }finally{
      console.log('mediaStream : ', mediaStream)
    }
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
    mediaStream?.getTracks().forEach(t => PC.addTrack(t, mediaStream))
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
      if(type === "peercontrol"){
        if(data === "resolution") return changeResolution()
        if(data === "channel") return changeChannel()
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
      if(timer) clearInterval(timer)
      mediaStream ? mediaStream.getTracks().forEach(t => t.stop()) : mediaStream = null
      PC ? PC.close() : PC = null
    }
  }, [name, props, getMedia, navigate, connect])

  const checkDataAmout = useCallback(() => {
    if(timer) clearInterval(timer)
    else {
      async function getData(){
        const data = await checkStats()
        setDataAmount(data)
      }
      getData()
      timer = setInterval(getData, 3000)
    } 
  }, []) 
  async function changeResolution(){
    try{
      if(!mediaStream) return window.alert("연결된 장치가 없습니다")
      mediaStream.getTracks().forEach(t => t.stop())
  
      const VC = mediaStream.getVideoTracks()[0].getConstraints()
      VC.width.exact = VC.width.exact === 640 ? 160 : 640
      VC.height.exact = VC.height.exact === 480 ? 120 : 480
      const constraints = {
        video: VC,
        audio: true
      }
      mediaStream = await window.navigator.mediaDevices.getUserMedia(constraints)
      localRef.current.srcObject = mediaStream

      updateTrack('video')
    }catch(err){
      console.log('changeResolution error: ', err)
    }
  }
  async function changeChannel(){
    try{
      if(!mediaStream) return window.alert("연결된 장치가 없습니다")
      mediaStream.getTracks().forEach(t => t.stop())
  
      const VC = mediaStream.getVideoTracks()[0].getConstraints()
      VC.facingMode = VC.facingMode === "user" ? "environment" : "user"
      const constraints = {
        video: VC,
        audio: true
      }
      mediaStream = await window.navigator.mediaDevices.getUserMedia(constraints)
      localRef.current.srcObject = mediaStream

      updateTrack('video')
    }catch(err){
      console.log("changeChannel error: ", err)
    }
  }
  async function changeVideo(e){
    if(!mediaStream) return window.alert("연결된 장치가 없습니다")
    setCrtVideo(videos.find(v => v.deviceId === e.target.value))
    await getMedia({V: e.target.value})
    updateTrack('video')
  }
  async function changeAudio(e){
    if(!mediaStream) return window.alert("연결된 장치가 없습니다")
    setCrtAudio(audios.find(a => a.deviceId === e.target.value))
    await getMedia({A: e.target.value})
    updateTrack('audio')
  }
  function onoffVideo(){
    if(!mediaStream) return window.alert("연결된 장치가 없습니다")
    mediaStream.getVideoTracks().forEach(track => track.enabled = !track.enabled)
    setIsVideoOn(prev => !prev)
  }
  function onoffAudio(){
    if(!mediaStream) return window.alert("연결된 장치가 없습니다")
    mediaStream.getAudioTracks().forEach(t => t.enabled = !t.enabled)
    setIsAudioOn(prev => !prev)
  }
  function changePeer(e){
    const {type} = e.currentTarget.dataset
    if(!type) return
    send({type: 'peercontrol', data: type})
  }
  function rotateView(e){
    const {type} = e.currentTarget.dataset
    if(!type) return
    if(type === "local") setRotateLocal(prev => !prev)
    if(type === "remote") setRotateRemote(prev => !prev)
  }

  return(
    <StyledContent.RTC>
      <header>v0.3 RTC room {name}</header>
      <main>
        <video className={rotateLocal ? 'rotate' : ''} ref={localRef} autoPlay controls/>
        <video className={rotateRemote ? 'rotate' : ''} ref={remoteRef} autoPlay controls/>
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
        <button onClick={changeResolution}>Change Resolution</button>
        <button onClick={changeChannel}>Change Channel</button>
        <button onClick={onoffVideo}>Camera {isVideoOn ? "On" : "Off"}</button>
        <button onClick={onoffAudio}>Audio {isAudioOn ? "On" : "Off"}</button>
        <button data-type="local" onClick={rotateView}>Rotate View</button>
      </section>

      <section>
        <button data-type="resolution" onClick={changePeer}>Change Peer Resolution</button>
        <button data-type="channel" onClick={changePeer}>Change Peer Channel</button>
        <button data-type="remote" onClick={rotateView}>Rotate Peer View</button>
      </section>

      <section>
        <button onClick={checkVideoTrack}>check Video Track</button>
        <button onClick={checkDataAmout}>check sent data amount</button>
        {DataAmount && Object.keys(DataAmount).map(v => <div key={v}>{v}: {DataAmount[v]}</div>)}
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


  ★★★ MediaTrackConstraints, MediaTrackSettings
  (video track)
    .width
    .height
    .aspectRatio
    .facingMode
    .frameRate : how many frames of video per second. If the value can't be determined for any reason, the value will match the vertical sync rate of the device the user agent is running on


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


  ★★★ RTCPeerConnection
    .getStats() : 온갖 stats에 대한 정보를 RTCStatsReport Map으로 반환한다
    .getSenders() : 연결된 MediaStreamTrack에 해당하는 RTCRtpSender 객체들로 이루어진 배열을 반환한다


  ★★★ RTCRtpSender : 상대방에게 전달되는 특정 MediaStreamTrack 어떻게 encoded 되고 sent 되는지에 대한 정보를 갖고 있으며, 이에 대한 제어권을 제공하는 객체
    .replaceTrack() : renegotiation 없이, 현재 RTCRtpSender에 의해 전달되고 있는 track을 다른 track으로 교체한다
    .getStats() : 해당 RTCRtpSender에 의해 외부로 스트리밍되는 정보에 관한 모든 statistics data를 갖는 RTCStatsReport를 value로 가진 Promise를 반환한다


  ★★★ RTCStatsReport
  - a Map object returned by RTCPeerConnection/RTCRtpReceiver/RTCRtpSender.getStats()
  - a Map object between RTCStats.id and corresponding RTCStats dictionary
  

  ★★★ RTCStats
  - default attributes : timestamp, type, id
  - 


  ★★★ SDP(Session Description Protocol, offer/answer) : 사용자의 미디어와 네트워크에 관한 정보
    v : SDP의 현재 프로토콜 버전
    o : SDP를 생성한 Peer의 식별자. username, sessionId, sessionVersion, networkType, addressType, unicastAddress
    s : session name
    t : 세션 활성화 시간. start time, end time
    m : 미디어 라인. 각 장치 스트림에 관한 속성들에 대한 정보를 가지고 있다
    a=rtpmap:프로파일번호 코덱종류/샘플링주기/채널수

  코덱 적용 우선순위 변경하기
    m=video 에서 H.264에 해당하는 프로파일번호를 맨 앞으로 변경하자

  ★★★ WebRTC server
  1. Signaling server
  -peer간 연결을 위한 서버. 1:1에 적합
  -peer간 연결이 된 후 부하가 없지만, 클라가 n:m 연결이 되면서 클라의 부하가 급격하게 증가

  2. SFU(Selective Forwarding Unit) server
  -peer간 미디어 트래픽을 중계하는 중앙 서버 방식. 1:N에 적합
  -peer간 연결이 아닌, 서버와 peer간의 연결
  -peer의 부하 일부를 서버가 책임

  3. MCU
  -다수의 송출 미디어를 중앙 서버에서 혼합/가공하여 수신측으로 전달하는 중앙 서버 방식. N:M에 적합
  -peer의 부하가 현저히 줄어들지만, 중앙 서버의 부하가 급격히 늘어난다
*/

/*
  @@ 동영상 압축 기술(MPEG) : 영상 배포의 필요성과 용량 압축의 필요성을 해결
  
  가장 많이 사용되는 포맷은 MPEG4이며, 64Kbps급의 낮은 속도와, 높은 압축률을 구현한다
  가장 흔히 사용되고, 고화질 영상의 뛰어난 압축 효율성을 보이는 H.264 코덱과 함께 사용된다

  -코덱 : 영상이나 음성 신호를 디지털 신호로 변환하거나 반대로 변환하는 기능을 수행하는 기술
*/