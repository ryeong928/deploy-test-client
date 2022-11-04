import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import StyledContent from '../styled/content'
import axios from "../api"

let mediaStream
let PC
// 현재 사용가능한 input devices 리스트를 반환한다
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
// 나의 mediaStream를 반환한다
async function getMediaStream(deviceId = {}){
  try{
    const {V, A} = deviceId
    const constraints = {
      video: {
        facingMode: "user",
      }, 
      audio: A ? {deviceId: {exact: A}} : true
    }
    if(V) constraints.video.deviceId = {exact: V}
    return await window.navigator.mediaDevices.getUserMedia(constraints)
  }catch(err){
    console.log('getMediaStream err: ', err)
  }
}
async function setCodecPreferences(){
  try{
    const tcvr = PC.getTransceivers()[1]
    const codecs = RTCRtpReceiver.getCapabilities('video').codecs
    const h264 = []
    const etc = []
    codecs.forEach(c => {
      if(c.mimeType.includes('264')) return h264.push(c)
      return etc.push(c)
    })
    const prefered = h264.concat(etc)
    if(tcvr.setCodecPreferences) tcvr.setCodecPreferences(prefered)
    // 102 122 127 121 125 107 108 109 124 120 39 40 123 119 96 97 98 99 100 101 45 46 114 115 116
    // 102     127     125     108     124     39    123
  }catch(err){
    console.log("set codec parameters : ", err)
  }
}
function checkVideoTrack(){
  console.log('video track constraints : ', [mediaStream.getVideoTracks()[0].getConstraints(), mediaStream.getVideoTracks()[0].getSettings()])
}

// 문자열 데이터 byte 사이즈 
function getStringSize(str){
  return new Blob([str]).size
}

export default function Home(){
  const navigate = useNavigate()
  const localRef = useRef(null)
  const [videos, setVideos] = useState([])
  const [audios, setAudios] = useState([])
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const rommNameRef = useRef(null)
  const [rooms, setRooms] = useState([])
  const [rotate, setRotate] = useState(false)
  const [SDP, setSDP] = useState()
  const [capa, setCapa] = useState()
  const []
  const getMedia = useCallback(async function (deviceId = {}){
    console.log("getMedia : ", deviceId.V, deviceId.A)
    try{
      // 사용중이던 장치 사용 중지
      mediaStream?.getTracks().forEach(t => t.stop())
      // 카메라/오디오 입출력 연결
      mediaStream = await getMediaStream(deviceId)
      localRef.current.srcObject = mediaStream
      // 사용 가능한 입력 장치 리스트
      getDevices().then(res => {
        setVideos(res.videos)
        setAudios(res.audios)
      })
      // 현재 사용중인 카메라/오디오
    }catch(err){
      console.log(err)
    }
  }, [])
  const connect = useCallback(() => {
    PC = new RTCPeerConnection()
    mediaStream.getTracks().forEach(t => PC.addTrack(t, mediaStream))
  }, [])
  const stop = useCallback(() => {
    mediaStream?.getTracks().forEach(t => t.stop())
    mediaStream = null
    PC?.close()
    PC = null
  }, [])

  useEffect(() => {
    getRooms()
  }, [])

  useEffect(() => {
    Promise.resolve(true)
    .then(() => getMedia())
    .then(() => connect())
    .then(() => setCodecPreferences())
    .then(() => PC.createOffer().then(setSDP))
    return () => stop()
  }, [getMedia, connect, stop])

  function onoffVideo(){
    mediaStream.getVideoTracks().forEach(track => track.enabled = !track.enabled)
    setIsVideoOn(prev => !prev)
  }
  function onoffAudio(){
    mediaStream.getAudioTracks().forEach(t => t.enabled = !t.enabled)
    setIsAudioOn(prev => !prev)
  }
  async function changeResolution(){
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

    getDevices().then(res => {
      setVideos(res.videos)
      setAudios(res.audios)
    })
  }
  async function changeFrameRate(){
    try{
      if(!mediaStream) return window.alert("연결된 장치가 없습니다")
      mediaStream.getTracks().forEach(t => t.stop())

      const VC = mediaStream.getVideoTracks()[0].getConstraints()
      VC.frameRate = VC.frameRate === 10 ? 30 : 10
      const constraints = {
        video: VC,
        audio: true
      }
      mediaStream = await window.navigator.mediaDevices.getUserMedia(constraints)
      localRef.current.srcObject = mediaStream
    }catch(err){
      console.log('changeFrameRate error: ', err)
    }
  }
  async function changeChannel(){
    mediaStream?.getTracks().forEach(t => t.stop())

    const VC = mediaStream.getVideoTracks()[0].getConstraints()
    VC.facingMode = VC.facingMode === "user" ? "environment" : "user"
    const constraints = {
      video: VC,
      audio: true
    }
    mediaStream = await window.navigator.mediaDevices.getUserMedia(constraints)
    localRef.current.srcObject = mediaStream

    getDevices().then(res => {
      setVideos(res.videos)
      setAudios(res.audios)
    })
  }
  function checkCapa(){
    const audios = {}
    const videos = {}
    const audioCodecs = RTCRtpReceiver.getCapabilities('audio').codecs
    const videoCodecs = RTCRtpReceiver.getCapabilities('video').codecs
    audioCodecs.forEach(c => audios[c.mimeType] = c.mimeType)
    videoCodecs.forEach(c => videos[c.mimeType] = c.mimeType)
    setCapa([...Object.keys(audios), ...Object.keys(videos)])
  }

  function enterRoom(e, type){
    if(type === "create") return navigate(`rtc/${rommNameRef.current.value}`, {state: rommNameRef.current.value})
    if(type === "join") return navigate(`rtc/${e.target.textContent}`, {state: e.target.textContent})
  }
  function getRooms(){
    axios.get('/rooms').then(res => setRooms(res.data)).catch(err => console.log(err))
  }

  if(false){
    console.log([videos, audios])
  }
  return(
    <StyledContent.Home>
      <header>Home</header>
      <button onClick={getRooms}>refresh</button>
      <ul>{rooms.map(r => <li onClick={(e) => enterRoom(e, 'join')} key={r}>{r}</li>)}</ul>
      <section>
        <input type="text" ref={rommNameRef} placeholder="room name" />
        <button onClick={(e) => enterRoom(e, 'create')}>enter</button>
      </section>
      <video className={rotate ? 'video-rotate' : ''} ref={localRef} autoPlay controls width={500} height={500}/>
      <section>
        <button onClick={onoffVideo}>Camera {isVideoOn ? "On" : "Off"}</button>
        <button onClick={onoffAudio}>Audio {isAudioOn ? "On" : "Off"}</button>
      </section>
      <section>
        <button onClick={changeResolution}>Change Resolution</button>
        <button onClick={changeFrameRate}>Change FrameRate</button>
        <button onClick={changeChannel}>Change Channel</button>
        <button onClick={() => setRotate(prev => !prev)}>Rotate View</button>
      </section>
      <section>
        <button onClick={checkVideoTrack}>Check Constraints/Settings</button>
      </section>
      <div>
        <button onClick={checkCapa}>Check Local System Receive Capabilities</button>
        <div>{capa?.map((c, i) => <div key={`capa/${i}`}>{c}</div>)}</div>
      </div>
      {SDP && (
        <footer>
          <h3>{SDP.type}: {getStringSize(JSON.stringify(SDP))}Bytes</h3>
          <div style={{whiteSpace: "pre-line"}}>{SDP.sdp}</div>
        </footer>
      )}
    </StyledContent.Home>
  )
}

// <aside onClick={() => navigate('/broadcast')}>Broadcast</aside>
// 