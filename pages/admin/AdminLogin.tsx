import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';

interface AdminLoginProps {
  onLogin: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const { settings } = useStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (pin.length === 6) {
      if (pin === settings.pin) {
        onLogin();
      } else {
        // Vibrate on error
        if (typeof navigator.vibrate === 'function') {
          navigator.vibrate([200, 100, 200]);
        }
        setError(true);
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 500);
      }
    }
  }, [pin, settings.pin, onLogin]);

  const handleNumClick = (num: number) => {
    if (pin.length < 6) setPin(prev => prev + num);
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="mb-8 text-center">
        {settings.logo && (
          <img src={settings.logo} alt="Logo" className="w-24 h-24 mx-auto mb-4 rounded-full object-cover border-4 border-gray-700" />
        )}
        <h1 className="text-2xl font-bold">{settings.name}</h1>
        <p className="text-gray-400">Masukkan PIN Admin</p>
      </div>

      <div className="flex space-x-4 mb-8">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all ${
              i < pin.length ? 'bg-accent border-accent' : 'border-gray-600'
            } ${error ? 'border-red-500 bg-red-500 animate-pulse' : ''}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumClick(num)}
            className="w-16 h-16 rounded-full bg-gray-800 text-2xl font-semibold hover:bg-gray-700 active:scale-95 transition"
          >
            {num}
          </button>
        ))}
        <div className="w-16 h-16" /> {/* Spacer */}
        <button
          onClick={() => handleNumClick(0)}
          className="w-16 h-16 rounded-full bg-gray-800 text-2xl font-semibold hover:bg-gray-700 active:scale-95 transition"
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          className="w-16 h-16 rounded-full bg-transparent text-xl font-semibold text-red-400 hover:bg-gray-800 active:scale-95 transition flex items-center justify-center"
        >
          ⌫
        </button>
      </div>
      
      <button 
        onClick={() => alert('Fitur lupa PIN: Silahkan reset data browser atau hubungi developer jika ini aplikasi nyata.')}
        className="mt-8 text-sm text-gray-500 hover:text-white underline"
      >
        Lupa PIN?
      </button>
    </div>
  );
};

export default AdminLogin;