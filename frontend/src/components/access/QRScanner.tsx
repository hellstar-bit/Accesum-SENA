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

const [keyboardBuffer, setKeyboardBuffer] = useState('');
const [usbScannerActive, setUsbScannerActive] = useState(false);
const [lastUsbScan, setLastUsbScan] = useState('');
const keyboardTimeoutRef = useRef<number | null>(null);
const inputFieldRef = useRef<HTMLInputElement>(null);

// ⭐ AGREGAR ESTE useEffect (después de los existentes)
useEffect(() => {
  if (!usbScannerActive) return;

  console.log('🔌 Listener USB activado'); // ⭐ AGREGAR ESTO

  const handleKeyboardInput = (event: KeyboardEvent) => {
    console.log('⌨️ Tecla presionada:', event.key, 'Target:', event.target); // ⭐ AGREGAR ESTO
    
    // Solo capturar si el foco está en nuestro campo especial
    if (event.target === inputFieldRef.current) {
      console.log('✅ Evento en campo correcto'); // ⭐ AGREGAR ESTO
      
      // Enter indica fin de escaneo
      if (event.key === 'Enter') {
        event.preventDefault();
        console.log('🔍 ENTER detectado, buffer:', keyboardBuffer); // ⭐ AGREGAR ESTO
        if (keyboardBuffer.length > 0) {
          console.log('🔍 QR desde escáner USB HC-655:', keyboardBuffer);
          handleScan(keyboardBuffer.trim());
          setKeyboardBuffer('');
          setLastUsbScan(keyboardBuffer.trim());
          if (inputFieldRef.current) {
            inputFieldRef.current.value = '';
          }
        }
        return;
      }

      // Acumular caracteres
      if (event.key.length === 1 || event.key === 'Backspace') {
        console.log('📝 Agregando carácter al buffer:', event.key); // ⭐ AGREGAR ESTO
        
        if (keyboardTimeoutRef.current) {
          clearTimeout(keyboardTimeoutRef.current);
        }
        
        keyboardTimeoutRef.current = setTimeout(() => {
          console.log('⏰ Timeout de escáner USB, reseteando buffer');
          setKeyboardBuffer('');
          if (inputFieldRef.current) {
            inputFieldRef.current.value = '';
          }
        }, 3000);
      }
    } else {
      console.log('❌ Evento NO en campo correcto, target:', event.target); // ⭐ AGREGAR ESTO
    }
  };

  document.addEventListener('keydown', handleKeyboardInput);
  
  return () => {
    console.log('🔌 Listener USB desactivado'); // ⭐ AGREGAR ESTO
    document.removeEventListener('keydown', handleKeyboardInput);
    if (keyboardTimeoutRef.current) {
      clearTimeout(keyboardTimeoutRef.current);
    }
  };
}, [usbScannerActive, keyboardBuffer]);

// ⭐ AGREGAR ESTE useEffect TAMBIÉN
useEffect(() => {
  return () => {
    if (keyboardTimeoutRef.current) {
      clearTimeout(keyboardTimeoutRef.current);
    }
  };
}, []);

  // ⭐ FUNCIÓN MEJORADA PARA VALIDAR QR
  const validateAndCleanQRData = (rawData: string): string => {
  try {
    console.log('🔍 Validando QR raw:', rawData);
    
    // ⭐ DETECTAR FORMATO HC-655
    if (rawData.includes('[') && rawData.includes('Ñ') && rawData.includes('*')) {
      console.log('🔌 Formato HC-655 detectado');
      return parseHC655Format(rawData);
    }
    
    // Intentar como JSON normal
    const parsed = JSON.parse(rawData);
    
    if (parsed && typeof parsed === 'object') {
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
    
    // Resto de tu lógica existente...
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
    console.log('🏢 Personas actualmente dentro:', current.total || current.current);
    
    // ⭐ CORREGIR ACCESO A LOS REGISTROS SEGÚN LA ESTRUCTURA REAL
    let records = [];
    if (current.records) {
      records = current.records;
    } else if (current.details) {
      records = current.details;
    } else if (current.peopleInside) {
      records = current.peopleInside;
    } else {
      console.log('⚠️ No se encontraron registros de personas dentro');
      return 'entry';
    }

    console.log('🏢 Registros encontrados:', records.length);
    
    // ⭐ BUSCAR EL DOCUMENTO EN LOS DIFERENTES FORMATOS POSIBLES
    const isInside = records.some(record => {
      // Verificar diferentes estructuras posibles
      const userProfile = record.user?.profile;
      const profileData = record.profile;
      
      // Formato 1: record.user.profile.documentNumber
      if (userProfile?.documentNumber === qrInfo.doc) {
        console.log('✅ Encontrado en user.profile:', userProfile.documentNumber);
        return true;
      }
      
      // Formato 2: record.profile.documentNumber (directo)
      if (profileData?.documentNumber === qrInfo.doc) {
        console.log('✅ Encontrado en profile directo:', profileData.documentNumber);
        return true;
      }
      
      // Formato 3: record.documentNumber (directo en el record)
      if (record.documentNumber === qrInfo.doc) {
        console.log('✅ Encontrado en record directo:', record.documentNumber);
        return true;
      }
      
      return false;
    });
    
    console.log('🎯 ¿Está dentro?', isInside, 'para documento:', qrInfo.doc);
    return isInside ? 'exit' : 'entry';
  } catch (error) {
    console.error('❌ Error determinando acción:', error);
    // Por defecto, asumir entrada si hay error
    return 'entry';
  }
};

  const parseHC655Format = (rawData: string): string => {
  try {
    console.log('🔧 Parseando formato HC-655:', rawData);
    
    // Limpiar caracteres especiales del HC-655
    let cleaned = rawData
      .replace(/\[/g, '"')        // [ → "
      .replace(/Ñ/g, ':')         // Ñ → :
      .replace(/\?/g, '_')        // ? → _
      .replace(/\*/g, '')         // * → (nada)
      .replace(/,$/, '');         // quitar coma final si existe
    
    console.log('🔧 Después de limpiar:', cleaned);
    
    // Reconstruir como JSON válido
    // Patrón: "key":"value" o "key":number
    cleaned = '{' + cleaned + '}';
    
    // Arreglar formato de números (quitar comillas innecesarias)
    cleaned = cleaned.replace(/"(\d+)"/g, '$1'); // "123" → 123
    
    console.log('🔧 JSON reconstruido:', cleaned);
    
    // Intentar parsear
    const parsed = JSON.parse(cleaned);
    console.log('✅ Parseado exitoso:', parsed);
    
    // Validar que tenga los campos necesarios
    if (parsed.doc && parsed.type) {
      return JSON.stringify(parsed);
    } else {
      throw new Error('Campos requeridos faltantes');
    }
    
  } catch (error) {
    console.error('❌ Error parseando HC-655:', error);
    console.log('🔧 Intentando método alternativo...');
    
    // Método alternativo: extraer campos manualmente
    try {
      const docMatch = rawData.match(/doc\[Ñ\[?(\d+)/);
      const typeMatch = rawData.match(/type\[Ñ\[?([A-Z_?]+)/);
      const idMatch = rawData.match(/id\[Ñ(\d+)/);
      const timestampMatch = rawData.match(/timestamp\[Ñ(\d+)/);
      
      if (docMatch && typeMatch) {
        const reconstructed = {
          id: idMatch ? parseInt(idMatch[1]) : null,
          doc: docMatch[1],
          type: typeMatch[1].replace(/\?/g, '_'), // ? → _
          timestamp: timestampMatch ? parseInt(timestampMatch[1]) : Date.now()
        };
        
        console.log('✅ Reconstrucción manual exitosa:', reconstructed);
        return JSON.stringify(reconstructed);
      }
      
      throw new Error('No se pudieron extraer campos');
    } catch (altError) {
      console.error('❌ Error en método alternativo:', altError);
      throw new Error(`Formato HC-655 no válido: ${rawData.substring(0, 50)}...`);
    }
  }
};

  const determineActionByProfile = async (profileId: number): Promise<'entry' | 'exit'> => {
  try {
    console.log('🎯 Determinando acción por perfil ID:', profileId);
    const current = await accessService.getCurrentOccupancy();
    
    // ⭐ BUSCAR EN DIFERENTES ESTRUCTURAS POSIBLES
    let records = [];
    if (current.records) {
      records = current.records;
    } else if (current.details) {
      records = current.details;
    } else if (current.peopleInside) {
      records = current.peopleInside;
    }
    
    const isInside = records.some(record => {
      // Verificar diferentes formas de acceder al ID del perfil
      const userProfileId = record.user?.profile?.id;
      const profileId_direct = record.profileId;
      const userId = record.user?.id;
      
      return userProfileId === profileId || profileId_direct === profileId || userId === profileId;
    });
    
    console.log('🎯 ¿Perfil está dentro?', isInside);
    return isInside ? 'exit' : 'entry';
  } catch (error) {
    console.error('Error determinando acción por perfil:', error);
    return 'entry';
  }
};

  const showSuccessAlert = async (tipo: 'entry' | 'exit', response: any) => {
  const isEntry = tipo === 'entry';
  
  // ⭐ VERIFICAR QUE LA RESPUESTA TENGA LA ESTRUCTURA CORRECTA
  if (!response || !response.user || !response.user.profile) {
    console.error('❌ Estructura de respuesta inválida:', response);
    
    // ⭐ MOSTRAR ALERTA DE ÉXITO BÁSICA SI NO HAY DATOS COMPLETOS
    return Swal.fire({
      title: `✅ ${isEntry ? 'ENTRADA' : 'SALIDA'} REGISTRADA`,
      html: `
        <div class="text-center">
          <div class="mb-4">
            <div class="w-20 h-20 rounded-full mx-auto ${isEntry ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center ${isEntry ? 'text-green-600' : 'text-red-600'} text-2xl font-bold mb-2 border-4 ${isEntry ? 'border-green-400' : 'border-red-400'}">
              ${isEntry ? '✅' : '🚪'}
            </div>
          </div>
          <h3 class="text-lg font-semibold text-gray-800">Acceso Registrado</h3>
          <div class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-3 ${
            isEntry 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }">
            ${isEntry ? '🏢 INGRESÓ A LAS INSTALACIONES' : '🚪 SALIÓ DE LAS INSTALACIONES'}
          </div>
          <p class="text-sm text-gray-500">
            ${new Date(response.entryTime || response.exitTime || Date.now()).toLocaleString('es-CO', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long', 
              day: 'numeric',
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            })}
          </p>
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
  }

  // ⭐ SI LA RESPUESTA TIENE LA ESTRUCTURA CORRECTA, MOSTRAR DATOS COMPLETOS
  const user = response.user.profile;
  
  return Swal.fire({
    title: `✅ ${isEntry ? 'ENTRADA' : 'SALIDA'} REGISTRADA`,
    html: `
      <div class="text-center">
        <div class="mb-4">
          ${user.profileImage 
            ? `<img src="${user.profileImage}" class="w-20 h-20 rounded-full mx-auto object-cover mb-2 border-4 ${isEntry ? 'border-green-400' : 'border-red-400'}" />` 
            : `<div class="w-20 h-20 rounded-full mx-auto ${isEntry ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center ${isEntry ? 'text-green-600' : 'text-red-600'} text-2xl font-bold mb-2 border-4 ${isEntry ? 'border-green-400' : 'border-red-400'}">${user.firstName?.charAt(0) || '?'}${user.lastName?.charAt(0) || ''}</div>`
          }
        </div>
        <h3 class="text-lg font-semibold text-gray-800">${user.firstName || 'Sin nombre'} ${user.lastName || ''}</h3>
        <p class="text-sm text-gray-600 mb-2">${user.type || 'Tipo desconocido'} - ${user.documentNumber || 'Sin documento'}</p>
        <div class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-3 ${
          isEntry 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }">
          ${isEntry ? '🏢 INGRESÓ A LAS INSTALACIONES' : '🚪 SALIÓ DE LAS INSTALACIONES'}
        </div>
        <p class="text-sm text-gray-500">
          ${new Date(response.entryTime || response.exitTime || Date.now()).toLocaleString('es-CO', { 
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
    
    // ⭐ USAR EL ENDPOINT CORRECTO CON QUERY PARAMS
    const searchResult = await accessService.searchByDocument(manualDocument);
    console.log('📋 Resultado de búsqueda:', searchResult);
    
    // ⭐ VERIFICAR ESTRUCTURA DE RESPUESTA CORRECTA
    if (!searchResult || !searchResult.found) {
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
              ${searchResult?.message || 'Verifique que el número esté correcto o contacte al administrador'}
            </p>
          </div>
        `,
        icon: 'warning',
        confirmButtonColor: '#f59e0b',
        timer: 4000
      });
      return;
    }

    // ⭐ EXTRAER PERFIL DE LA RESPUESTA CORRECTAMENTE
    let profileData = null;
    let profileId = null;

    // Verificar diferentes estructuras de respuesta
    if (searchResult.profile) {
      profileData = searchResult.profile;
      profileId = searchResult.profile.id;
    } else if (searchResult.user?.profile) {
      profileData = searchResult.user.profile;
      profileId = searchResult.user.profile.id;
    } else if (searchResult.data?.profile) {
      profileData = searchResult.data.profile;
      profileId = searchResult.data.profile.id;
    }

    if (!profileData || !profileId) {
      console.error('❌ No se pudo extraer información del perfil:', searchResult);
      await showErrorAlert('Error al procesar la información del usuario encontrado');
      return;
    }

    console.log('✅ Persona encontrada:', {
      id: profileId,
      name: `${profileData.firstName} ${profileData.lastName}`,
      document: profileData.documentNumber
    });

    // ⭐ DETERMINAR ACCIÓN USANDO EL ID DEL PERFIL
    const checkInOrOut = await determineActionByProfile(profileId);
    console.log('🎯 Acción determinada para búsqueda manual:', checkInOrOut);
    
    // ⭐ EJECUTAR CHECK-IN O CHECK-OUT
    let response;
    if (checkInOrOut === 'entry') {
      console.log('📡 Enviando CHECK-IN manual para perfil:', profileId);
      response = await accessService.checkIn({ profileId: profileId });
    } else {
      console.log('📡 Enviando CHECK-OUT manual para perfil:', profileId);
      response = await accessService.checkOut({ profileId: profileId });
    }
    
    console.log('✅ Operación manual exitosa:', response);
    
    // ⭐ MOSTRAR ALERTA DE ÉXITO
    await showSuccessAlert(checkInOrOut, response);
    setManualDocument('');
    onScanSuccess();

  } catch (error: any) {
    console.error('❌ Error en búsqueda manual:', error);
    
    // ⭐ MEJORAR MANEJO DE ERRORES
    let errorMessage = 'Error al procesar el documento';
    
    if (error.response?.status === 404) {
      errorMessage = `No se encontró ninguna persona con el documento ${manualDocument}`;
    } else if (error.response?.status === 400) {
      errorMessage = error.response?.data?.message || 'Datos inválidos en la búsqueda';
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    await showErrorAlert(errorMessage);
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
          : usbScannerActive
          ? 'bg-purple-100 text-purple-800'
          : 'bg-gray-100 text-gray-800'
      }`}>
        {scanning 
          ? processingQR 
            ? '⏸️ Procesando...' 
            : '🟢 Cámara Activa'
          : usbScannerActive
          ? '🔌 USB HC-655 Activo'
          : '⭕ Escáneres Detenidos'
        }
      </div>
    </div>

    {/* ⭐ BOTONES PARA AMBOS TIPOS DE ESCÁNER */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Escáner por Cámara */}
      <button
        onClick={toggleScanning}
        disabled={processingQR || usbScannerActive}
        className={`py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
          scanning
            ? processingQR
              ? 'bg-yellow-500 text-white cursor-not-allowed opacity-75'
              : 'bg-red-500 text-white hover:bg-red-600 shadow-lg hover:shadow-xl'
            : usbScannerActive
            ? 'bg-gray-400 text-white cursor-not-allowed'
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
              <span>Detener Cámara</span>
            </>
          )
        ) : (
          <>
            <span>📷</span>
            <span>Escáner Cámara</span>
          </>
        )}
      </button>

      {/* ⭐ NUEVO: Escáner USB HC-655 */}
      <button
        onClick={() => {
          setUsbScannerActive(!usbScannerActive);
          if (!usbScannerActive) {
            // Detener cámara si está activa
            if (scanning) {
              setScanning(false);
            }
            // Enfocar el campo cuando se active
            setTimeout(() => {
              inputFieldRef.current?.focus();
            }, 100);
          }
        }}
        disabled={processingQR || scanning}
        className={`py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
          usbScannerActive
            ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-lg hover:shadow-xl'
            : scanning
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl'
        }`}
      >
        <span>🔌</span>
        <span>{usbScannerActive ? 'Detener USB HC-655' : 'Activar USB HC-655'}</span>
      </button>
    </div>

    {/* ⭐ CAMPO ESPECIAL PARA ESCÁNER USB HC-655 */}
    {usbScannerActive && (
      <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
        <h3 className="text-lg font-medium mb-3 flex items-center text-purple-800">
          <span className="mr-2">🔌</span>
          Escáner USB HC-655 Activo
        </h3>
        
        <div className="bg-white rounded-lg p-4 border-2 border-dashed border-purple-300 mb-3">
          <input
            ref={inputFieldRef}
            type="text"
            value={keyboardBuffer}
            onChange={(e) => setKeyboardBuffer(e.target.value)}
            placeholder="Escanee un código QR con el HC-655..."
            className="w-full px-4 py-3 text-lg font-mono text-center border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-50"
            disabled={processingQR}
            autoFocus
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-700">
          <div className="space-y-1">
            <p>• <strong>Haga clic en el campo de arriba</strong></p>
            <p>• <strong>Escanee el código QR</strong> con su HC-655</p>
            <p>• <strong>El resultado se procesa automáticamente</strong></p>
          </div>
          <div className="space-y-1">
            <p>• <strong>El escáner "tipea" automáticamente</strong></p>
            <p>• <strong>Presiona Enter al finalizar</strong></p>
            <p>• <strong>No necesita drivers adicionales</strong></p>
          </div>
        </div>

        {lastUsbScan && (
          <div className="mt-3 p-2 bg-purple-100 rounded-lg">
            <p className="text-sm text-purple-700">
              📋 <strong>Último escaneo:</strong> 
              <code className="bg-purple-200 px-2 py-1 rounded ml-2 text-xs">
                {lastUsbScan.length > 40 ? lastUsbScan.substring(0, 40) + '...' : lastUsbScan}
              </code>
            </p>
          </div>
        )}
      </div>
    )}

    {/* SECCIÓN DE CÁMARA (solo si está activa) */}
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

    {/* BÚSQUEDA MANUAL POR DOCUMENTO */}
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
          disabled={loading || processingQR || usbScannerActive}
          maxLength={15}
        />
        <button
          onClick={handleManualSearch}
          disabled={loading || !manualDocument.trim() || processingQR || usbScannerActive}
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
      {(usbScannerActive || scanning) && (
        <p className="text-xs text-orange-600 mt-1 text-center font-medium">
          ⚠️ Búsqueda manual deshabilitada mientras un escáner está activo
        </p>
      )}
    </div>

    {/* GUÍA DE USO ACTUALIZADA */}
    <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4">
      <h4 className="font-medium text-blue-800 mb-2 flex items-center">
        <span className="mr-2">💡</span>
        Guía de Uso:
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-blue-700">
        <div>
          <h5 className="font-medium mb-1">📷 Escáner Cámara:</h5>
          <ul className="space-y-1">
            <li>• Active el escáner y centre el QR</li>
            <li>• Asegúrese de tener buena iluminación</li>
            <li>• Espere la confirmación antes del siguiente escaneo</li>
          </ul>
        </div>
        <div>
          <h5 className="font-medium mb-1">🔌 Escáner USB HC-655:</h5>
          <ul className="space-y-1">
            <li>• Active el modo USB HC-655</li>
            <li>• Haga clic en el campo de texto</li>
            <li>• Escanee con el dispositivo HC-655</li>
          </ul>
        </div>
        <div>
          <h5 className="font-medium mb-1">🔢 Búsqueda Manual:</h5>
          <ul className="space-y-1">
            <li>• Use si los escáneres fallan</li>
            <li>• Ingrese solo números del documento</li>
            <li>• Contacte al admin si hay problemas</li>
          </ul>
        </div>
      </div>
    </div>

    {/* ⭐ INFORMACIÓN ESPECÍFICA DEL HC-655 */}
    {!scanning && !usbScannerActive && (
      <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
        <h5 className="font-medium text-purple-800 mb-2">🔌 ¿Tiene un escáner HC-655?</h5>
        <p className="text-sm text-purple-700">
          Su escáner HC-655 funciona como un teclado virtual. Active el modo "USB HC-655" arriba 
          para usarlo directamente sin necesidad de cámara web.
        </p>
      </div>
    )}
  </div>
);
}
export default QRScanner;