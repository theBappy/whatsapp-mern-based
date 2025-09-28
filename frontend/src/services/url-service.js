import axios from "axios";

export const apiUrl = `${process.env.REACT_APP_API_URL}/api`;

export const axiosInstance = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
});
