import { Routes, Route, useLocation } from 'react-router-dom'
import Layout from './views/Layout'
import Home from './views/Home'
import { useEffect } from 'react'
import axios from './api'
import createSocket from './socket'
import RTC from './views/RTC'
import Broadcast from './views/Broadcast'
import Test from './views/Test'
import Datas from './views/Datas'
export const ws = createSocket()

function Router(){
  return(
    <Routes >
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="rtc/:name" element={<RTC />} />
        <Route path="broadcast" element={<Broadcast />} />
        <Route path="test" element={<Test />} />
        <Route path="datas" element={<Datas />} />
      </Route>
    </Routes>
  )
}

function App() {
  useEffect(() => {
    axios.get('/').then(res => console.log('HTTP 서버 연결 ', res.data)).catch(err => console.log(err))
    return () => ws.close()
  }, [])
  return (
    <Router />
  );
}

export default App;
