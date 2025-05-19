import React from "react";
import { Link } from "react-router-dom";

const NotAuthenticated = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-6xl font-bold text-red-500">403</h1>
      <h2 className="text-2xl text-gray-700 mt-2">Oops! You are not authenticated this page</h2>
      <p className="text-gray-600 mt-2">
        Please contact your concern person.
      </p>
      <Link
        to="/"
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
      >
        Go Back Home
      </Link>
    </div>
  );
};

export default NotAuthenticated;
