import React from 'react';
import './Cenefa.css';

function Cenefa({ tipo = 1, datos = {}, mostrarAntes = true }) {
  const {
    descripcion = 'DESCRIPCIÓN DEL PRODUCTO',
    precioAntes = '',
    precioAhora = '0',
    codigo = '',
    ean = '',
  } = datos;

  // 🎯 TIPO 4: 180x65mm Sin precio antes (Precio Gigante Centrado)
  if (tipo === 4) {
    return (
      <div className="cenefa cenefa-tipo-4">
        <div className="cenefa-fondo" />
        <div className="cenefa-caja">
          <div className="cenefa-descripcion">{descripcion}</div>

          <div className="cenefa-codigos-t4">
            <span><strong>Cod.</strong> {codigo}</span>
            <span><strong>EAN:</strong> {ean}</span>
          </div>

          <div className="cenefa-precio-centrado">
            <span className="cenefa-ahora-gigante">
              ${precioAhora}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 🎯 TIPO 2: Layout compacto
  if (tipo === 2) {
    return (
      <div className="cenefa cenefa-tipo-2">
        <div className="cenefa-fondo" />
        <div className="cenefa-caja-t2">
          <div className="cenefa-t2-top">
            <div className="cenefa-descripcion-t2">{descripcion}</div>
            <div className="cenefa-precios-t2">
              {mostrarAntes && precioAntes && (
                <span className="cenefa-antes-t2">
                  <s>${precioAntes}</s>
                </span>
              )}
              <span className="cenefa-ahora-t2">
                <strong>${precioAhora}</strong>
              </span>
            </div>
          </div>
          <div className="cenefa-codigos-t2">
            <span><strong>Cod.</strong> {codigo}</span>
            <span><strong>EAN:</strong> {ean}</span>
          </div>
        </div>
        <div className="cenefa-oferta-t2">
          <span>OFERTA</span>
        </div>
      </div>
    );
  }

  // 🎯 TIPOS 1 Y 3
  return (
    <div className={`cenefa cenefa-tipo-${tipo}`}>
      <div className="cenefa-fondo" />
      <div className="cenefa-caja">
        <div className="cenefa-descripcion">{descripcion}</div>
        <div className="cenefa-precios">
          {mostrarAntes && precioAntes && (
            <span className="cenefa-antes">
              <s>${precioAntes}</s> /
            </span>
          )}
          <span className="cenefa-ahora">
            <strong>${precioAhora}</strong>
          </span>
        </div>
        <div className="cenefa-codigos">
          <span><strong>Cod.</strong> {codigo}</span>
          <span><strong>EAN:</strong> {ean}</span>
        </div>
      </div>
      <div className="cenefa-oferta">
        <span>OFERTA</span>
      </div>
    </div>
  );
}

export default Cenefa;