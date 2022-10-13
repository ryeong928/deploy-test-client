import styled from "styled-components";

const Content = styled.div`
display: flex;
flex-direction: column;
justify-content: center;
align-items: center;
gap: 20px;
padding: 20px;
& > header{
  font-size: 30px;
  font-weight: bold;
}
`
const Home = styled(Content)`
& > section{
  display: flex;
  gap: 20px;
}
& > ul{
  display: flex;
  gap: 10px;
  & > li{
    background-color: skyblue;
    color: white;
    padding: 10px;
    border-radius: 5px;
    cursor: pointer;
    &:hover{
      background-color: blue;
    }
  }
}
`
const RTC = styled(Content)`
  & > main{
    display: flex;
    gap: 10px;
    & > video{
      width: 400px;
      height: 300px;
      background-color: silver;
    }
  }
  & > footer{
    display: flex;
    gap: 10px;
    justify-content: center;
    align-items: center;
  }
  & > sidebar{
    display: flex;
    gap: 10px;
    justify-content: center;
    align-items: center;
  }
`
const DataChannel = styled(Content)`
  & > main{
    
  }
`
const StyledContent = {
  Home,
  RTC,
  DataChannel,
}
export default StyledContent