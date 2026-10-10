function Cenefa({ tipo = 1, datos = {}, mostrarAntes = true }) {
  const {
    descripcion = 'DESCRIPCIÓN DEL PRODUCTO',
    precioAntes = '',
    precioAhora = '0',
    codigo = '',
    ean = '',
  } = datos;

  // 🎯 Layout especial para tipo 2
  if (tipo === 2) {
    return (
      <div className="cenefa cenefa-tipo-2">
        <div className="cenefa-fondo" />

        <div className="cenefa-caja-t2">
          {/* Bloque superior: descripción + precios, centrado */}
          <div className="cenefa-t2-top">
            <div className="cenefa-descripcion-t2">{descripcion}</div>

            <div className="cenefa-precios-t2">
              {mostrarAntes && precioAntes && (
                <span className="cenefa-antes-t2">
                  Antes: <s>${precioAntes}</s>
                </span>
              )}
              <span className="cenefa-ahora-t2">
                Ahora: <strong>${precioAhora}</strong>
              </span>
            </div>
          </div>

          {/* Bloque inferior: códigos alineados abajo */}
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

  // 🎯 Resto de tipos (1 y 3) siguen igual
  return (
    <div className={`cenefa cenefa-tipo-${tipo}`}>
      <div className="cenefa-fondo" />
      <div className="cenefa-caja">
        <div className="cenefa-descripcion">{descripcion}</div>

        <div className="cenefa-precios">
          {mostrarAntes && precioAntes && (
            <span className="cenefa-antes">
              Antes: <s>${precioAntes}</s> /
            </span>
          )}
          <span className="cenefa-ahora">
            Ahora: <strong>${precioAhora}</strong>
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