import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { InitializePage } from './pages/InitializePage';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/initialize" element={<InitializePage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
