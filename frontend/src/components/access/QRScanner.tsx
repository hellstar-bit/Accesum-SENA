// frontend/src/components/access/QRScanner.tsx - CORREGIDO PARA COMPLETAR EL FLUJO
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
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [processingQR, setProcessingQR] = useState(false);
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
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 2,
        videoConstraints: {
          facingMode: "environment"
        },
        formatsToSupport: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
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
    
    // Prevenir doble escaneo
    if (
      processingQR || 
      result === lastScannedCode || 
      (currentTime - lastScanTimeRef.current) < 3000
    ) {
      return;
    }

    // Pausar el escáner mientras se procesa
    setProcessingQR(true);
    setLastScannedCode(result);
    lastScanTimeRef.current = currentTime;

    try {
      console.log('🔍 QR Escaneado (raw):', result);
      
      // Validar y limpiar datos del QR
      const cleanQRData = validateAndCleanQRData(result);
      console.log('🔍 QR Limpio:', cleanQRData);
      
      // Mostrar loading
      Swal.fire({
        title: 'Procesando...',
        html: `
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p class="text-gray-600">Verificando código QR</p>
            <p class="text-xs text-gray-500 mt-2">Documento: ${getDocumentFromQR(cleanQRData)}</p>
          </div>
        `,
        allowOutsideClick: false,
        showConfirmButton: false,
        customClass: {
          popup: 'animate__animated animate__fadeIn'
        }
      });

      // ⭐ DETERMINAR ACCIÓN Y PROCESAR - CORREGIDO
      console.log('🎯 Determinando acción para:', JSON.parse(cleanQRData));
      
      const checkInOrOut = await determineAction(cleanQRData);
      console.log('🎯 Acción determinada:', checkInOrOut);
      
      let response;
      console.log('📡 Enviando request de', checkInOrOut === 'entry' ? 'CHECK-IN' : 'CHECK-OUT');
      
      if (checkInOrOut === 'entry') {
        response = await accessService.checkIn({ qrData: cleanQRData });
        console.log('✅ CHECK-IN exitoso:', response);
      } else {
        response = await accessService.checkOut({ qrData: cleanQRData });
        console.log('✅ CHECK-OUT exitoso:', response);
      }
      
      await showSuccessAlert(checkInOrOut, response);
      onScanSuccess();

    } catch (error: any) {
      console.error('❌ Error al procesar QR:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      await showErrorAlert(
        error.response?.data?.message || 
        error.message ||
        'Error al procesar código QR'
      );
    } finally {
      // Reanudar escáner después de un delay
      setTimeout(() => {
        setProcessingQR(false);
        setLastScannedCode('');
      }, 2000);
    }
  };

  // ⭐ FUNCIÓN MEJORADA PARA VALIDAR QR
  const validateAndCleanQRData = (rawData: string): string => {
    try {
      const parsed = JSON.parse(rawData);
      
      if (parsed && typeof parsed === 'object') {
        // ⭐ ACEPTAR DIFERENTES TIPOS DE QR ACCESUM
        if (parsed.id && parsed.doc && 
            (parsed.type === 'ACCESUM_SENA' || 
             parsed.type === 'ACCESUM_SENA_LEARNER' || 
             parsed.type?.startsWith('ACCESUM_SENA'))) {
          return JSON.stringify(parsed);
        }
      }
      
      throw new Error('Formato QR inválido');
    } catch (jsonError) {
      console.log('No es JSON válido, intentando otras estrategias...');
      
      let cleanData = rawData.trim();
      cleanData = cleanData.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
      
      const jsonMatch = cleanData.match(/\{.*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.id && parsed.doc && parsed.type?.includes('ACCESUM')) {
            return JSON.stringify(parsed);
          }
        } catch (e) {
          console.log('JSON extraído no válido');
        }
      }
      
      const numberMatch = cleanData.match(/^\d+$/);
      if (numberMatch) {
        const documentNumber = numberMatch[0];
        console.log('🔍 Detectado número de documento puro:', documentNumber);
        
        return JSON.stringify({
          id: null,
          doc: documentNumber,
          type: 'ACCESUM_SENA_MANUAL',
          timestamp: Date.now()
        });
      }
      
      try {
        const decoded = decodeURIComponent(cleanData);
        if (decoded !== cleanData) {
          return validateAndCleanQRData(decoded);
        }
      } catch (e) {
        console.log('No es URL encoded');
      }
      
      throw new Error(`Formato de QR no reconocido: ${rawData.substring(0, 50)}...`);
    }
  };

  const getDocumentFromQR = (qrData: string): string => {
    try {
      const parsed = JSON.parse(qrData);
      return parsed.doc || 'No identificado';
    } catch {
      return qrData.substring(0, 15) + '...';
    }
  };

  // ⭐ FUNCIÓN MEJORADA PARA DETERMINAR ACCIÓN
  const determineAction = async (qrData: string): Promise<'entry' | 'exit'> => {
    try {
      const qrInfo = JSON.parse(qrData);
      console.log('🎯 Determinando acción para:', qrInfo);
      
      if (!qrInfo.doc) {
        console.warn('⚠️ QR no contiene documento, asumiendo entrada');
        return 'entry';
      }
      
      console.log('🏢 Verificando ocupación actual...');
      const current = await accessService.getCurrentOccupancy();
      console.log('🏢 Personas actualmente dentro:', current.total);
      console.log('🏢 Registros actuales:', current.records.map(r => ({
        doc: r.user.profile.documentNumber,
        name: `${r.user.profile.firstName} ${r.user.profile.lastName}`
      })));
      
      const isInside = current.records.some(r => 
        r.user.profile.documentNumber === qrInfo.doc
      );
      
      console.log('🎯 ¿Está dentro?', isInside, 'para documento:', qrInfo.doc);
      return isInside ? 'exit' : 'entry';
    } catch (error) {
      console.error('❌ Error determinando acción:', error);
      // Por defecto, asumir entrada si hay error
      return 'entry';
    }
  };

  const determineActionByProfile = async (profileId: number): Promise<'entry' | 'exit'> => {
    try {
      console.log('🎯 Determinando acción por perfil ID:', profileId);
      const current = await accessService.getCurrentOccupancy();
      const isInside = current.records.some(r => r.user.id === profileId);
      console.log('🎯 ¿Perfil está dentro?', isInside);
      return isInside ? 'exit' : 'entry';
    } catch (error) {
      console.error('Error determinando acción por perfil:', error);
      return 'entry';
    }
  };

  const showSuccessAlert = async (tipo: 'entry' | 'exit', response: any) => {
    const isEntry = tipo === 'entry';
    const user = response.user.profile;
    
    return Swal.fire({
      title: `✅ ${isEntry ? 'ENTRADA' : 'SALIDA'} REGISTRADA`,
      html: `
        <div class="text-center">
          <div class="mb-4">
            ${user.profileImage 
              ? `<img src="${user.profileImage}" class="w-20 h-20 rounded-full mx-auto object-cover mb-2 border-4 ${isEntry ? 'border-green-400' : 'border-red-400'}" />` 
              : `<div class="w-20 h-20 rounded-full mx-auto ${isEntry ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center ${isEntry ? 'text-green-600' : 'text-red-600'} text-2xl font-bold mb-2 border-4 ${isEntry ? 'border-green-400' : 'border-red-400'}">${user.firstName.charAt(0)}${user.lastName.charAt(0)}</div>`
            }
          </div>
          <h3 class="text-lg font-semibold text-gray-800">${user.firstName} ${user.lastName}</h3>
          <p class="text-sm text-gray-600 mb-2">${user.type} - ${user.documentNumber}</p>
          <div class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-3 ${
            isEntry 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }">
            ${isEntry ? '🏢 INGRESÓ A LAS INSTALACIONES' : '🚪 SALIÓ DE LAS INSTALACIONES'}
          </div>
          <p class="text-sm text-gray-500">
            ${new Date(response.entryTime || response.exitTime).toLocaleString('es-CO', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long', 
              day: 'numeric',
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            })}
          </p>
          ${user.center ? `<p class="text-xs text-gray-400 mt-1">${user.center}</p>` : ''}
        </div>
      `,
      icon: 'success',
      iconColor: isEntry ? '#16a34a' : '#dc2626',
      confirmButtonColor: isEntry ? '#16a34a' : '#dc2626',
      confirmButtonText: 'Continuar',
      timer: 5000,
      timerProgressBar: true,
      allowOutsideClick: false,
      customClass: {
        popup: 'animate__animated animate__bounceIn',
        title: isEntry ? 'text-green-700' : 'text-red-700'
      }
    });
  };

  const showErrorAlert = async (message: string) => {
    return Swal.fire({
      title: '❌ ERROR DE ACCESO',
      html: `
        <div class="text-center">
          <div class="mb-4">
            <div class="w-16 h-16 rounded-full mx-auto bg-red-100 flex items-center justify-center text-red-600 text-3xl mb-2">
              ⚠️
            </div>
          </div>
          <p class="text-gray-700 mb-4">${message}</p>
          <div class="bg-red-50 border border-red-200 rounded-lg p-3">
            <p class="text-sm text-red-700">
              <strong>Posibles soluciones:</strong><br>
              • Verificar que el código QR esté bien generado<br>
              • Intentar búsqueda manual por documento<br>
              • Contactar al administrador si persiste
            </p>
          </div>
        </div>
      `,
      icon: 'error',
      iconColor: '#dc2626',
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Entendido',
      timer: 6000,
      timerProgressBar: true,
      customClass: {
        popup: 'animate__animated animate__shakeX'
      }
    });
  };

  const handleManualSearch = async () => {
    if (!manualDocument.trim() || loading) return;

    setLoading(true);

    Swal.fire({
      title: 'Buscando persona...',
      html: `
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p class="text-gray-600">Documento: <strong>${manualDocument}</strong></p>
          <p class="text-xs text-gray-500 mt-2">Verificando en la base de datos...</p>
        </div>
      `,
      allowOutsideClick: false,
      showConfirmButton: false
    });

    try {
      console.log('🔍 Búsqueda manual por documento:', manualDocument);
      const searchResult = await accessService.searchByDocument(manualDocument);
      
      if (!searchResult.found || !searchResult.profile) {
        await Swal.fire({
          title: '🚫 Persona no encontrada',
          html: `
            <div class="text-center">
              <div class="w-16 h-16 rounded-full mx-auto bg-yellow-100 flex items-center justify-center text-yellow-600 text-3xl mb-4">
                🔍
              </div>
              <p class="text-gray-700 mb-4">No se encontró ninguna persona con el documento:</p>
              <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p class="text-lg font-bold text-yellow-800">${manualDocument}</p>
              </div>
              <p class="text-sm text-gray-600">
                Verifique que el número esté correcto o contacte al administrador
              </p>
            </div>
          `,
          icon: 'warning',
          confirmButtonColor: '#f59e0b',
          timer: 4000
        });
        return;
      }

      console.log('✅ Persona encontrada:', searchResult.profile);

      const checkInOrOut = await determineActionByProfile(searchResult.profile.id);
      console.log('🎯 Acción determinada para búsqueda manual:', checkInOrOut);
      
      let response;
      if (checkInOrOut === 'entry') {
        response = await accessService.checkIn({ profileId: searchResult.profile.id });
      } else {
        response = await accessService.checkOut({ profileId: searchResult.profile.id });
      }
      
      await showSuccessAlert(checkInOrOut, response);
      setManualDocument('');
      onScanSuccess();

    } catch (error: any) {
      console.error('❌ Error en búsqueda manual:', error);
      await showErrorAlert(
        error.response?.data?.message || 
        'Error al procesar el documento'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleError = (error: any) => {
    console.log('⚠️ Error técnico del escáner:', error);
    
    if (error.includes('NotAllowedError') || error.includes('Permission')) {
      Swal.fire({
        title: '📷 Permisos de cámara',
        text: 'Por favor permita el acceso a la cámara para usar el escáner QR',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
    }
  };

  const toggleScanning = () => {
    if (processingQR) return;
    setScanning(!scanning);
    setLastScannedCode('');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">🔍 Control de Acceso QR</h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
          scanning 
            ? processingQR 
              ? 'bg-yellow-100 text-yellow-800 animate-pulse' 
              : 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {scanning 
            ? processingQR 
              ? '⏸️ Procesando...' 
              : '🟢 Escaneando Activo'
            : '⭕ Escáner Detenido'
          }
        </div>
      </div>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={toggleScanning}
          disabled={processingQR}
          className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
            scanning
              ? processingQR
                ? 'bg-yellow-500 text-white cursor-not-allowed opacity-75'
                : 'bg-red-500 text-white hover:bg-red-600 shadow-lg hover:shadow-xl'
              : 'bg-sena-green text-white hover:bg-sena-dark shadow-lg hover:shadow-xl'
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
              <span>Iniciar Escáner QR</span>
            </>
          )}
        </button>
      </div>

      {scanning && (
        <div className="mb-6">
          <div className={`relative max-w-sm mx-auto border-4 rounded-xl overflow-hidden transition-all ${
            processingQR 
              ? 'border-yellow-400 bg-yellow-50 shadow-lg' 
              : 'border-green-400 bg-green-50 shadow-lg'
          }`}>
            {processingQR && (
              <div className="absolute inset-0 bg-yellow-100 bg-opacity-90 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-600 mx-auto mb-2"></div>
                  <p className="text-yellow-800 font-medium">Procesando...</p>
                  <p className="text-yellow-600 text-xs">Por favor espere</p>
                </div>
              </div>
            )}
            <div id="qr-reader" className="min-h-[300px]"></div>
          </div>
          <p className="text-center text-sm text-gray-600 mt-3 font-medium">
            {processingQR 
              ? '⏳ Espere mientras se procesa el código QR...' 
              : '📱 Apunte la cámara hacia el código QR del carnet'
            }
          </p>
        </div>
      )}

      <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium mb-3 flex items-center text-gray-800">
          <span className="mr-2">🔢</span>
          Búsqueda Manual por Documento
        </h3>
        <div className="flex space-x-2">
          <input
            type="text"
            value={manualDocument}
            onChange={(e) => setManualDocument(e.target.value.replace(/\D/g, ''))}
            onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
            placeholder="Ej: 12345678"
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sena-green focus:border-sena-green text-center text-lg font-mono transition-all"
            disabled={loading || processingQR}
            maxLength={15}
          />
          <button
            onClick={handleManualSearch}
            disabled={loading || !manualDocument.trim() || processingQR}
            className="px-6 py-3 bg-sena-green text-white rounded-lg hover:bg-sena-dark disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all shadow-md hover:shadow-lg"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              '🔍 Buscar'
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Ingrese solo números del documento de identidad (sin puntos ni espacios)
        </p>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2 flex items-center">
          <span className="mr-2">💡</span>
          Guía de Uso:
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-700">
          <ul className="space-y-1">
            <li>• 📷 Active el escáner y centre el código QR</li>
            <li>• ⏱️ Espere la confirmación antes del siguiente escaneo</li>
            <li>• 🔄 El sistema detecta automáticamente entrada/salida</li>
          </ul>
          <ul className="space-y-1">
            <li>• 🔢 Use búsqueda manual si el QR falla</li>
            <li>• 📱 Asegúrese de tener buena iluminación</li>
            <li>• 🆘 Contacte al admin si hay problemas persistentes</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;