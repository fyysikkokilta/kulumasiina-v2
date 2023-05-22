import React from 'react';
import { ExpenseForm } from './features/form/ExpenseForm';
import { AdminEntryView } from './features/admin/EntryView';
import './App.css';
import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";


const router = createBrowserRouter([
    {
        path: "/",
        element: <ExpenseForm />,
    },
    {
        path: "/admin",
        element: <AdminEntryView />,
    }
]);


function App() {
  return (
    <div className="App">
        <RouterProvider router={router}/>
    </div>
  );
}

export default App;
