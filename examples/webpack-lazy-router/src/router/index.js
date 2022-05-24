import { lazy, Suspense } from "react"
import { Route, Routes } from "react-router-dom"
import list from "./auto"
const fallback = <div>loadding</div>
export default function MyRouter() {
  return <Routes>
    {
      list.map(item => {
        const LazyCom = lazy(item.component)
        const element = (<Suspense fallback={fallback}><LazyCom /></Suspense>)
        return <Route element={element} path={item.path} key={item.path} />
      })
    }
  </Routes>
}