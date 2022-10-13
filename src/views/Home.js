import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import StyledContent from '../styled/content'
import axios from "../api"

export default function Home(){
  const navigate = useNavigate()
  const rommNameRef = useRef(null)
  const [rooms, setRooms] = useState([])

  function enterRoom(){
    navigate(`rtc/${rommNameRef.current.value}`, {state: rommNameRef.current.value})
  }
  function getRooms(){
    axios.get('/rooms').then(res => setRooms(res.data)).catch(err => console.log(err))
  }
  useEffect(() => {
    axios.get('/rooms').then(res => setRooms(res.data)).catch(err => console.log(err))
  }, [])
  return(
    <StyledContent.Home>
      <header>Home</header>
      <button onClick={getRooms}>refresh</button>
      <ul>{rooms.map(r => <li key={r}>{r}</li>)}</ul>
      <section>
        <input type="text" ref={rommNameRef} placeholder="room name" />
        <button onClick={enterRoom}>enter</button>
      </section>
    </StyledContent.Home>
  )
}