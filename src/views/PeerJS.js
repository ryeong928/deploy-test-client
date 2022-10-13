import { Peer } from 'peerjs'
import { useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import StyledContent from '../styled/content'

const LP = new Peer(String(process.env.pid), {
  host: 'localhost',
  port: 4000,
  path: '/myapp'
})
console.log(LP)

export default function PeerJS(){
  const navigate = useNavigate()
  const {name} = useParams()
  const props = useLocation().state
  // video
  const localRef = useRef(null)
  const remoteRef = useRef(null)

  useEffect(() => {
    if(props !== name) {
      window.alert("권한이 없습니다")
      return navigate('/', {replace: true})
    }
   

  }, [name, props, navigate])

  return(
    <StyledContent.DataChannel>
      <header>PeerJS room {name}</header>
      <main>
        <video ref={localRef} autoPlay />
        <video ref={remoteRef} autoPlay />
      </main>
    </StyledContent.DataChannel>
  )
}