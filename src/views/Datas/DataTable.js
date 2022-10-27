import { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

const SelectRoundSVG = styled.svg`
  & > g{
    pointerEvents: none;
    stroke: silver;
  }
  &:hover > g{
    stroke: dimgray;
  }
  &.select-round-svg-active > g{
    stroke: red;
  }
`
function SelectButton({color}){
  return (
    <SelectRoundSVG className={color ? "select-round-svg-active" : ""} width="20" height="20" viewBox="0 0 20 20">
      <g>
        <circle cx="10" cy="10" r="8.8" strokeWidth="1.2" fill="transparent" />
        <polyline points="5,9 8.6,13 14.4,7 " strokeWidth="2" fill="transparent" strokeLinecap='round' strokeLinejoin='round'/>
      </g>
    </SelectRoundSVG>
  )
}
const DataTableContainer = styled.div`
  width: 100%;
  & > header{

  }
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
        & > td.table-options-selecting{
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          & > div{
            font-size: 14px;
          }
        }
      }
    }
    & > tbody{
      background-color: #eef0f6;
      & > tr{
        &:hover{
          background-color: white;
        }
        & > td.table-options-selecting{
          min-width: 100px;
          width: 10%;
        }
      }
    }
  }
  & > footer{
    background-color: #eef0f6;
    height: 80px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    font-size: 18px;
    & button{
      width: 26px;
      height: 26px;
      outline: none;
      border: 1px solid gray;
      cursor: pointer;
      &:hover{
        background-color: #333;
        color: white;
      }
      &:active{
        background-color: white;
        color: black;
      }
    }
    & > main{
      display: flex;
      justify-content: center;
      & > button{
        border: none;
        &.table-options-paginationing-active{
          background-color: #777;
          color: white;
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
  // options
  const findingRef = useRef(null)
  const inputRef = useRef(null)
  const [selected, setSelected] = useState([])
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if(!data || !data.length) return console.log("데이터가 없습니다")
    setDATA(data)
    HEADER.current = Object.keys(data[0])
    findingRef.current = HEADER.current[0]
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
  }, [options.sorting.default])

  // 정렬 기준 변화에 따른 적용
  useEffect(() => {
    if(!data || !data.length) return console.log("정렬할 데이터가 없습니다")
    setDATA(prev => sorting(prev, SORT))
  }, [data, SORT])
  // 항목 클릭 + options.selecting
  function onClickItem (e) {
    let id = e.target?.dataset?.id
    if(!id) id = e.target.closest("tr")?.dataset?.id
    if(!id) return
    const item = DATA.find(d => d.num === Number(id))
    options.selecting && setSelected(prev => selecting(prev, item, 'num'))
  }
  // options.selecting
  function selectAll(){
    if(selected.length === DATA.length) setSelected([])
    else setSelected(DATA)
  }

  // options.searching
  function onKeyDown(e){
    if(e.key === "Enter") onClickFinding()
  }
  function onClickFinding(){
    if(!inputRef.current) return console.log('inputRef.current is null')
    const array = sorting(data, SORT)
    const finding = findingRef.current
    const value = inputRef.current.value
    setDATA(searching(array, finding, value))
    // 리셋
    setSelected([])
  }
  // options.paginationing
  function changePage(e){
    const type = e.target?.dataset?.type
    const lastPage = Math.ceil(DATA.length / options.paginationing)
    const currentPageIndex = Math.ceil(currentPage / 10)
    const lastPageIndex = Math.ceil(lastPage / 10)
    console.log(type, lastPage, currentPageIndex, lastPageIndex)
    if(!type) return
    else if(type === 'prev') return currentPageIndex === 1 ? null : setCurrentPage(currentPage - 10)
    else if(type === 'next') return currentPageIndex >= lastPageIndex ? null : setCurrentPage(prev => prev + 10 >= lastPage ? lastPage : prev + 10)
    else setCurrentPage(Number(type))
  }
  console.log(currentPage)
  return (
    <DataTableContainer>
      {!DATA ? <div>데이터가 없습니다</div> : (<>
        {options.searching && HEADER.current && (
          <header>
            <select onChange={e => findingRef.current = e.target.value} defaultValue={HEADER.current[0]}>
              {HEADER.current.map((v, i) => <option key={`finding-option${i}`} value={v}>{v}</option>)}
            </select>
            <input type="text" ref={inputRef} placeholder={'searching...'} onKeyDown={onKeyDown}/>
            <button type="button" onClick={onClickFinding}>검색</button>
          </header>
        )}
        {HEADER.current && (
          <table>
            <thead>
              <tr>
                {options.selecting && (
                  <td className='table-options-selecting' onClick={selectAll}>
                    <SelectButton color={selected.length ? selected.length === DATA.length : false} />
                    <div>({selected.length}/{DATA.length})</div>
                  </td>
                )}
                {HEADER.current.map(v => <td key={v} onClick={onClickSort}>{v}</td>)}
              </tr>
            </thead>
            <tbody onClick={onClickItem}>
              {paginationing(DATA, options.paginationing, currentPage).map(d => (
                <tr key={`tr${d.num}`} data-id={d.num}>
                  {options.selecting && <td className="table-options-selecting"><SelectButton color={selected.some(i => i.num === d.num)}/></td>}
                  {HEADER.current.map((v, i) => <td key={`td${d.num}${i}`}>{d[v]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {options.paginationing && (
          <footer onClick={changePage}>
            <button data-type='prev'>{`<`}</button>
            <main>{Array.from({length: getPageCount(DATA, options.paginationing, currentPage, 10)}).map((v, i) => {
              const value = (i + 1) + (Math.ceil(currentPage / 10) - 1) * 10
              return <button key={`page/${i + 1}`} className={value === currentPage ? "table-options-paginationing-active" : ""} data-type={value}>{value}</button>
            })}</main>
            <button data-type='next'>{`>`}</button>
          </footer>
        )}
      </>)}
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
    }
    return order === "asc" ? a[type] - b[type] : b[type] - a[type]
  })
}
function searching(array, finding, value){
  if(!value) return array
  else return array.filter(d => String(d[finding]).toUpperCase().includes(value.toUpperCase()))
}
function selecting (array, item, finding) {
  const index = array.findIndex(i => i[finding] === item[finding])
  const temp = [...array]
  if(index === -1) temp.push(item) 
  else temp.splice(index, 1)
  return temp
}
function paginationing(array, count, page = 1){
  if(!count) return array
  const start = (Number(page) - 1) * Number(count)
  const end = start + Number(count)
  return array.slice(start, end)
}
function getPageCount(array, count, currentPage, pageCount){
  const lastPage = Math.ceil(array.length / count)
  const difference = lastPage - currentPage
  if(difference >= 10) return 10
  const lastPageIndex = Math.ceil(lastPage / 10)
  return lastPage - (lastPageIndex - 1) * pageCount 
}