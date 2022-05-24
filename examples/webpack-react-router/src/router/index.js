import { useRoutes } from "react-router-dom"
import list from "./auto"
export default function MyRouter() {
  return useRoutes(list)
}