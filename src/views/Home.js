import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import StyledContent from '../styled/content'
import axios from "../api"

/*
  0. /room/name/user/id get 요청으로 인해 서버에서 무슨 동작을 하는지??

  1. 웹소켓 연결

  2. send({from: id, type: join, data: name})

  3. onmessage data false | true

  4. true => create offer
*/
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
      video: V ? {deviceId: {exact: V}} : true, 
      audio: A ? {deviceId: {exact: A}} : true
    }
    return await window.navigator.mediaDevices.getUserMedia(constraints)
  }catch(err){
    console.log('getMediaStream err: ', err)
  }
}
function getStringSize(str){
  return (function(str, b, i, c){
    for(b = i = 0; c = str.charCodeAt(i) ;b+=c >> 11 ? 3 : c >> 7 ? 2 : 1){
      i++
    };
    return b
  }(str))
}

export default function Home(){
  const localRef = useRef(null)
  const [videos, setVideos] = useState([])
  const [audios, setAudios] = useState([])
  const [crtVideo, setCrtVideo] = useState('')
  const [crtAudio, setCrtAudio] = useState('')
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
      // 사용 가능한 입력 장치 리스트
      getDevices().then(res => {
        setVideos(res.videos)
        setAudios(res.audios)
      })
      // 카메라/오디오 입출력 연결
      mediaStream = await getMediaStream(deviceId)
      localRef.current.srcObject = mediaStream
      // 현재 사용중인 카메라/오디오
      setCrtVideo(mediaStream.getVideoTracks()[0])
      setCrtAudio(mediaStream.getAudioTracks()[0])
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
    .then(() => {
      PC.createOffer().then(offer => {
        setSDP(offer)
      })
    })
    return () => stop()
  }, [getMedia, connect, stop])

  async function changeVideo(e){
    setCrtVideo(videos.find(v => v.deviceId === e.target.value))
    await getMedia({V: e.target.value})
  }
  async function changeAudio(e){
    setCrtAudio(audios.find(a => a.deviceId === e.target.value))
    await getMedia({A: e.target.value})
  }
  function onoffVideo(){
    mediaStream.getVideoTracks().forEach(track => track.enabled = !track.enabled)
    setIsVideoOn(prev => !prev)
  }
  function onoffAudio(){
    mediaStream.getAudioTracks().forEach(t => t.enabled = !t.enabled)
    setIsAudioOn(prev => !prev)
  }
  function enterRoom(e, type){
    if(type === "create") return navigate(`rtc/${rommNameRef.current.value}`, {state: rommNameRef.current.value})
    if(type === "join") return navigate(`rtc/${e.target.textContent}`, {state: e.target.textContent})
  }
  function getRooms(){
    axios.get('/rooms').then(res => setRooms(res.data)).catch(err => console.log(err))
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
      <video ref={localRef} autoPlay controls/>
      <section>
        <select onChange={changeVideo}>
          {videos.map(v => (<option key={v.deviceId} value={v.deviceId} selected={v.label === crtVideo.label}>{v.label}</option>))}
        </select>
        <select onChange={changeAudio}>
          {audios.map(a => (<option key={a.deviceId} value={a.deviceId} selected={a.label === crtAudio.label}>{a.label}</option>))}
        </select>
      </section>
      <section>
        <button onClick={onoffVideo}>Camera {isVideoOn ? "On" : "Off"}</button>
        <button onClick={onoffAudio}>Audio {isAudioOn ? "On" : "Off"}</button>
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

  MediaStream
  .addTrack()
  .getTracks()
  .getTrackById()
  .getVideoTracks() : 해당 스트림의 video track을 나타내는 MediaStreamTrack 인스턴스 배열을 반환
  .getAudioTracks() : 해당 스트림의 audio track을 나타내는 MediaStreamTrack 인스턴스 배열을 반환
*/