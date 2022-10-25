import { Routes, Route } from 'react-router-dom'
import Layout from './views/Layout'
import Home from './views/Home'
import { useEffect } from 'react'
import axios from './api'
import createSocket from './socket'
import RTC from './views/RTC'
import Test from './views/Test'
export const ws = createSocket()

function Router(){
  return(
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="rtc/:name" element={<RTC />} />
        <Route path="test" element={<Test />} />
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
