import { useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import StyledContent from "../styled/content";
import { socket } from '../App'

let mediaStream
let PC = new RTCPeerConnection({iceServers: [{urls: [
  "stun:stun.l.google.com:19302",
  "stun:stun2.l.google.com:19302",
  "stun:stun3.l.google.com:19302",
  "stun:stun4.l.google.com:19302",
]}]})
let start = true
PC.addEventListener("icecandidate", (e) => {
  if(!start) return
  console.log('icecandidate send')
  socket.emit("ice", e.candidate)
})
PC.addEventListener("addstream", (e) => {
  console.log("addstream happened")
})
let DC


export default function DataChannel(){
  const navigate = useNavigate()
  const {name} = useParams()
  const props = useLocation().state
  // video
  const localRef = useRef(null)
  const remoteRef = useRef(null)

  const setLocalVideo = useCallback(async () => {
  }, [])
  const init = useCallback(async () => {
    try{
      const constraints = {audio: true, video: true}
      mediaStream = await window.navigator.mediaDevices.getUserMedia(constraints)
      localRef.current.srcObject = mediaStream
      mediaStream.getTracks().forEach(t => PC.addTrack(t, mediaStream))
      socket.emit("join", name)
    }catch(err){
      console.log(err)
    }
  }, [name])

  useEffect(() => {
    if(props !== name) {
      window.alert("권한이 없습니다")
      return navigate('/', {replace: true})
    }
    socket.on("join", async () => {
      console.log("the other joined!")
      DC = PC.createDataChannel("dc")
      DC.addEventListener("open", (e) => {
        console.log("DC open: ", e)
      })
      DC.addEventListener("message", (e) => {
        console.log('DC message: ', e.data)
      })
      start = false
      const offer = await PC.createOffer()
      PC.setLocalDescription(offer)
      console.log("offer send")
      socket.emit("offer", offer)
    })
    socket.on("offer", async (offer) => {
      console.log("offer get")
      PC.addEventListener("datachannel", (e) => {
        console.log("DC open: ", e)
        DC = e.channel
        DC.send("DC connected")
        DC.addEventListener("message", (e) => {
          console.log('DC message: ', e.data)
        })
      })
      PC.setRemoteDescription(offer)
      const answer = await PC.createAnswer()
      PC.setLocalDescription(answer)
      console.log("answer send")
      socket.emit("answer", answer)
    })
    socket.on("answer", (answer) => {
      start = true
      console.log('answer get')
      PC.setRemoteDescription(answer)
    })
    socket.on("ice", (icecandidate) => {
      console.log('icecandidate get')
      PC.addIceCandidate(icecandidate)
    })

    init()

    return () => {
      console.log('data channel unmounted')
      socket.disconnect()
    }
  }, [name, props, init, navigate])





  return(
    <StyledContent.RTC>
      <header>DataChannel room {name}</header>
      <main>
        <video ref={localRef} autoPlay />
        <video ref={remoteRef} autoPlay />
      </main>
    </StyledContent.RTC>
  )
}