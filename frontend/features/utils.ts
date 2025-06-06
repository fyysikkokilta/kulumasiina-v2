import axios from 'axios'

export const EURFormat = new Intl.NumberFormat('fi-FI', {
  style: 'currency',
  currency: 'EUR',
})

export const KMFormat = new Intl.NumberFormat('fi-FI', {
  style: 'unit',
  unit: 'kilometer',
})

export const apiURL = '/api'
export const api = axios.create({
  baseURL: apiURL,
  withCredentials: true,
})
