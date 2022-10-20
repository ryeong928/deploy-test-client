import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import StyledContent from '../styled/content'
import axios from "../api"

let mediaStream
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
    const {videoId, audioId} = deviceId
    const constraints = {
      video: videoId ? {deviceId: {exact: videoId}} : true, 
      audio: audioId ? {deviceId: {exact: audioId}} : true}
    return await window.navigator.mediaDevices.getUserMedia(constraints)
  }catch(err){
    console.log('getMediaStream err: ', err)
  }
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

  const getMedia = useCallback(async function (deviceId = {}){
    try{
      // 사용중이던 장치 사용 중지
      mediaStream?.getTracks().forEach(t => t.stop())
      // 사용 가능한 입력 장치 리스트
      getDevices(deviceId).then(res => {
        setVideos(res.videos)
        setAudios(res.audios)
      })
      // 카메라/오디오 입출력 연결
      mediaStream = await getMediaStream()
      localRef.current.srcObject = mediaStream
      console.log('mediaStream: ', mediaStream)
      // 현재 사용중인 카메라/오디오
      setCrtVideo(mediaStream.getVideoTracks()[0])
      setCrtAudio(mediaStream.getAudioTracks()[0])
    }catch(err){
      console.log(err)
    }
  }, [])

  useEffect(() => {
    getMedia()
  }, [getMedia])
  function enterRoom(){
    navigate(`rtc/${rommNameRef.current.value}`, {state: rommNameRef.current.value})
  }
  function getRooms(){
    axios.get('/rooms').then(res => setRooms(res.data)).catch(err => console.log(err))
  }
  useEffect(() => {
    getRooms()
  }, [])
  console.log('사용가능 비디오 디바이스: ', videos)
  console.log('사용가능 오디오 디바이스: ', audios)
  console.log('사용중인 디바이스: ', [crtVideo.label, crtAudio.label])

  function changeVideo(e){
    setCrtVideo(videos.find(v => v.deviceId === e.target.value))
    getMedia({videoId: e.target.value})
  }
  function changeAudio(e){
    setCrtAudio(audios.find(a => a.deviceId === e.target.value))
    getMedia({audioId: e.target.value})
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
    <StyledContent.Home>
      <header>Home</header>
      <button onClick={getRooms}>refresh</button>
      <ul>{rooms.map(r => <li key={r}>{r}</li>)}</ul>
      <section>
        <input type="text" ref={rommNameRef} placeholder="room name" />
        <button onClick={enterRoom}>enter</button>
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