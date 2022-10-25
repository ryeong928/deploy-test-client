import styled from "styled-components"

const RadiosContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;
  & label{
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 20px;
  }
  & span{
    cursor: pointer;
    transition: color 0.3s;
    &::selection{
      background-color: tomato;
      color: white;
    }
  }
  & input{
    appearance: none;
    cursor: pointer;
    border: 3px solid silver;
    border-radius: 50%;
    width: 1.25em;
    height: 1.25em;
    transition: border 0.3s;
    &:checked{
      border-color: tomato;
    }
    &:focus + span,
    &:hover + span{
      color: tomato;
    }
    &:disabled{
      background-color: lightgray;
      box-shadow: none;
      cursor: not-allowed;
      & + span{
        color: gray;
        cursor: auto;
      }
    }
  }
`
export default function Radios({list}){
  function onSubmit(e){
    e.preventDefault()
    const v = e.currentTarget.radio.value
    console.log(v)
  }
  return(
    <RadiosContainer onSubmit={onSubmit}>
      {list.map((v, i) => (
        <label key={v[0]}>
          <input type="radio" defaultChecked={!i && true} value={v[0]} name="radio" disabled={i+1 === list.length}/>
          <span>{v[1]}</span>
        </label>
      ))}
      <button>submit</button>
    </RadiosContainer>
  )
}