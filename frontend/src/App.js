
import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Anomaly from './pages/Anomaly';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
      <Routes> 
        <Route path='/' element={<Anomaly/>}/>
         </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
