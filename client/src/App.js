import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import MovieDetail from './pages/MovieDetail';
import Theatres from './pages/Theatres';
import ShowDetail from './pages/ShowDetail';
import MovieList from './pages/MovieList';
import TheatreList from './pages/TheatreList';
import ShowList from './pages/ShowList';
import Bookings from './pages/Bookings';
import Chat from './pages/Chat';



function App() {
  return (
    <Router>
      <Navbar />
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/movie/:movieId" element={<MovieDetail />} />
          <Route path="/movie/:movieId/theatres" element={<Theatres />} />
          <Route path="/movie/:movieId/theatres/:theatreId/shows/:showId" element={<ShowDetail />} />

          <Route path="/admin/movies" element={<MovieList />} />
          <Route path="/admin/theatres" element={<TheatreList />} />
          <Route path="/admin/theatres/:theatreId/shows" element={<ShowList />} />

          <Route path="/owner/theatres" element={<TheatreList />} />
          <Route path="/owner/theatres/:theatreId/shows" element={<ShowList />} />

          <Route path="/profile/bookings" element={<Bookings />} />
          <Route path="/chat" element={<Chat />}></Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
