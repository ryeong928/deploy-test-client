import { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

const DataTableContainer = styled.div`
  width: 100%;
  & > table{
    width: 100%;
    border-collapse: collapse;
    cursor: pointer;
    text-align: center;
    white-space: nowrap;
    & tr{
      align: center;
    }
    & td{
      padding: 5px 10px;
    }
    & > thead{
      background-color: navy;
      color: white;
      & > tr{
        & > td{
          padding: 10px;
          &:hover{
            background-color: royalblue;
          }
        }
      }
    }
    & > tbody{
      background-color: #e6e6e6;
      & > tr{
        &:hover{
          background-color: white;
        }
      }
    }
  }
`

export default function DataTable({data, options}){
  // 초기 데이터
  const [DATA, setDATA] = useState(data)
  const HEADER = useRef(null)
  const [SORT, setSORT] = useState({type: options.sorting.default, order: 'asc'})

  useEffect(() => {
    if(!data || !data.length) return console.log("데이터가 없습니다")
    setDATA(data)
    HEADER.current = Object.keys(data[0])
  }, [data])

  // 정렬 기준 선택
  const onClickSort = useCallback((e) => {
    const item = e.currentTarget?.textContent
    if(!item) return
    setSORT(prev => {
      let sort = {...prev}
      if(prev.type !== item) {
        sort.type = item
        sort.order = 'asc'
      }
      else if(prev.order === 'asc') sort.order = 'des'
      else {
        sort.type = options.sorting.default
        sort.order = 'asc'
      } 
      return sort
    })
  }, [])

  // 정렬 기준 변화에 따른 적용
  useEffect(() => {
    if(!DATA || !DATA.length) return console.log("정렬할 데이터가 없습니다")
    setDATA(sorting(DATA, SORT))
  }, [SORT])

  // 항목 클릭시, 데이터에서 해당 항목 찾기. 기준 : num
  function onClickItem (e) {
    let id = e.target?.dataset?.id
    if(!id) id = e.target.closest("tr")?.dataset?.id
    if(!id) return
    const item = DATA.find(d => d.num === Number(id))
    console.log('선택한 데이터 항목: ', item)
  }

  // option : finding
  const inputRef = useRef(null)
  function onKeyDown(e){
    if(e.key === "Enter") onClickFinding()
  }
  function onClickFinding(){
    if(!inputRef.current) return console.log('inputRef.current is null')
    const temp = sorting(data, SORT)
    const value = inputRef.current.value
    setDATA(finding(temp, options.finding, value))
  }

  return(
    <DataTableContainer>
      {options.finding && HEADER.current && (
        <div>
          <input type="text" ref={inputRef} placeholder={options.finding} onKeyDown={onKeyDown}/>
          <button type="button" onClick={onClickFinding}>검색</button>
        </div>
      )}
      {!HEADER.current ? <div>데이터가 없습니다</div> : (
        <table>
          <thead>
            <tr >{HEADER.current.map(v => <td key={v} onClick={onClickSort}>{v}</td>)}</tr>
          </thead>
          <tbody onClick={onClickItem}>
            {DATA.map(d => (
              <tr key={`tr${d.num}`} data-id={d.num}>
                {HEADER.current.map((v, i) => <td key={`td${d.num}${i}`}>{d[v]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </DataTableContainer>
  )
}

// util
function sorting (array, sort) {
  let {type, order} = sort
  return [...array].sort((a, b) => {
    if(typeof a[type] === "string"){
      const A = a[type].toUpperCase()
      const B = b[type].toUpperCase()
      if(order === "asc") {
        if(A > B) return 1
        if(A < B) return -1
        if(A === B) return 0
      }
      if(order === "des") {
        if(A < B) return 1
        if(A > B) return -1
        if(A === B) return 0
      }
    }else{
      if(order === "asc") return a[type] - b[type]
      if(order === "des") return b[type] - a[type]
    }
  })
}
function finding(array, finding, value){
  if(!value) return array
  else return array.filter(d => d[finding].toUpperCase().includes(value.toUpperCase()))
}