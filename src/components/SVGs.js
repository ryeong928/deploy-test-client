function Basic1(){
  return(
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="blue"/>
      <rect x="0" y="0" width="50" height="50" fill="orange"/>
      <ellipse cx="50" cy="50" rx="50" ry="25" fill="red" />
      <line x1="0" y1="50" x2="100" y2="50" stroke="black" strokeWidth="10" strokeLinecap="round"/>
      <polyline points="10,50 30,90 90,10" stroke="skyblue" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <polygon points="100,100 75,50 50,100" fill="green"/>
    </svg>
  )
}
const SVGs = {
  Basic1
}
export default SVGs 