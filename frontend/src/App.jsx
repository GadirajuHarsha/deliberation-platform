import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Intake from './pages/Intake';
import Voting from './pages/Voting';
import Waiting from './pages/Waiting';
import Audit from './pages/Audit';
import Cases from './pages/Cases';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 bg-surface-50 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Cases />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/intake" element={<Intake />} />
            <Route path="/vote" element={<Voting />} />
            <Route path="/waiting" element={<Waiting />} />
            <Route path="/audit" element={<Audit />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
