import styled from "styled-components";

const Content = styled.div`
display: flex;
flex-direction: column;
justify-content: center;
align-items: center;
gap: 20px;
padding: 20px;
flex: 1;
background-color: gainsboro;
& > header{
  font-size: 30px;
  font-weight: bold;
}
`
const Home = styled(Content)`
& > aside{
  padding: 10px 20px;
  background-color: limegreen;
  color: white;
  font-size: 20px;
  cursor: pointer;
  &:hover{
    background-color: green;
  }
}
& video.video-rotate{
  transform: rotateY(180deg);
}
& > section{
  display: flex;
  gap: 20px;
}
& > footer{
  
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
      &.rotate{
        transform: rotateY(180deg);
      }
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
  & > section{
    display: flex;
    gap: 10px;
  }
`
const Broadcast = styled(Content)`
  & > section{
    display: flex;
    gap: 10px;
  }
  & button{
    font-size: 16px;
    padding: 5px;
    cursor: pointer;
  }
  & video{
    &.rotate{
      transform: rotateY(180deg);
    }
  }
`
const Datas = styled(Content)``
const GoogleMap = styled(Content)`
  min-height: 100vh;
`

const StyledContent = {
  Home,
  RTC,
  Broadcast,
  Datas,
  GoogleMap,
}
export default StyledContent