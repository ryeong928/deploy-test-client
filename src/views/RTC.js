import { useRef, useContext, useEffect } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { SocketContext } from "../App"
import StyledContent from '../styled/content'

export default function RTC(){
  const navigate = useNavigate()
  const props = useLocation().state
  const socket = useContext(SocketContext)
  const {name} = useParams()
  const localRef = useRef(null)
  const remoteRef = useRef(null)
  useEffect(() => {
    if(props !== name) {
      window.alert("권한이 없습니다")
      return navigate('/', {replace: true})
    }
    socket.emit("join", name)
    return () => socket.emit("leave")
  }, [name, navigate, props, socket])

  return(
    <StyledContent.RTC>
      <header>RTC room {name}</header>
      <main>
        <video ref={localRef} autoPlay />
        <video ref={remoteRef} autoPlay />
      </main>
      <footer>
        <button>fuck</button>
      </footer>
    </StyledContent.RTC>
  )
}