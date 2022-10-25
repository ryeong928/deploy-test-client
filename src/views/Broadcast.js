import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import StyledContent from '../styled/content'
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
if(false){
  console.log(PC, timer, iceServers)
}
async function getMediaStream(deviceId = {}){
  try{
    const {V, A} = deviceId
    const constraints = {
      video: {
        facingMode: "user",
        width: {exact: 320},
        height: {exact: 240}
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
  ws?.send(JSON.stringify(msg))
}

export default function Broadcast(){
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const [rotate, setRotate] = useState(false)
  const [broadcastInfo, setBroadcastInfo] = useState()

  const getMedia = useCallback(async (deviceId = {}) => {
    mediaStream?.getTracks().forEach(t => t.stop())
    mediaStream = await getMediaStream(deviceId)
    videoRef.current.srcObject = mediaStream
  }, [])

  const connect = useCallback(async () => {

  }, [])

  useEffect(() => {
    if(!ws) {
      window.alert("재입장 해주세요")
      navigate('/')
    }
    ws.onmessage = (e => {
      const {type, data, sub} = JSON.parse(e.data)
      console.log('ws msg: ', type, data, sub)
      if(type !== "broadcast") return

      if(data === 'all'){
        if(sub.participants) setBroadcastInfo(sub)
      }
      if(data === 'error'){
        window.alert("재입장 해주세요")
        navigate('/')
      }
      if(data === 'host'){
        Promise.resolve(true)
        .then(() => getMedia())
        .then(() => connect())
        .then(() => send({type: 'broadcast', data: 'theothers'}))
        .catch(console.log)
      }
    })
    send({type: 'broadcast', data: 'join'})

  }, [getMedia, connect, navigate])

  return(
    <StyledContent.Broadcast>
      <header>WebRTC 1:N Broadcast</header>
      {broadcastInfo && <h3>{`host: ${broadcastInfo.host}, 총 인원: ${broadcastInfo.participants}`}</h3>}
      <main><video className={rotate ? 'rotate' : ''} ref={videoRef} autoPlay controls/></main>
      <section>
        <button onClick={() => setRotate(prev => !prev)}>Rotate View</button>
      </section>
    </StyledContent.Broadcast>
  )
}