import { useContext, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { SocketContext } from "../App"
import StyledContent from '../styled/content'

export default function Home(){
  const navigate = useNavigate()
  const socket = useContext(SocketContext)
  const rommNameRef = useRef(null)
  const [rooms, setRooms] = useState([])

  function enterRoom(){
    navigate(`room/${rommNameRef.current.value}`, {state: rommNameRef.current.value})
  }
  return(
    <StyledContent.Home>
      <header>Home</header>
      <ul>{rooms.map(r => <li key={r}>{r}</li>)}</ul>
      <section>
        <input type="text" ref={rommNameRef} />
        <button onClick={enterRoom}>enter</button>
      </section>
    </StyledContent.Home>
  )
}