import SVGs from '../components/SVGs'
import PercentBar from '../components/PercentBar'
import Radios from '../components/Radios'

const list = {
  radio: [['email', "이메일"], ['phone', "휴대전화"], ['fax', "팩스"], ['mail', "우편"]],
  percents: { A: 2354, B: 1203, C: 490, D: 100, E: 10 }
}

export default function Test(){

  return(
    <div>
      <section><SVGs.Basic1 /></section>
      <section><PercentBar list={list.percents} /></section>
      <section><Radios list={list.radio}/></section>
    </div>
  )
}