// frontend/src/components/access/QRScanner.tsx - Mejorado con SweetAlert2
import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { accessService } from '../../services/accessService';
import Swal from 'sweetalert2';

interface QRScannerProps {
  onScanSuccess: () => void;
}

const QRScanner = ({ onScanSuccess }: QRScannerProps) => {
  const [scanning, setScanning] = useState(false);
  const [manualDocument, setManualDocument] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string>(''); // Para evitar doble escaneo
  const [processingQR, setProcessingQR] = useState(false); // Para pausar el escáner
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const lastScanTimeRef = useRef<number>(0);

  useEffect(() => {
    if (scanning && !processingQR) {
      initializeScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [scanning, processingQR]);

  const initializeScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
    }

    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 280, height: 280 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 2,
      },
      false
    );

    scannerRef.current.render(handleScan, handleError);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (error) {
        console.log('Error al detener escáner:', error);
      }
    }
  };

  const handleScan = async (result: string) => {
    const currentTime = Date.now();
    
    // ⭐ PREVENIR DOBLE ESCANEO
    // Evitar procesar el mismo QR muy rápido o si ya se está procesando
    if (
      processingQR || 
      result === lastScannedCode || 
      (currentTime - lastScanTimeRef.current) < 2000 // 2 segundos entre escaneos
    ) {
      return;
    }

    // ⭐ PAUSAR EL ESCÁNER MIENTRAS SE PROCESA
    setProcessingQR(true);
    setLastScannedCode(result);
    lastScanTimeRef.current = currentTime;

    try {
      console.log('🔍 QR Escaneado:', result);
      
      // Mostrar loading mientras se procesa
      Swal.fire({
        title: 'Procesando...',
        text: 'Verificando código QR',
        icon: 'info',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const checkInOrOut = await determineAction(result);
      
      if (checkInOrOut === 'entry') {
        const response = await accessService.checkIn({ qrData: result });
        await showSuccessAlert('entrada', response);
      } else {
        const response = await accessService.checkOut({ qrData: result });
        await showSuccessAlert('salida', response);
      }
      
      onScanSuccess();

    } catch (error: any) {
      console.error('❌ Error al procesar QR:', error);
      await showErrorAlert(error.response?.data?.message || 'Error al procesar código QR');
    } finally {
      // ⭐ REANUDAR ESCÁNER DESPUÉS DE UN DELAY
      setTimeout(() => {
        setProcessingQR(false);
        setLastScannedCode(''); // Limpiar después del delay
      }, 1500); // 1.5 segundos antes de permitir otro escaneo
    }
  };

  const showSuccessAlert = async (tipo: 'entrada' | 'salida', response: any) => {
    const isEntry = tipo === 'entrada';
    const user = response.user.profile;
    
    return Swal.fire({
      title: `✅ ${isEntry ? 'ENTRADA' : 'SALIDA'} REGISTRADA`,
      html: `
        <div class="text-center">
          <div class="mb-4">
            ${user.profileImage 
              ? `<img src="${user.profileImage}" class="w-20 h-20 rounded-full mx-auto object-cover mb-2" />` 
              : `<div class="w-20 h-20 rounded-full mx-auto bg-green-100 flex items-center justify-center text-green-600 text-2xl font-bold mb-2">${user.firstName.charAt(0)}${user.lastName.charAt(0)}</div>`
            }
          </div>
          <h3 class="text-lg font-semibold text-gray-800">${user.firstName} ${user.lastName}</h3>
          <p class="text-sm text-gray-600">${user.type} - ${user.documentNumber}</p>
          <p class="text-xs text-gray-500 mt-2">
            ${isEntry ? '🏢 Ingresó a las instalaciones' : '🚪 Salió de las instalaciones'}
          </p>
          <p class="text-xs text-gray-400">
            ${new Date(response.entryTime).toLocaleTimeString('es-CO', { 
              hour12: true, 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>
      `,
      icon: 'success',
      iconColor: isEntry ? '#16a34a' : '#dc2626',
      confirmButtonColor: isEntry ? '#16a34a' : '#dc2626',
      confirmButtonText: 'Continuar',
      timer: 4000, // ⭐ AUTO-CERRAR DESPUÉS DE 4 SEGUNDOS
      timerProgressBar: true,
      allowOutsideClick: false,
      customClass: {
        popup: 'animate__animated animate__bounceIn',
        title: isEntry ? 'text-green-700' : 'text-red-700'
      },
      // ⭐ SONIDO DE ÉXITO (opcional)
      didOpen: () => {
        // Reproducir sonido de éxito si está disponible
        try {
          const audio = new Audio('/success-sound.mp3'); // Opcional: agregar archivo de sonido
          audio.volume = 0.3;
          audio.play().catch(() => {}); // Ignorar si no se puede reproducir
        } catch {}
      }
    });
  };

  const showErrorAlert = async (message: string) => {
    return Swal.fire({
      title: '❌ ERROR',
      text: message,
      icon: 'error',
      iconColor: '#dc2626',
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Reintentar',
      timer: 3000,
      timerProgressBar: true,
      customClass: {
        popup: 'animate__animated animate__shakeX'
      },
      // ⭐ SONIDO DE ERROR (opcional)
      didOpen: () => {
        try {
          const audio = new Audio('/error-sound.mp3'); // Opcional: agregar archivo de sonido
          audio.volume = 0.3;
          audio.play().catch(() => {});
        } catch {}
      }
    });
  };

  const handleManualSearch = async () => {
    if (!manualDocument.trim() || loading) return;

    setLoading(true);

    // Mostrar loading para búsqueda manual
    Swal.fire({
      title: 'Buscando...',
      text: `Documento: ${manualDocument}`,
      icon: 'info',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const searchResult = await accessService.searchByDocument(manualDocument);
      
      if (!searchResult.found) {
        await Swal.fire({
          title: '❌ No encontrado',
          text: `No se encontró el documento: ${manualDocument}`,
          icon: 'warning',
          confirmButtonColor: '#f59e0b',
          timer: 3000
        });
        return;
      }

      const checkInOrOut = await determineActionByProfile(searchResult.profile!.id);
      
      if (checkInOrOut === 'entry') {
        const response = await accessService.checkIn({ profileId: searchResult.profile!.id });
        await showSuccessAlert('entrada', response);
      } else {
        const response = await accessService.checkOut({ profileId: searchResult.profile!.id });
        await showSuccessAlert('salida', response);
      }
      
      setManualDocument('');
      onScanSuccess();

    } catch (error: any) {
      await showErrorAlert(error.response?.data?.message || 'Error al procesar documento');
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
    console.log('Error QR Scanner:', error);
    // No mostrar errores técnicos del escáner para evitar spam
  };

  const toggleScanning = () => {
    if (processingQR) return; // No permitir cambiar estado mientras se procesa
    setScanning(!scanning);
    setLastScannedCode(''); // Limpiar código anterior
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">🔍 Control de Acceso</h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          scanning 
            ? processingQR 
              ? 'bg-yellow-100 text-yellow-800' 
              : 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {scanning 
            ? processingQR 
              ? '⏸️ Procesando...' 
              : '🟢 Escaneando'
            : '⭕ Detenido'
          }
        </div>
      </div>

      {/* ⭐ BOTÓN DE CONTROL MEJORADO */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={toggleScanning}
          disabled={processingQR}
          className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
            scanning
              ? processingQR
                ? 'bg-yellow-500 text-white cursor-not-allowed opacity-75'
                : 'bg-red-500 text-white hover:bg-red-600 shadow-lg'
              : 'bg-sena-green text-white hover:bg-sena-dark shadow-lg'
          }`}
        >
          {scanning ? (
            processingQR ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                <span>Procesando QR...</span>
              </>
            ) : (
              <>
                <span>⏹</span>
                <span>Detener Escáner</span>
              </>
            )
          ) : (
            <>
              <span>📷</span>
              <span>Iniciar Escáner</span>
            </>
          )}
        </button>
      </div>

      {/* ⭐ ÁREA DE ESCÁNER CON ESTADO VISUAL */}
      {scanning && (
        <div className="mb-6">
          <div className={`relative max-w-md mx-auto border-4 rounded-lg overflow-hidden ${
            processingQR 
              ? 'border-yellow-400 bg-yellow-50' 
              : 'border-green-400 bg-green-50'
          }`}>
            {processingQR && (
              <div className="absolute inset-0 bg-yellow-100 bg-opacity-75 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-600 mx-auto mb-2"></div>
                  <p className="text-yellow-800 font-medium">Procesando...</p>
                </div>
              </div>
            )}
            <div id="qr-reader"></div>
          </div>
          <p className="text-center text-sm text-gray-600 mt-2">
            {processingQR 
              ? 'Espere mientras se procesa el código QR...' 
              : 'Apunte la cámara hacia el código QR'
            }
          </p>
        </div>
      )}

      {/* ⭐ BÚSQUEDA MANUAL MEJORADA */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <span className="mr-2">🔢</span>
          Búsqueda Manual por Documento
        </h3>
        <div className="flex space-x-2">
          <input
            type="text"
            value={manualDocument}
            onChange={(e) => setManualDocument(e.target.value.replace(/\D/g, ''))} // Solo números
            onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
            placeholder="Número de documento..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sena-green text-center text-lg font-mono"
            disabled={loading || processingQR}
            maxLength={15}
          />
          <button
            onClick={handleManualSearch}
            disabled={loading || !manualDocument.trim() || processingQR}
            className="px-6 py-3 bg-sena-green text-white rounded-lg hover:bg-sena-dark disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              'Buscar'
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Ingrese solo números del documento de identidad
        </p>
      </div>

      {/* ⭐ INSTRUCCIONES MEJORADAS */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">📋 Instrucciones:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Active el escáner y apunte la cámara al código QR</li>
          <li>• Mantenga el código QR centrado en el área de escaneo</li>
          <li>• Espere a que aparezca la confirmación antes del siguiente escaneo</li>
          <li>• Use búsqueda manual si el código QR no funciona</li>
          <li>• El sistema detecta automáticamente entrada o salida</li>
        </ul>
      </div>
    </div>
  );
};

export default QRScanner;