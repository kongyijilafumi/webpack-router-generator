import { BrowserRouter, Link } from "react-router-dom"
import MyRouter from "./router";
function App() {
  return (
    <BrowserRouter>
      <Header />
      <hr />
      <MyRouter />
    </BrowserRouter>

  );
}

function Header() {
  return <h1>
    <Link to="/">Index</Link> |
    <Link to="/test">Test</Link> |
    <Link to="/user">User</Link>
  </h1>
}

export default App;
