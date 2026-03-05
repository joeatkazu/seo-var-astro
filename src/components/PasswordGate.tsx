import { useState } from 'react';

interface PasswordGateProps {
  correctPassword: string;
  videoSrc: string;
  videoTitle: string;
  videoDescription: string;
}

export default function PasswordGate({ 
  correctPassword, 
  videoSrc, 
  videoTitle,
  videoDescription 
}: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === correctPassword) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Hibas jelszo. Probald ujra.');
    }
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {videoTitle}
            </h1>
            <p className="text-gray-600 mb-6">
              {videoDescription}
            </p>
            
            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <video
                controls
                className="w-full h-full"
                preload="metadata"
              >
                <source src={videoSrc} type="video/mp4" />
                A bongeszo nem tamogatja a video lejatszast.
              </video>
            </div>
            
            <div className="mt-6 flex justify-between items-center">
              <p className="text-sm text-gray-500">
                Video meret: ~10 MB | Formátum: MP4
              </p>
              <a 
                href={videoSrc}
                download 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Letoltes
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Vedett tartalom
          </h1>
          <p className="text-gray-600 mb-6 text-center">
            Add meg a jelszot a video megtekintesehez
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Jelszo"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                autoFocus
              />
            </div>
            
            {error && (
              <p className="text-red-600 text-sm text-center">{error}</p>
            )}
            
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Belépés
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
