import { useState } from "react";
import StyledContent from "../../styled/content";
import { useJsApiLoader, GoogleMap } from "@react-google-maps/api"
// MarkerClusterer, Marker, InfoWindow, Circle, Polygon, Autocomplete, DirectionsRenderer, DrawingManager

const libraries = ['places', 'drawing']

export default function Map(){
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-component',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_KEY,
    libraries,
    language: "en",
    region: "US",
  })
  const [map, setMap] = useState(null)
  if(false) console.log(map)
  // 맵 loaded, unmounted, onClick
  const onLoad = (map) => {
    setMap(map)
  }
  const onUnmount = (map) => {
    if(false) console.log(map)
    setMap(null)
  }
  const onClick = (e) => {
    // setClickPosition({lat: e.latLng.lat(), lng: e.latLng.lng()})
  }

  // 랜더링
  if(!isLoaded) return(
    <StyledContent.GoogleMap>
      <div>구글맵을 로딩중입니다</div>
    </StyledContent.GoogleMap>
  )
  if(loadError) return(
    <StyledContent.GoogleMap>
      <div>구글맵을 로딩에 실패하였습니다</div>
    </StyledContent.GoogleMap>
  )
  return(
    <StyledContent.GoogleMap>
      <GoogleMap 
        mapContainerStyle={{width: "100%", height: "100%"}}
        center={{lat: 37.42218, lng: -122.08409}}
        zoom={10}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={onClick}
        options={{
          mapTypeControlOptions: {position: window.google.maps.ControlPosition.TOP_RIGHT},
          fullscreenControl: true,
        }}
      >


      </GoogleMap>
    </StyledContent.GoogleMap>
  )
}