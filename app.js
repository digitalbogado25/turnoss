// CÓDIGO FINAL DE JAVASCRIPT
// ¡IMPORTANTE! Este archivo debe llamarse 'app.js'
// Se asume que los nombres de las columnas en tu hoja son:
// Timestamp, nombre, dni, historial, especialidad, fecha_turno, horario

// Mapeo de días para la validación de fecha
const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Estructura de datos (Tu lógica de validación no cambia)
const ESPECIALIDADES = {
    clinica_medica: {
        dias_semana: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
        horario: '10:00 a 14:00 hs'
    },
    psicologia: {
        dias_semana: ['Miércoles'],
        horario: '10:00 a 14:00 hs'
    },
    dermatologia: {
        dias_semana: ['Viernes'],
        horario: '12:30 a 16:00 hs'
    },
    neurologia: {
        dias_semana: ['Miércoles'],
        horario: '13:00 a 17:00 hs'
    }
};

const COSTO_CONSULTA = '15.000';
const WHATSAPP_NUMBER = '5491161205922'; 

// ---------------------------------------------------
// 🔥 CAMBIO CRÍTICO 1: Usar la URL de SheetDB
// ---------------------------------------------------
const WEB_APP_URL = 'https://sheetdb.io/api/v1/b8pvq9f7u1pr3'; 
// ---------------------------------------------------

// Elementos del DOM (No cambian)
const form = document.getElementById('reservaForm');
const inputNombre = document.getElementById('nombre');
const inputDni = document.getElementById('dni');
const selectTipoPaciente = document.getElementById('tipo_paciente'); 
const selectEspecialidad = document.getElementById('especialidad');
const inputFecha = document.getElementById('fecha_turno');
const diaAyuda = document.getElementById('diaAyuda');
const btnReservar = document.getElementById('btnReservar');

// ... (Todas tus funciones de inicialización, actualizarSelectorFecha, 
// validarDiaYFecha y checkFormValidity van aquí y NO CAMBIAN) ...

// [Copia y pega aquí todas tus funciones que no son el addEventListener]
// ...
// Función para actualizar el texto de ayuda
function actualizarSelectorFecha() {
    const especialidadSeleccionada = selectEspecialidad.value;
    const infoEspecialidad = ESPECIALIDADES[especialidadSeleccionada];

    if (infoEspecialidad) {
        const dias = infoEspecialidad.dias_semana.join(', ');
        diaAyuda.textContent = `Disponible solo los días: ${dias}`;
        diaAyuda.style.color = 'var(--color-primario-base)';
    } else {
        diaAyuda.textContent = 'Selecciona una especialidad primero.';
        diaAyuda.style.color = 'gray';
    }
    checkFormValidity();
}

// Función para verificar si la fecha seleccionada es válida para la especialidad
function validarDiaYFecha() {
    const fechaSeleccionada = inputFecha.value;
    const especialidadKey = selectEspecialidad.value;

    if (!fechaSeleccionada || !especialidadKey) return false;

    // Se agrega 'T00:00:00' para asegurar que la fecha se interprete como local (evitar desfase horario)
    const fecha = new Date(fechaSeleccionada + 'T00:00:00'); 
    const diaIndex = fecha.getDay();
    const diaNombre = DIAS_SEMANA[diaIndex];
    
    const diasPermitidos = ESPECIALIDADES[especialidadKey].dias_semana;

    const esValido = diasPermitidos.includes(diaNombre);

    if (esValido) {
        inputFecha.classList.remove('is-invalid');
        inputFecha.classList.add('is-valid');
    } else {
        inputFecha.classList.remove('is-valid');
        inputFecha.classList.add('is-invalid');
    }
    
    return esValido;
}

// Función para habilitar/deshabilitar el botón de reserva
function checkFormValidity() {
    const todosLlenos = (
        inputNombre.value.trim() && 
        inputDni.value.trim() &&
        selectTipoPaciente.value && 
        selectEspecialidad.value &&
        inputFecha.value.trim()
    );

    const diaYFechaValidos = validarDiaYFecha();

    btnReservar.disabled = !(todosLlenos && diaYFechaValidos);
}
// Event Listeners (No cambian)
selectEspecialidad.addEventListener('change', actualizarSelectorFecha);
selectEspecialidad.addEventListener('change', checkFormValidity);
inputNombre.addEventListener('input', checkFormValidity);
inputDni.addEventListener('input', checkFormValidity);
selectTipoPaciente.addEventListener('change', checkFormValidity);
inputFecha.addEventListener('change', checkFormValidity);

// --- FUNCIÓN DE ENVÍO FINAL A SHEETDB ---
form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!validarDiaYFecha()) {
        alert('Por favor, selecciona una fecha válida que coincida con la disponibilidad de la especialidad.');
        return;
    }

    btnReservar.disabled = true;
    btnReservar.textContent = "Procesando...";

    const nombrePaciente = inputNombre.value.trim();
    const dniPaciente = inputDni.value.trim();
    const tipoPacienteKey = selectTipoPaciente.value;
    const especialidadKey = selectEspecialidad.value;
    const info = ESPECIALIDADES[especialidadKey];
    
    // ---------------------------------------------------
    // 🔥 CAMBIO CRÍTICO 2: Estructura de datos para SheetDB
    // ---------------------------------------------------
    const formDataToSend = {
        data: { // SheetDB necesita que los datos se agrupen bajo la clave 'data'
            // Asegurarse que las CLAVES coincidan con los encabezados de tu Hoja de Cálculo
            Timestamp: new Date().toISOString(), 
            nombre: nombrePaciente,
            dni: dniPaciente,
            historial: (tipoPacienteKey === 'existente') ? 'SÍ, soy paciente' : 'NO, es la primera vez',
            especialidad: selectEspecialidad.options[selectEspecialidad.selectedIndex].textContent,
            fecha_turno: inputFecha.value, 
            horario: info.horario 
        }
    };

    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            // NO se necesita mode: 'cors' o mode: 'no-cors' con fetch a SheetDB
            // Las cabeceras son solo JSON
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formDataToSend) // Enviamos el objeto con la clave 'data'
        });

        // SheetDB siempre devuelve un JSON
        const result = await response.json();

        // SheetDB devuelve { created: 1 } en caso de éxito
        if (response.ok && result.created === 1) {
            
            // 1. Datos guardados con éxito en Google.
            
            // 2. Redireccionar a WhatsApp (Tu lógica de WhatsApp no cambia)
            const fechaFormateada = new Date(inputFecha.value + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            
            const mensajeWhatsApp = `*¡CONFIRMACIÓN DE RESERVA AUTOMÁTICA!*
Hola, ya hemos registrado tu solicitud de turno en nuestra planilla y calendario.
            
* **Paciente:** ${nombrePaciente} (${dniPaciente})
* **Especialidad:** ${formDataToSend.data.especialidad}
* **Fecha:** ${fechaFormateada}
* **Horario:** ${info.horario}
* **Costo:** $${COSTO_CONSULTA}
            
Para finalizar y recibir tu **Número de Orden**, necesitamos que envíes el comprobante de pago por Mercado Pago o confirmes si pagarás en Efectivo.`;

            const mensajeCodificado = encodeURIComponent(mensajeWhatsApp.trim());
            const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${mensajeCodificado}`;
            
            // Abrir WhatsApp en una nueva pestaña y mostrar alerta de éxito
            alert("✅ Solicitud de reserva enviada con éxito. Ahora serás redirigido/a para la confirmación de pago y orden.");
            window.open(whatsappURL, '_blank');
            
            // Resetear el formulario y botones
            form.reset();
            actualizarSelectorFecha(); 
            btnReservar.textContent = "Continuar a WhatsApp para Reservar";
            btnReservar.disabled = true; 

        } else {
            // Si SheetDB falla (ej. si la hoja de cálculo tiene un error o no está compartida)
            throw new Error(result.error || 'Error desconocido al guardar los datos en Google Sheets a través de SheetDB.');
        }

    } catch (error) {
        console.error('Error al enviar datos:', error);
        alert('❌ Hubo un error al registrar tu reserva. Por favor, intenta de nuevo o contacta por WhatsApp directamente.'); // El alert original
        btnReservar.textContent = "Continuar a WhatsApp para Reservar";
        btnReservar.disabled = false;
    }
});