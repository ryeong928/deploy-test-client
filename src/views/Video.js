import { useCallback, useEffect, useRef, useState } from "react"
import axios from "../api"
import Content from '../styled/content'
import Map from '../components/Map'

let lat = 50
let lng = 50
const Fake_gpsList = Array.from({length: 100}).map((v, i) => {
  if(i % 20 < 7){
    lat -= 2
  }else if(i % 20 < 14){
    lng += 2
  }else{
    lat += 4
    lng -= 2
  }
  return {lat, lng}
})
const Fake_sensorDataList = {
  x: Array.from({length: 100}).map((v, i) => {
    if(i % 20 < 5) return Math.floor(Math.random() * 6 - 3)
    else if(i % 20 < 10) return Math.floor(Math.random() * 20 - 10)
    else return Math.floor(Math.random() * 5 - 2.5)
  }),
  y: Array.from({length: 100}).map((v, i) => {
    if(i % 20 < 5) return Math.floor(Math.random() * 6 - 3)
    else if(i % 20 < 10) return Math.floor(Math.random() * 20 - 10)
    else return Math.floor(Math.random() * 5 - 2.5)
  }),
  z: Array.from({length: 100}).map((v, i) => {
    if(i % 20 < 5) return Math.floor(Math.random() * 6 - 3)
    else if(i % 20 < 10) return Math.floor(Math.random() * 20 - 10)
    else return Math.floor(Math.random() * 5 - 2.5)
  }),
}



export default function Video () {
  const vRef = useRef(null)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState('00:00')
  const [file, setFile] = useState()
  const [ing, setIng] = useState(false)
  const [videoList, setVideoList] = useState([])

  // 영상 리스트 불러오기
  useEffect(() => {
    function onfetch(){
      axios.get('files/video/list')
      .then(res => setVideoList(res.data.data))
      .catch(err => console.log('get err, files/video/list: ', err))
    }
    onfetch()
  }, [])
  console.log('videoList: ', videoList)

  // 영상 업로드
  function onUpload(e){
    if(ing) return window.alert("동영상을 업로드 중입니다")
    if(!file) return
    console.log(file)
    setIng(true)
    let formData = new FormData()
    const config = {header: {'content-type':'multipart/form-data'}}
    formData.append('video', file)
    axios.post('files/video/upload', formData, config)
    .then(res => {
      console.log(res)
    })
    .catch(err => console.log('post err, files/video/upload: ', err))
    .finally(() => setIng(true))
  }

  // 영상 메타 데이터 로드 완료시 재생시간 확보
  function onLoadedMetadata(e){
    setDuration(Math.floor(e.target.duration))
  }
  
  // 재생 시점 변경
  const handleTimeChange = useCallback((time) => {
    let hours
    let minutes = Math.floor(time / 60)
    if(minutes > 59) {
      hours = Math.floor(minutes / 60)
      minutes = minutes % 60
    }
    const seconds = Math.floor(time - minutes * 60)
    const now = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    setCurrentTime(hours ? `${String(hours).padStart(2, "0")}:${now}` : now)
  }, [])

  // 비디오 태그 재생 시점 수동 변경
  function changeTime(time){
    vRef.current.currentTime = Number(time)
  }

  // 재생 시점 자동 동기화
  function onTimeUpdate(e){
    handleTimeChange(e.target.currentTime)
  }

  // 영상 조작 로직
  function handleControl(e){
    if(!e.target?.dataset?.action) return 
    const [action, data] = e.target.dataset.action.split(":")
    if(!action) return
    if(action === "to") return changeTime(data)
  }

  return(
    <Content.Video>
      <section>
        <header>video upload</header>
        <main>
          <input type="file" file={file} onChange={(e)=>{setFile(e.target.files[0])}}/>
          {file && (
            <section>
            <div>{file.name}</div>
            <div>{(file.size / 1024 / 1024).toFixed(1)}Mb</div>
            <button onClick={onUpload}>upload</button>
          </section>)}
        </main>
      </section>
      <section>
        <section>
          <header>video play</header>
          <video 
            src={process.env.REACT_APP_SERVER_URL + '/files/video/1664517932283.testvideo2.mp4'} 
            poster={process.env.REACT_APP_SERVER_URL + '/files/image/testimage.png'}
            ref={vRef}
            width={400}
            height={300}
            controls 
            preload={"metadata"}
            autoPlay={false}
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
          />
          <div>{currentTime}</div>
          <footer onClick={handleControl}>
            <button data-action="to:0">0:00</button>
            <button data-action="to:10">0:10</button>
            <button data-action="to:70">1:10</button>
          </footer>
        </section>
        <section>
          <header>video list</header>
          <ul>
            <li>video 1</li>
            <li>video 2</li>
          </ul>
        </section>
      </section>
      <section>
        <header>GPS location</header>
        <main><Map.CurrentGPS gpsList={Fake_gpsList} currentTime={currentTime} /></main>
      </section>
      <section>
        <header>G-sensor chart</header>
        <main><Map.CurrentGsensor sensorDataList={Fake_sensorDataList} currentTime={currentTime} setCurrentTime={changeTime} duration={duration}/></main>
      </section>
    </Content.Video>
  )
}