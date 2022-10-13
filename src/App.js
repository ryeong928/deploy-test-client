import { Routes, Route } from 'react-router-dom'
import Layout from './views/Layout'
import Home from './views/Home'
import { createContext, useEffect } from 'react'
import axios from './api'
import createSocket from './socket'
import RTC from './views/RTC'
export const socket = createSocket()
export const SocketContext = createContext()

function Router(){
  return(
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="rtc/:name" element={<RTC />} />
      </Route>
    </Routes>
  )
}

function App() {
  useEffect(() => {
    axios.get('/').then(res => console.log('HTTP 서버 연결 ', res.data)).catch(err => console.log(err))
  }, [])
  return (
    <SocketContext.Provider value={socket}>
      <Router />
    </SocketContext.Provider>
  );
}

export default App;
