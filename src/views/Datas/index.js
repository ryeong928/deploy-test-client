import StyledContent from '../../styled/content'
import DataTable from './DataTable'

const data = Array.from({length: 126}).map((v, i) => {
  const ran = Math.random()
  return {
    num: i,
    model: `MODEL${Math.round(Math.random() * 10)}`,
    created: Math.round(Math.random() * 29 + 1),
    connected: ran > 0.5 ? "true" : "false",
    released: ran > 0.5 ? (ran > 0.8 ? "true" : "false") : "false" 
  }
})

export default function Datas(){

  return(
    <StyledContent.Datas>
      <DataTable data={data} options={{
          sorting: 'num', 
          searching: true,
          selecting: true,
          paginationing: 20 
        }} />
    </StyledContent.Datas>
  )
}