import { useCallback, useEffect, useRef, useState } from 'react'
import {DataTableContainer, SelectButton, PageIndexChangeButton} from './components'

export default function DataTable({data, options}){
  // 초기 데이터
  const [DATA, setDATA] = useState(data)
  const HEADER = useRef(null)
  const [SORT, setSORT] = useState({type: options.sorting, order: 'asc'})
  // options
  const findingRef = useRef(null)
  const searchingRef = useRef(null)
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
        sort.type = options.sorting
        sort.order = 'asc'
      } 
      return sort
    })
  }, [options.sorting])

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
    if(!searchingRef.current) return console.log('searchingRef.current is null')
    const array = sorting(data, SORT)
    const finding = findingRef.current
    const value = searchingRef.current.value
    setDATA(searching(array, finding, value))
    // 리셋
    setSelected([])
    setCurrentPage(1)
  }
  function changeSearchingFinding(e){
    searchingRef.current.value = ""
    findingRef.current = e.target.value
  }  
  // options.paginationing
  function changePage(e){
    const type = e.target?.dataset?.type
    const lastPage = Math.ceil(DATA.length / options.paginationing)
    const currentPageIndex = Math.ceil(currentPage / options.paginationing)
    const lastPageIndex = Math.ceil(lastPage / options.paginationing)
    if(!type) return
    else if(type === '-1') return currentPageIndex === 1 ? (currentPage === 1 ? null : setCurrentPage(currentPage - 1)) : setCurrentPage(currentPage - 10)
    else if(type === '+1') return currentPageIndex >= lastPageIndex ? (currentPage === lastPage ? null : setCurrentPage(currentPage + 1)) : setCurrentPage(prev => prev + 10 >= lastPage ? lastPage : prev + 10)
    else setCurrentPage(Number(type))
  }
  return (
    <DataTableContainer>
      {!DATA ? <h1>데이터가 없습니다</h1> : (<>
        {options.searching && HEADER.current && (
          <header>
            <select onChange={changeSearchingFinding} defaultValue={HEADER.current[0]}>
              {HEADER.current.map((v, i) => <option key={`finding-option${i}`} value={v}>{v}</option>)}
            </select>
            <input type="text" ref={searchingRef} placeholder={'searching...'} onKeyDown={onKeyDown}/>
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
              {slicing(DATA, options.paginationing, currentPage).map(d => (
                <tr key={`tr${d.num}`} data-id={d.num}>
                  {options.selecting && <td className="table-options-selecting"><SelectButton color={selected.some(i => i.num === d.num)}/></td>}
                  {HEADER.current.map((v, i) => <td key={`td${d.num}${i}`}>{d[v]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {options.paginationing && DATA.length !== 0 && (
          <footer onClick={changePage}>
            <PageIndexChangeButton data-type='-1' variation={-1} />
            <main>{Array.from({length: getPageCount(DATA, options.paginationing, currentPage, 10)}).map((v, i) => {
              const value = (i + 1) + (Math.ceil(currentPage / 10) - 1) * 10
              return <button key={`page/${i + 1}`} className={value === currentPage ? "table-options-paginationing-active" : ""} data-type={value}>{value}</button>
            })}</main>
            <PageIndexChangeButton data-type='+1' variation={1} />
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
  return !value ? array : array.filter(d => String(d[finding]).toUpperCase().includes(value.toUpperCase()))
}
function selecting (array, item, finding) {
  const index = array.findIndex(i => i[finding] === item[finding])
  const temp = [...array]
  if(index === -1) temp.push(item) 
  else temp.splice(index, 1)
  return temp
}
function slicing(array, count, page = 1){
  if(!count) return array
  const start = (Number(page) - 1) * Number(count)
  const end = start + Number(count)
  return array.slice(start, end)
}
function getPageCount(array, count, currentPage, pageCount){
  if(!array.length) return 0
  const lastPage = Math.ceil(array.length / count)
  const lastPageIndex = Math.ceil(lastPage / pageCount)
  const currentPageIndex = Math.ceil(currentPage / pageCount)
  const pageIndexDiff = lastPageIndex - currentPageIndex
  if(pageIndexDiff > 0) return 10
  return lastPage - (lastPageIndex - 1) * pageCount
}