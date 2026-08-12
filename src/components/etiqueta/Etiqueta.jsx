import React from 'react';
import './Etiqueta.css'; // 👈 Importación directa de CSS estándar

export const Etiqueta = ({ tipo, datos }) => {
  const isPack = tipo === 'PACK' || tipo === 7;

  return (
    <div className={`etiqueta-container ${isPack ? 'formato-pack' : 'formato-normal'}`}>
      
      {/* ===== CASO 1: ETIQUETA NORMAL ===== */}
      {!isPack && (
        <>
          <div className="header">{datos?.descripcion}</div>
          <div className="sub-header">
            <span>{datos?.fecha}</span>
            <span>CI: {datos?.codigoInterno}</span>
            <span>{datos?.codigoBarras || datos?.scanner}</span>
          </div>
          <div className="body-content">
            <div className="col-izq">
              <span className="titulo-seccion">PRECIO X VOLUMEN</span>
              <span className="simbolo-peso">$</span>
              <span className="pie-texto">COMPRA MINIMA:</span>
            </div>
            <div className="col-der">
              <span className="titulo-seccion">PRECIO UNITARIO</span>
              <div className="precio-container">
                <span className="simbolo-peso">$</span>
                <span className="precio-grande">{datos?.precioUnitario}</span>
              </div>
              <div className="pie-derecho">
                <span>Precio S/Imp/Nac</span>
                <span>${datos?.precioSinImpuesto}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===== CASO 2: ETIQUETA PACK ===== */}
      {isPack && (
        <>
          {/* 🟢 DESCRIPCIÓN AGREGADA ARRIBA */}
          <div className="header">{datos?.descripcion}</div>

          <div className="top-row">
            <span>{datos?.fecha}</span>
            <span>Scanner: {datos?.scanner}</span>
          </div>
          <div className="top-row sin-borde">
            <span>CI: {datos?.codigoInterno}</span>
          </div>
          <div className="bottom-row">
            <div className="box-pack">
              <span className="referencia">Referencia:</span>
              <span className="texto-pack">PACK</span>
            </div>
            <div className="box-precio">
              <span className="precio-titulo">Precio Venta</span>
              <div className="precio-container">
                <span className="simbolo">$</span>
                <span className="precio-grande">{datos?.precioUnitario}</span>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default Etiqueta;