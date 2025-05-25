// frontend/src/components/access/QRScanner.tsx
import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { accessService } from '../../services/accessService';

interface QRScannerProps {
  onScanSuccess: () => void;
}

const QRScanner = ({ onScanSuccess }: QRScannerProps) => {
  const [scanning, setScanning] = useState(false);
  const [manualDocument, setManualDocument] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastScanned, setLastScanned] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (scanning) {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        false
      );

      scannerRef.current.render(handleScan, handleError);
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [scanning]);

  const handleScan = async (result: string) => {
    if (result && !loading) {
      setLoading(true);
      setMessage(null);

      try {
        const checkInOrOut = await determineAction(result);
        
        if (checkInOrOut === 'entry') {
          const response = await accessService.checkIn({ qrData: result });
          setLastScanned(response);
          setMessage({
            type: 'success',
            text: `✅ Entrada registrada: ${response.user.profile.firstName} ${response.user.profile.lastName}`,
          });
        } else {
          const response = await accessService.checkOut({ qrData: result });
          setLastScanned(response);
          setMessage({
            type: 'success',
            text: `👋 Salida registrada: ${response.user.profile.firstName} ${response.user.profile.lastName}`,
          });
        }
        
        onScanSuccess();
        setTimeout(() => {
          setLoading(false);
          setLastScanned(null);
        }, 3000);
      } catch (error: any) {
        setMessage({
          type: 'error',
          text: error.response?.data?.message || 'Error al procesar QR',
        });
        setLoading(false);
      }
    }
  };

  const handleManualSearch = async () => {
    if (!manualDocument.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const searchResult = await accessService.searchByDocument(manualDocument);
      
      if (!searchResult.found) {
        setMessage({
          type: 'error',
          text: 'Documento no encontrado',
        });
        return;
      }

      const checkInOrOut = await determineActionByProfile(searchResult.profile!.id);
      
      if (checkInOrOut === 'entry') {
        await accessService.checkIn({ profileId: searchResult.profile!.id });
        setMessage({
          type: 'success',
          text: `✅ Entrada registrada: ${searchResult.profile!.fullName}`,
        });
      } else {
        await accessService.checkOut({ profileId: searchResult.profile!.id });
        setMessage({
          type: 'success',
          text: `👋 Salida registrada: ${searchResult.profile!.fullName}`,
        });
      }
      
      setManualDocument('');
      onScanSuccess();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al procesar',
      });
    } finally {
      setLoading(false);
    }
  };

  const determineAction = async (qrData: string): Promise<'entry' | 'exit'> => {
    try {
      const qrInfo = JSON.parse(qrData);
      const current = await accessService.getCurrentOccupancy();
      const isInside = current.records.some(r => r.user.profile.documentNumber === qrInfo.doc);
      return isInside ? 'exit' : 'entry';
    } catch {
      return 'entry';
    }
  };

  const determineActionByProfile = async (profileId: number): Promise<'entry' | 'exit'> => {
    const current = await accessService.getCurrentOccupancy();
    const isInside = current.records.some(r => r.user.id === profileId);
    return isInside ? 'exit' : 'entry';
  };

  const handleError = (error: any) => {
    console.error('Error QR:', error);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Control de Acceso</h2>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setScanning(!scanning)}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            scanning
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-sena-green text-white hover:bg-sena-dark'
          }`}
        >
          {scanning ? '⏹ Detener Escaneo' : '📷 Escanear QR'}
        </button>
      </div>

      {scanning && (
        <div className="mb-6">
          <div id="qr-reader" className="max-w-md mx-auto"></div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Búsqueda Manual</h3>
        <div className="flex space-x-2">
          <input
            type="text"
            value={manualDocument}
            onChange={(e) => setManualDocument(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
            placeholder="Número de documento..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sena-green"
            disabled={loading}
          />
          <button
            onClick={handleManualSearch}
            disabled={loading || !manualDocument.trim()}
            className="px-6 py-2 bg-sena-green text-white rounded-lg hover:bg-sena-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Buscar
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg mb-4 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {lastScanned && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Último Registro:</h4>
          <div className="flex items-center space-x-4">
            {lastScanned.user.profile.profileImage ? (
              <img
                src={lastScanned.user.profile.profileImage}
                alt="Foto"
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                {lastScanned.user.profile.firstName.charAt(0)}
                {lastScanned.user.profile.lastName.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-medium">
                {lastScanned.user.profile.firstName} {lastScanned.user.profile.lastName}
              </p>
              <p className="text-sm text-gray-600">{lastScanned.user.profile.type}</p>
              <p className="text-sm text-gray-600">
                {new Date(lastScanned.entryTime).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;