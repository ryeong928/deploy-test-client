import { useEffect, useRef, useState } from 'react'
import StyledContent from '../../styled/content'
import DataTable from './DataTable'

const data_region = {
  kr: Array.from({length: 5}).map((v, i) => `kr${i}`),
  jp: Array.from({length: 3}).map((v, i) => `jp${i}`),
  ch: Array.from({length: 6}).map((v, i) => `ch${i}`),
  uk: Array.from({length: 4}).map((v, i) => `uk${i}`),
  us: Array.from({length: 11}).map((v, i) => `us${i}`),
  ca: Array.from({length: 7}).map((v, i) => `ca${i}`),
  eu: Array.from({length: 8}).map((v, i) => `eu${i}`),
}
const data_state = {
  total: '전체',
  out: '출고',
  in: '입고',
  repair: '수리',
  disposal: '폐기'
}

function filtering(array, criterion, value){
  return !value ? array : array.filter(d => String(d[criterion]).toUpperCase().includes(value.toUpperCase()))
}

export default function Datas(){
  const dataRef = useRef()
  const [meta, setMeta] = useState()
  const [data, setData] = useState()
  const [nation, setNation] = useState()
  const [city, setCity] = useState()
  const [startDate, setStartDate] = useState()
  const [endDate, setEndDate] = useState()
  const [filteringCriterion, setFilteringCriterion] = useState()

  
  useEffect(() => {
    const nations = Object.keys(data_region)
    const DATA = Array.from({length: 2154}).map((v, i) => {
      const random = Math.random()
      const random_S = String(random)
      const created = `202${Math.round(random * 2)}-${String(Math.round(Math.random() * 11 + 1)).padStart(2, '0')}-${String(Math.round(Math.random() * 29 + 1)).padStart(2, '0')}`
      const nation = nations[Math.round(Math.random() * (nations.length - 1))]
      const cities = data_region[nation]
      return {
        num: i,
        model: `MODEL${Math.round(Math.random() * 10)}`,
        serial: `${random_S.slice(2, 7)}-${random_S.slice(7, 12)}-${random_S.slice(12)}`,
        created,
        state: random > 0.4 ? 'out' : random > 0.2 ? 'in' : random > 0.05 ? 'repair' : 'disposal',
        nation,
        city: cities[Math.round(Math.random() * (cities.length - 1))]
      }
    })
    const temp_state = {
      total: DATA.length,
      out: 0,
      in: 0,
      repair: 0,
      disposal: 0
    }
    DATA.forEach(d => {
      if(d.state === 'out') temp_state.out++
      if(d.state === 'in') temp_state.in++
      if(d.state === 'repair') temp_state.repair++
      if(d.state === 'disposal') temp_state.disposal++
    })
    dataRef.current = DATA
    setMeta(temp_state)
  }, [])
  useEffect(() => {
    if(!filteringCriterion) return

  }, [filteringCriterion])
  function onSetFilteringCriterion(e){
    if(false) setFilteringCriterion()
  }
  function selectNation(e){
    setNation(e.target.value)
  }
  function selectCity(e){
    setCity(e.target.value)
  }
  function setDate(e){
    const {id} = e.target.dataset
    if(id === "start") setStartDate(e.target.value)
    if(id === 'end') setEndDate(e.target.value)
  }
  function queryData(){
    const temp1 = filtering(dataRef.current, 'nation', nation)
    const temp2 = filtering(temp1, 'city', city)
    const temp3 = temp2.filter(t => {
      if(startDate && endDate) return t.created > startDate && t.created < endDate
      else if(startDate) return t.created > startDate
      else if(endDate) return t.created < endDate
      return true
    })
    setData(temp3)
  }
  return(
    <StyledContent.Datas>
      <header>
        {meta && (<div>
          {Object.keys(data_state).map(s => <div key={s} data-state={s} onClick={onSetFilteringCriterion}>{data_state[s]} : {meta[s]}</div>)}
        </div>)}

        <div>
          <select onChange={selectNation}>
            <option value={undefined}>-nation-</option>
            {Object.keys(data_region).map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <select onChange={selectCity}>
            <option value={undefined}>-city-</option>
            {nation && data_region[nation].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="date" onChange={setDate} data-id='start'/>
          <input type="date" onChange={setDate} data-id='end'/>
          <button onClick={queryData}>query</button>
        </div>
      </header>
      <main>
        {data && (
          <DataTable data={data} options={{
              sorting: 'num',
              filtering: {},
              searching: true,
              selecting: true,
              paginationing: 20,
              data: {
                exclude: ['nation', 'city']
              }
            }} />
        )}
      </main>
    </StyledContent.Datas>
  )
}
/*
  1. 전체 리스트 요청 하기전에, 필터링할 항목은? 이 항목을 재적용 하려면 서버로 재요청을 하는 식으로 할건지?

  2. 정렬 기준 항목이 어떤게 있는지
*/