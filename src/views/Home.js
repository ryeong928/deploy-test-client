import { useRef } from "react"
import { useNavigate } from "react-router-dom"
import StyledContent from '../styled/content'

export default function Home(){
  const navigate = useNavigate()
  const rommNameRef = useRef(null)
  const rooms = []

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