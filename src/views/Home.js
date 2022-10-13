import { useRef } from "react"
import { useNavigate } from "react-router-dom"
import StyledContent from '../styled/content'

export default function Home(){
  const navigate = useNavigate()
  const rommNameRef = useRef(null)
  const dcNameRef = useRef(null)
  const peerRef = useRef(null)
  const rooms = []

  function enterRoom(type){
    if(type === "rtc") navigate(`room/${rommNameRef.current.value}`, {state: rommNameRef.current.value})
    if(type === "dc") navigate(`datachannel/${dcNameRef.current.value}`, {state: dcNameRef.current.value})
    if(type === "peer") navigate(`peerjs/${peerRef.current.value}`, {state: peerRef.current.value})
    
  }
  return(
    <StyledContent.Home>
      <header>Home</header>
      <ul>{rooms.map(r => <li key={r}>{r}</li>)}</ul>
      <section>
        <input type="text" ref={rommNameRef} placeholder="rtc room" />
        <button onClick={()=>enterRoom("rtc")}>enter</button>
      </section>
      <section>
        <input type="text" ref={dcNameRef} placeholder="datachannel room" />
        <button onClick={()=>enterRoom("dc")}>enter</button>
      </section>
      <section>
        <input type="text" ref={peerRef} placeholder="peerjs room" />
        <button onClick={()=>enterRoom("peer")}>enter</button>
      </section>
    </StyledContent.Home>
  )
}