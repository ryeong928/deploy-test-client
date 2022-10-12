import { io } from 'socket.io-client'

export default function createSocket(){
  let socket = io.connect(process.env.REACT_APP_SERVER_URL, {cors: {origin: '*'}})
  
  socket.on("connect", () => console.log("★ 소켓 연결: ", socket.id))
  socket.on("disconnect", () => {
    console.log("★ 소켓 해제: ", socket.id)
    window.location = "/"
  })
  socket.on("rejected", ({reason}) => window.alert(reason))
  socket.on("error", (data) => console.log(data))

  return socket
}