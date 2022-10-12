import { Link, Outlet } from "react-router-dom";
import styled from "styled-components";

const StyledLayout = styled.div`
  width: 100%;
  height: 100%;
  & > header{
    height: 50px;
    & > section:first-child{
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: inherit;
      color: white;
      background-color: black;
      font-size: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20px;
      & > a{
        &:hover{
          color: palegreen;
          font-weight: bold;
        }
      }
    }
    & > section:last-child{
      width: 100%;
      height: inherit;
    }
  }
`

export default function Layout() {
  
  return(
    <StyledLayout>
      <header>
        <section>
          <Link to="/">Home</Link>
        </section>
        <section />
      </header>
      <Outlet />
    </StyledLayout>
  )
}