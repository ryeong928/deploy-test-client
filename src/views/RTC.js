import { useRef, useEffect } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import StyledContent from '../styled/content'
import { socket } from '../App'

let mediaStream
let PC = new RTCPeerConnection({iceServers: [{urls: [
  "stun:stun.l.google.com:19302",
  "stun:stun2.l.google.com:19302",
  "stun:stun4.l.google.com:19302",
]}]})


export default function RTC(){
  const navigate = useNavigate()
  const props = useLocation().state
  const {name} = useParams()
  const localRef = useRef(null)
  const remoteRef = useRef(null)

  useEffect(() => {
    if(props !== name) {
      window.alert("권한이 없습니다")
      return navigate('/', {replace: true})
    }
    socket.on("join", async () => {
      const offer = await PC.createOffer()
      PC.setLocalDescription(offer)
      console.log("offer sent: ", offer)
      socket.emit("offer", offer)
    })
    socket.on("offer", async (offer) => {
      console.log("offer received: ", offer)
      PC.setRemoteDescription()
      const answer = await PC.createAnswer()
      PC.setLocalDescription(answer)
      console.log("answer sent: ", answer)
      socket.emit("answer", answer)
    })
    socket.on("answer", (answer) => {
      console.log("answer received: ", answer)
      PC.setRemoteDescription(answer)
    })
    socket.on("ice", (ice) => {
      console.log("ice received: ", ice)
      PC.setRemoteDescription(ice)
    })
    PC.addEventListener("icecandidate", (d) => {
      console.log("ice sent: ", d)
      socket.emit("ice", d)
    })
    PC.addEventListener("addstream", (d) => {
      console.log("add remote stream")
      remoteRef.current.srcObject = d.stream
    })
    async function init(){
      try{
        // get media
        const initialConstraints = {audio: true, video: {facingMode: "user"}}
        mediaStream = await window.navigator.mediaDevices.getUserMedia(initialConstraints)
        localRef.current.srcObject = mediaStream
        // add track
        mediaStream.getTracks().forEach(t => PC.addTrack(t, mediaStream))
        //
        socket.emit("join", name)

      }catch(err){
        console.log(err)
      }
    }
    init()
    return () => socket.emit("leave")
  }, [name, navigate, props])

  function leaveRoom(){
    socket.emit("leave")
    navigate('/')
  }

  return(
    <StyledContent.RTC>
      <header>RTC room {name}</header>
      <main>
        <video ref={localRef} autoPlay />
        <video ref={remoteRef} autoPlay />
      </main>
      <footer>
        <button onClick={leaveRoom}>Leave</button>
      </footer>
    </StyledContent.RTC>
  )
}