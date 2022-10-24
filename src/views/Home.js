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
    window.alert("getDevices err")
  }
}
// 나의 mediaStream를 반환한다
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
    console.log("constraints: ", constraints)
    return await window.navigator.mediaDevices.getUserMedia(constraints)
  }catch(err){
    console.log('getMediaStream err: ', err)
  }
}
// 문자열 데이터 byte 사이즈 
function getStringSize(str){
  return new Blob([str]).size
}

export default function Home(){
  const localRef = useRef(null)
  const [videos, setVideos] = useState([])
  const [audios, setAudios] = useState([])
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const navigate = useNavigate()
  const rommNameRef = useRef(null)
  const [rooms, setRooms] = useState([])

  const [SDP, setSDP] = useState()

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
    if(mediaStream){
      mediaStream.getTracks().forEach(t => t.stop())
      mediaStream = null
    }
    if(PC){
      PC.close()
      PC = null
    }
  }, [])

  useEffect(() => {
    getRooms()
  }, [])

  useEffect(() => {
    Promise.resolve(true)
    .then(() => getMedia())
    .then(() => connect())
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

    const VC = crtVideo.getConstraints()
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
  async function changeChannel(){
    mediaStream?.getTracks().forEach(t => t.stop())

    const VC = crtVideo.getConstraints()
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

  function enterRoom(e, type){
    if(type === "create") return navigate(`rtc/${rommNameRef.current.value}`, {state: rommNameRef.current.value})
    if(type === "join") return navigate(`rtc/${e.target.textContent}`, {state: e.target.textContent})
  }
  function getRooms(){
    axios.get('/rooms').then(res => setRooms(res.data)).catch(err => console.log(err))
  }
  function checkVideoTrack(){
    console.log('VT Constraints from crtVideo : ', [crtVideo.getConstraints(), crtVideo.getSettings(), mediaStream.getVideoTracks()[0].getConstraints()])
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
      <video ref={localRef} autoPlay controls width={500} height={500}/>
      <section>
        <button onClick={onoffVideo}>Camera {isVideoOn ? "On" : "Off"}</button>
        <button onClick={onoffAudio}>Audio {isAudioOn ? "On" : "Off"}</button>
      </section>
      <section>
        <button onClick={changeResolution}>Change Resolution</button>
        <button onClick={changeChannel}>Change Channel</button>
      </section>
      <section>
        <button onClick={checkVideoTrack}>Check Constraints</button>
      </section>
      {SDP && (
        <footer>
          <h3>{SDP.type}: {getStringSize(JSON.stringify(SDP))}Bytes</h3>
          <div style={{whiteSpace: "pre-line"}}>{SDP.sdp}</div>
        </footer>
      )}
    </StyledContent.Home>
  )
}
/*

  window.navigator.mediaDevices
    .enumerateDevices() : 연결된 I/O devices의 MediaDeviceInfo 배열을 반환한다
    .getUserMedia() : 유저 허락을 받아 비디오/음성 device를 키고, 각 input device의 MediaStream을 반환한다

*/