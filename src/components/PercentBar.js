import styled from "styled-components";

const PercentBarContainer = styled.ul`
  border: 1px solid gray;
  padding: 10px;
  width: 300px;
  & > ul{
    background-color: white;
    width: 100%;
    height: 1.1em;
    border-radius: 1.1em;
    display: grid;
    grid-template-columns: ${props => props.value.map(v => `${v}fr`).join(' ')};
    & > li{
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      & > span{
        font-size: 0.5em;
        color: white;
        pointer-events: none;
      }
      &:first-child{
        border-top-left-radius: 1.1em;
        border-bottom-left-radius: 1.1em;
      }
      &:last-child{
        border-top-right-radius: 1.1em;
        border-bottom-right-radius: 1.1em;
      }
      &:nth-of-type(1){
        background: linear-gradient(90deg, rgb(255,100,100) 0%, rgb(200,0,0) 100%);
        &:hover{
          box-shadow: 0 0 6px rgb(200,0,0);
        }
      }
      &:nth-of-type(2){
        background: linear-gradient(90deg, #ffb833 0%, #ffa500 100%);
        &:hover{
          box-shadow: 0 0 6px #ffa500;
        }
      }
      &:nth-of-type(3){
        background: linear-gradient(90deg, #80ffbf 0%, #00e673 100%);
        &:hover{
          box-shadow: 0 0 6px #00e673;
        }
      }
      &:nth-of-type(4){
        background: linear-gradient(90deg, #4d94ff 0%, #005ce6 100%);
        &:hover{
          box-shadow: 0 0 6px #005ce6;
        }
      }
      &:nth-of-type(5){
        background: linear-gradient(90deg, #944dff 0%, #6600ff 100%);
        &:hover{
          box-shadow: 0 0 6px #6600ff;
        }
      }

    }
  }
`

export default function PercentBar({list}){
  const keys = Object.keys(list)
  const values = Object.values(list).sort((a, b) => {
    if(a>b) return -1
    if(a<b) return 1
    return 0
  })
  const sum = values.reduce((a, c) => a + c, 0)
  const percents = values.map(v => {
    const result = (v * 100 / sum).toFixed(1)
    return result >= 10 ? result : 10 
  })

  return(
    <PercentBarContainer value={percents}>
      <ul>{percents.map((p, i) => (<li key={`rank${i}`}></li>))}</ul>
      <footer>{keys.map(k => (
        <li key={k}>
          <span>{k}</span>
          <span>{list[k]}</span>
        </li>
      ))}</footer>
    </PercentBarContainer>
  )
}