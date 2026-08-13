import React from 'react';
import './Etiqueta.css';

function Etiqueta({ tipo = 'NORMAL', datos = {} }) {
  const {
    descripcion = 'DESCRIPCIÓN DEL PRODUCTO',
    fecha = '00/00/0000',
    codigoInterno = '00000',
    codigoBarras = '0000000000000',
    precioUnitario = '0.00',       // PRECIO LISTA BASE (Lado Derecho)
    precioSinImpuesto = '0.00',    // PRECIO SIN IVA (Lado Derecho)
    precioCantidad = '',           // PRECIO X VOLUMEN (Lado Izquierdo)
    compraMinima = '',             // CANTIDAD MÍNIMA (Lado Izquierdo)
    CantUni = 1
  } = datos;

  if (tipo === 'PACK') {
    return (
      <div className="etiqueta-container formato-pack">
        {/* ENCABEZADO */}
        <div className="header">
          {descripcion}
        </div>

        {/* METADATOS */}
        <div className="top-row">
          <span>{fecha}</span>
          <span>Scanner: {codigoBarras}</span>
        </div>

        <div className="sub-header-ci">
          <span>CI: {codigoInterno}</span>
        </div>

        <div className="bottom-row">
          <div className="box-pack">
            <span className="referencia">REFERENCIA:</span>
            <span className="texto-pack">PACK X {CantUni}</span>
          </div>

          <div className="box-precio">
            <span className="precio-titulo">Precio Venta</span>
            <div className="precio-container">
              <span className="simbolo-peso">$</span>
              <span className="precio-grande">{precioUnitario}</span>
            </div>
            
            <div className="precio-sin-iva-pack">
              <span className="label-sin-iva">Precio S/Imp/Nac</span>
              <span className="valor-sin-iva">${precioSinImpuesto}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // FORMATO NORMAL
  return (
    <div className="etiqueta-container formato-normal">
      <div className="header">
        {descripcion}
      </div>

      <div className="sub-header">
        <span>{fecha}</span>
        <span>CI: {codigoInterno}</span>
        <span>{codigoBarras}</span>
      </div>

      <div className="body-content">
        {/* LADO IZQUIERDO: PRECIO X VOLUMEN */}
        <div className="col-izq">
          <span className="titulo-seccion">PRECIO X VOLUMEN</span>
          
          {/* 🌟 AHORA USA LAS MISMAS CLASES QUE EL LADO DERECHO 🌟 */}
          <div className="precio-container">
            <span className="simbolo-peso">$</span>
            <span className="precio-grande">{precioCantidad || '0,00'}</span>
          </div>

          <span className="pie-texto">
            {compraMinima ? `COMPRA MINIMA: ${compraMinima}` : ''}
          </span>
        </div>

        {/* LADO DERECHO: PRECIO UNITARIO */}
        <div className="col-der">
          <span className="titulo-seccion">PRECIO UNITARIO</span>
          
          <div className="precio-container">
            <span className="simbolo-peso">$</span>
            <span className="precio-grande">{precioUnitario}</span>
          </div>

          <div className="pie-derecho">
            <span>Precio S/Imp/Nac</span>
            <span>${precioSinImpuesto}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Etiqueta;