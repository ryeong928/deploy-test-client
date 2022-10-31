import styled from "styled-components"

export const DataTableContainer = styled.div`
  width: 100%;
  & > h1{
    text-align: center;
    font-size: 20px;
  }
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
      background-color: transparent;
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

const SelectButtonContainer = styled.svg`
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
export function SelectButton({color}){
  return (
    <SelectButtonContainer className={color ? "select-round-svg-active" : ""} width="20" height="20" viewBox="0 0 20 20">
      <g>
        <circle cx="10" cy="10" r="8.8" strokeWidth="1.2" fill="transparent" />
        <polyline points="5,9 8.6,13 14.4,7 " strokeWidth="2" fill="transparent" strokeLinecap='round' strokeLinejoin='round'/>
      </g>
    </SelectButtonContainer>
  )
}

const PageIndexChangeButtonContainer = styled.svg`
  border: 1px solid gray;
  cursor: pointer;
  background-color: #eef0f6;
  transform-origin: 50% 50%;
  transform: ${props => props.variation > 0 ? `rotate(180deg)` : `rotate(0)`};
  & > g{
    pointerEvents: none;
    stroke: #333;
  }
  &:hover{
    background-color: #333;
    & g{
      stroke: white;
    }
  }
  &:active{
    background-color: #eef0f6;
    & g{
      stroke: #333;
    }
  }
`
export function PageIndexChangeButton({variation}){
  return(
    <PageIndexChangeButtonContainer width="26" height="26" viewBox="0 0 20 20" variation={variation}>
      <g>
        {Math.abs(variation) === 1 ? (
          <polyline points="13,5 7,10 13,15" strokeWidth="1" fill="transparent"/>
        ) : (<>
          <polyline points="15,5 9,10 15,15" strokeWidth="1" fill="transparent"/>
          <polyline points="12,5 6,10 12,15" strokeWidth="1" fill="transparent"/>
      </>)}
      </g>
    </PageIndexChangeButtonContainer>
  )
}