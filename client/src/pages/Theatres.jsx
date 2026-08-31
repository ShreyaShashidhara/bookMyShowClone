import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { jwtToken } from '../constants/authToken';

const theatreAndShowsMapper = (data) => {
  const obj = data.reduce((acc, show) => {
    if (!acc[show.theatre._id]) {
      acc[show.theatre._id] = { ...show.theatre, shows: [] };
    }
    acc[show.theatre._id].shows.push({
      _id: show._id,
      name: show.name,
      time: show.time,
    });

    return acc;
  }, {});

  return Object.values(obj);
}

const Theatres = () => {
  const [theatres, setTheatres] = useState([]);
  const { movieId } = useParams();

  useEffect(() => {
    fetch(`http://localhost:5010/api/show?movie=${movieId}`, {
      headers: {
        jwttoken: jwtToken
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setTheatres(theatreAndShowsMapper(data));
      });
  }, [movieId]);

  return (
    <div className="min-h-screen p-4 bg-gray-100">
      <div className="max-w-7xl mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6">Theatres</h2>
        <div className="grid grid-cols-1 gap-6">
          {theatres.map((theatre) => (
            <div key={theatre.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="flex p-4">
                <div className='flex flex-col mr-10 w-32'>
                    <h3 className="text-xl font-semibold mb-2">{theatre.name}</h3>
                    <p className="text-gray-600 mb-2">{theatre.location}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {theatre.shows.map((show, index) => (
                    <Link to={`/movie/${movieId}/theatres/${theatre._id}/shows/${show._id}`}>
                    <button
                      key={index}
                      className="h-10 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline align-middle"
                    >
                      {show.time}
                    </button>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Theatres;