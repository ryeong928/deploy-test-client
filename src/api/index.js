import Axios from 'axios'

const axios = Axios.create({
  baseURL: process.env.REACT_APP_SERVER_URL,
  timeout: 3000,
  withCredentials: true
})

export default axios