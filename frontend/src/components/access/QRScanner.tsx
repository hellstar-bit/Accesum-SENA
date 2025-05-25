// frontend/src/components/access/QRScanner.tsx
import { useState, useRef } from 'react';
import { QrReader } from 'react-qr-reader';
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

  const handleScan = async (result: any) => {
    if (result && !loading) {
      setLoading(true);
      setMessage(null);

      try {
        // Verificar si es entrada o salida
        const checkInOrOut = await determineAction(result.text);
        
        if (checkInOrOut === 'entry') {
          const response = await accessService.checkIn({ qrData: result.text });
          setLastScanned(response);
          setMessage({
            type: 'success',
            text: `✅ Entrada registrada: ${response.user.profile.firstName} ${response.user.profile.lastName}`,
          });
        } else {
          const response = await accessService.checkOut({ qrData: result.text });
          setLastScanned(response);
          setMessage({
            type: 'success',
            text: `👋 Salida registrada: ${response.user.profile.firstName} ${response.user.profile.lastName}`,
          });
        }
        
        onScanSuccess();
        // Pausar el escaneo por 3 segundos para evitar múltiples lecturas
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
        const response = await accessService.checkIn({ profileId: searchResult.profile!.id });
        setMessage({
          type: 'success',
          text: `✅ Entrada registrada: ${searchResult.profile!.fullName}`,
        });
      } else {
        const response = await accessService.checkOut({ profileId: searchResult.profile!.id });
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
    // Aquí podrías implementar lógica para determinar si es entrada o salida
    // Por ahora, vamos a consultar el estado actual
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

      {/* Botones de modo */}
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

      {/* Escáner QR */}
      {scanning && (
        <div className="mb-6">
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ maxWidth: '400px', margin: '0 auto' }}>
            <QrReader
                onResult={(result, error) => {
                    if (result) handleScan(result);
                    if (error) handleError(error);
                }}
                constraints={{ facingMode: 'environment' }}
                scanDelay={500}
                containerStyle={{ width: '100%' }}
                videoStyle={{ width: '100%' }}
/>
            {loading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white rounded-lg p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sena-green"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Búsqueda manual */}
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

      {/* Mensajes */}
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

      {/* Último escaneado */}
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