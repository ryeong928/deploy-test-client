import {StyledMap} from '../styled'
import 'chart.js/auto'
import { Line } from 'react-chartjs-2'
import { useState, useEffect, useRef } from 'react'

const CurrentGPS = ({gpsList, currentTime}) => {
  const [minutes, seconds] = currentTime.split(":")
  const time = Number(minutes) * 60 + Number(seconds)
  return(
    <StyledMap.CurrentGPS placeholder={`${gpsList[time].lat}:${gpsList[time].lng}`}>
      {gpsList.length > 0 && (<>
        <div>lat: {gpsList[time].lat} lng: {gpsList[time].lng}</div>
        <div />
      </>)}
    </StyledMap.CurrentGPS>
  )
}
const CurrentGsensor = ({sensorDataList, currentTime, setCurrentTime, duration}) => {
  const [minutes, seconds] = currentTime.split(":")
  const time = Number(minutes) * 60 + Number(seconds)
  const chartRef = useRef(null)
  const labels = Array.from({length:duration}).map((v,i) => (`${i}s`))
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if(!chartRef.current) return
    function handleResize(e){
      const w = chartRef.current.clientWidth
      setWidth(w)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  function onClick (e){
    setCurrentTime(e.chart.scales.x.getValueForPixel(e.x))
    console.log(width)
  }

  return(
    <StyledMap.CurrentGsensor ref={chartRef} placeholder={`${time * 1.305}`}>
      {sensorDataList.x.length > 0 && (<>
        <div className='current-time-area'/>
        <Line
          data={{
            labels,
            datasets: [
              {
                label: 'X',
                data: sensorDataList.x,
                borderColor: 'red',
                pointBackgroundColor: 'red',
                borderWidth: 0.5,
                pointRadius: 1,
                lineTension: 0,
                fill: false,
              },
              {
                label: 'Y',
                data: sensorDataList.y,
                borderColor: 'blue',
                pointBackgroundColor: 'blue',
                borderWidth: 0.5,
                pointRadius: 1,
                lineTension: 0,
                fill: false,
              },
              {
                label: 'Z',
                data: sensorDataList.z,
                borderColor: 'green',
                pointBackgroundColor: 'green',
                borderWidth: 0.5,
                pointRadius: 1,
                lineTension: 0,
                fill: false,
              },
            ],
          }}
          options={{
            plugins: {
              legend: {
                display: false,
              }
            },
            scales: {
              x: {
                ticks: {
                  display: false,
                  padding: 0
                },
                grid: {
                  display: false,
                }
              },
              y: {
                ticks: {
                  display: false,
                },
                min: -10,
                max: 10
              }
            },
            interaction: {
              intersect: false,
              mode: 'index',
            },
            onClick,
            responsive: true,
            maintainAspectRatio: false
          }}
        />
      </>)}
    </StyledMap.CurrentGsensor>
  )
}
const Map = {
  CurrentGPS,
  CurrentGsensor,
}
export default Map