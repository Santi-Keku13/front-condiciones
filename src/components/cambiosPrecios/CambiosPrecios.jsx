import React, { useState, useMemo, useEffect, useRef } from 'react';
import styles from '../condiciones/Condiciones.module.css';
import * as XLSX from 'xlsx';
import Etiqueta from '../etiqueta/Etiqueta';

function CambiosPrecios({ datosPrecios, datosCondiciones = [], cargando, error, onOpenModal }) {
  const [busquedaPrecios, setBusquedaPrecios] = useState('');
  const [fechaFiltroPrecio, setFechaFiltroPrecio] = useState(new Date().toISOString().substring(0, 10));
  
  // --- ESTADO PARA MULTISELECCIÓN DE LISTAS ---
  const [listasSeleccionadas, setListasSeleccionadas] = useState([]);
  const [mostrarDropdownListas, setMostrarDropdownListas] = useState(false);
  const dropdownRef = useRef(null);

  // --- ESTADOS PARA OTROS FILTROS ---
  const [filtroDepto, setFiltroDepto] = useState('TODOS');
  const [filtroFamilia, setFiltroFamilia] = useState('TODOS');
  const [filtroSubFamilia, setFiltroSubFamilia] = useState('TODOS');

  const [paginaActual, setPaginaActual] = useState(1);
  const filasPorPagina = 50;

  useEffect(() => {
    setPaginaActual(1);
  }, [busquedaPrecios, fechaFiltroPrecio, listasSeleccionadas, filtroDepto, filtroFamilia, filtroSubFamilia]);

  // Cierra el menú desplegable si se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMostrarDropdownListas(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 🔍 MAPA DE BÚSQUEDA RÁPIDA DE CONDICIONES
  const mapaCondiciones = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(datosCondiciones)) return map;

    datosCondiciones.forEach(cond => {
      if (cond.IDArticuloReal !== undefined && cond.IDArticuloReal !== null) {
        map.set(String(cond.IDArticuloReal).trim(), cond);
      }
    });

    return map;
  }, [datosCondiciones]);

  // --- EXTRACCIÓN DE OPCIONES PARA DROPDOWNS ---
  const opcionesFiltros = useMemo(() => {
    const listas = new Set();
    const deptos = new Set();
    const familias = new Set();
    const subFamilias = new Set();

    datosPrecios.forEach(item => {
      if (item.Lista) listas.add(item.Lista);
      if (item.Departamento) deptos.add(item.Departamento);
      if (item.Familia) familias.add(item.Familia);
      if (item.SubFamilia) subFamilias.add(item.SubFamilia);
    });

    return {
      listas: Array.from(listas).sort((a, b) => a - b),
      deptos: Array.from(deptos).sort(),
      familias: Array.from(familias).sort(),
      subFamilias: Array.from(subFamilias).sort()
    };
  }, [datosPrecios]);

  // HANDLER PARA MANEJAR MARCAR / DESMARCAR LISTAS
  const handleToggleLista = (listaValue) => {
    const strValue = listaValue.toString();
    setListasSeleccionadas(prev => 
      prev.includes(strValue) 
        ? prev.filter(l => l !== strValue) 
        : [...prev, strValue]
    );
  };

  const handleSeleccionarTodasListas = () => {
    setListasSeleccionadas([]);
  };

  // --- FILTRADO DE TABLA ---
  const datosFiltradosYPagina = useMemo(() => {
    let res = [...datosPrecios];
    const termino = busquedaPrecios.toLowerCase().trim();

    if (fechaFiltroPrecio) {
      res = res.filter(i => i.FechaPrecio && i.FechaPrecio.substring(0, 10) === fechaFiltroPrecio);
    }
    
    if (listasSeleccionadas.length > 0) {
      res = res.filter(i => i.Lista && listasSeleccionadas.includes(i.Lista.toString()));
    }

    if (filtroDepto !== 'TODOS') {
      res = res.filter(i => i.Departamento === filtroDepto);
    }
    if (filtroFamilia !== 'TODOS') {
      res = res.filter(i => i.Familia === filtroFamilia);
    }
    if (filtroSubFamilia !== 'TODOS') {
      res = res.filter(i => i.SubFamilia === filtroSubFamilia);
    }
    if (termino) {
      res = res.filter(i => 
        i.IDArticulo?.toString().includes(termino) || 
        i.Descripcion?.toLowerCase().includes(termino) || 
        i.Scanner?.toString().includes(termino)
      );
    }

    const total = res.length;
    const paginados = res.slice((paginaActual - 1) * filasPorPagina, paginaActual * filasPorPagina);
    
    return { total, paginados, todosFiltrados: res };
  }, [datosPrecios, busquedaPrecios, fechaFiltroPrecio, listasSeleccionadas, filtroDepto, filtroFamilia, filtroSubFamilia, paginaActual]);

  const totalPaginas = Math.ceil(datosFiltradosYPagina.total / filasPorPagina);

  const formatearFecha = (strFecha) => {
    if (!strFecha) return '—';
    return new Date(strFecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const exportarAExcel = () => {
    if (datosFiltradosYPagina.todosFiltrados.length === 0) return;

    const datosAExportar = datosFiltradosYPagina.todosFiltrados.map(item => ({
      'Código Art.': item.IDArticulo || '—',
      'Scanner / PLU': item.Scanner || '—',
      'Descripción': item.Descripcion || '—',
      'Familia': item.Familia || '—',
      'SubFamilia': item.SubFamilia || '—',
      'Departamento': item.Departamento || '—',
      'Lista ID': item.Lista || '—',
      'Precio Venta Total ($)': item.PrecioVentaTotal || 0,
      'Hora Cambio': item.FechaPrecio ? new Date(item.FechaPrecio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '—',
      'Fecha Aplicación': item.FechaPrecio ? item.FechaPrecio.substring(0, 10) : '—'
    }));

    const worksheet = XLSX.utils.json_to_sheet(datosAExportar);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cambios de Precios");

    const fechaNombre = fechaFiltroPrecio || new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Cambios_de_Precios_BlowMax_${fechaNombre}.xlsx`);
  };

  const exportarAPDF = () => {
    window.print();
  };

  if (cargando) return <div className={styles.centerMessage}>Cargando datos multidimensionales Blow Max...</div>;
  if (error) return <div className={styles.centerMessage} style={{color: 'red'}}>Error: {error}</div>;

  return (
    <>
      {/* --- PANEL DE FILTROS --- */}
      <div className={styles.filterPanel} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        
        <div className={styles.filterGroup} style={{ gridColumn: 'span 2' }}>
          <label className={styles.filterLabel}>🔍 Buscar Modificación:</label>
          <input 
            type="text" 
            placeholder="ID Artículo, descripción o scanner..." 
            className={styles.searchInput} 
            value={busquedaPrecios} 
            onChange={(e) => setBusquedaPrecios(e.target.value)} 
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>📅 Fecha Modif:</label>
          <input 
            type="date" 
            className={styles.dateInput} 
            value={fechaFiltroPrecio} 
            onChange={(e) => setFechaFiltroPrecio(e.target.value)} 
            style={{ borderColor: '#C41E3A', backgroundColor: '#fff5f5' }}
          />
        </div>

        {/* 🌟 DESPLEGABLE CON SELECCIÓN MÚLTIPLE DE LISTAS 🌟 */}
        <div className={styles.filterGroup} ref={dropdownRef} style={{ position: 'relative' }}>
          <label className={styles.filterLabel}>📋 Filtrar Listas:</label>
          <button 
            type="button"
            onClick={() => setMostrarDropdownListas(!mostrarDropdownListas)}
            className={styles.selectDropdown}
            style={{ 
              textAlign: 'left', 
              background: '#fff', 
              cursor: 'pointer', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {listasSeleccionadas.length === 0 
                ? 'Todas las Listas' 
                : listasSeleccionadas.length === 1 
                  ? `Lista ${listasSeleccionadas[0]}` 
                  : `${listasSeleccionadas.length} listas selec.`}
            </span>
            <small>▼</small>
          </button>

          {mostrarDropdownListas && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 1000,
              padding: '8px',
              maxHeight: '220px',
              overflowY: 'auto'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontWeight: 'bold' }}>
                <input 
                  type="checkbox" 
                  checked={listasSeleccionadas.length === 0} 
                  onChange={handleSeleccionarTodasListas}
                />
                Todas las Listas
              </label>

              {opcionesFiltros.listas.map((l, idx) => {
                const strL = l.toString();
                const isChecked = listasSeleccionadas.includes(strL);
                return (
                  <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={isChecked} 
                      onChange={() => handleToggleLista(l)}
                    />
                    {strL.includes('Lista') ? strL : `Lista ${strL}`}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>🏬 Departamento:</label>
          <select className={styles.selectDropdown} value={filtroDepto} onChange={(e) => setFiltroDepto(e.target.value)}>
            <option value="TODOS">Todos</option>
            {opcionesFiltros.deptos.map((d, idx) => <option key={idx} value={d}>{d}</option>)}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>🌿 Familia:</label>
          <select className={styles.selectDropdown} value={filtroFamilia} onChange={(e) => setFiltroFamilia(e.target.value)}>
            <option value="TODOS">Todas</option>
            {opcionesFiltros.familias.map((f, idx) => <option key={idx} value={f}>{f}</option>)}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>🌿 SubFamilia:</label>
          <select className={styles.selectDropdown} value={filtroSubFamilia} onChange={(e) => setFiltroSubFamilia(e.target.value)}>
            <option value="TODOS">Todas</option>
            {opcionesFiltros.subFamilias.map((sf, idx) => <option key={idx} value={sf}>{sf}</option>)}
          </select>
        </div>

        {/* BOTONES */}
        <div className={styles.filterGroup} style={{ justifyContent: 'flex-end', flexDirection: 'row', gap: '8px' }}>
          <button 
            onClick={exportarAPDF}
            disabled={datosFiltradosYPagina.total === 0}
            style={{
              backgroundColor: datosFiltradosYPagina.total === 0 ? '#94a3b8' : '#2563eb',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              cursor: datosFiltradosYPagina.total === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              height: '38px',
              transition: 'background-color 0.2s'
            }}
            title="Imprimir Etiquetas dinámicas de Góndola"
          >
              🖨️ Imprimir Etiquetas
          </button>

          <button 
            onClick={exportarAExcel}
            disabled={datosFiltradosYPagina.total === 0}
            style={{
              backgroundColor: datosFiltradosYPagina.total === 0 ? '#94a3b8' : '#16a34a',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              cursor: datosFiltradosYPagina.total === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              height: '38px',
              transition: 'background-color 0.2s'
            }}
          >
              Excel ({datosFiltradosYPagina.total})
          </button>
        </div>

      </div>

      {/* --- TABLA DE AUDITORÍA --- */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th className={styles.th}>Código Art.</th>
              <th className={styles.th}>Scanner</th>
              <th className={styles.th}>Descripción</th>
              <th className={styles.th}>Familia / SubFamilia</th>
              <th className={styles.th}>Departamento</th>
              <th className={styles.th} style={{ textAlign: 'center' }}>Lista ID</th>
              <th className={styles.th} style={{ textAlign: 'right' }}>Precio Venta Total</th>
              <th className={styles.th}>Fecha Aplicación</th>
            </tr>
          </thead>
          <tbody>
            {datosFiltradosYPagina.paginados.map((item, idx) => (
              <tr key={idx} className={styles.tr} onClick={() => onOpenModal({ type: 'PRECIO', data: item })}>
                <td className={styles.td}>{item.IDArticulo}</td>
                <td className={styles.td} style={{ fontFamily: 'monospace' }}>{item.Scanner || '—'}</td>
                <td className={`${styles.td} ${styles.tdBold}`}>{item.Descripcion}</td>
                <td className={styles.td} style={{ fontSize: '0.85rem' }}>
                  {item.Familia} 
                  <span style={{ display: 'block', color: '#64748b', fontSize: '0.75rem' }}>{item.SubFamilia}</span>
                </td>
                <td className={styles.td}>{item.Departamento || '—'}</td>
                <td className={styles.td} style={{ textAlign: 'center', fontWeight: 'bold', color: '#475569' }}>{item.Lista}</td>
                <td className={styles.td} style={{ textAlign: 'right', color: '#16a34a', fontWeight: '700', fontSize: '1rem' }}>
                  ${Number(item.PrecioVentaTotal || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
                <td className={styles.td} style={{ fontSize: '0.85rem', color: '#C41E3A', fontWeight: '500' }}>
                  {new Date(item.FechaPrecio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b' }}>{formatearFecha(item.FechaPrecio)}</span>
                </td>
              </tr>
            ))}
            {datosFiltradosYPagina.total === 0 && (
              <tr>
                <td colSpan="8" className={styles.td} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  ⚠️ No se encontraron modificaciones con los filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- PAGINACIÓN --- */}
      {totalPaginas > 1 && (
        <div className={styles.paginationContainer}>
          <button disabled={paginaActual === 1} onClick={() => setPaginaActual(p => p - 1)} className={styles.pageButton}>◀ Anterior</button>
          <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '600' }}>
            Página {paginaActual} de {totalPaginas} ({datosFiltradosYPagina.total} registros)
          </span>
          <button disabled={paginaActual === totalPaginas} onClick={() => setPaginaActual(p => p + 1)} className={styles.pageButton}>Siguiente ▶</button>
        </div>
      )}

      {/* ===== CONTENEDOR OCULTO DE ETIQUETAS PARA IMPRESIÓN ===== */}
      <div className="seccion-impresion-etiquetas">
        {datosFiltradosYPagina.todosFiltrados.map((item, index) => {
          // 1. En Cambios de Precios, PrecioVentaTotal ES el PRECIO LISTA BASE ($249,00)
          const precioListaBase = Number(item.PrecioVentaTotal) || 0;
          
          const esUnidad = Number(item.IDPresentacion) === 1;
          const tipoEtiquetaCalculado = esUnidad ? 'NORMAL' : 'PACK';

          const idBuscar = String(item.IDArticulo).trim();
          const condicionAsociada = mapaCondiciones.get(idBuscar);

          // Obtener el porcentaje de descuento o el precio final de la condición
          const porcentajeDescuento = Number(condicionAsociada?.PorDescRec) || 0;
          const tieneCondicion = !!condicionAsociada && (porcentajeDescuento > 0 || condicionAsociada.PrecioFinal !== undefined);

          // 2. Calcular Precio con Descuento ($212,00)
          let precioConDescuento = 0;
          if (tieneCondicion) {
            if (condicionAsociada.PrecioFinal !== undefined && condicionAsociada.PrecioFinal !== null) {
              precioConDescuento = Number(condicionAsociada.PrecioFinal);
            } else {
              precioConDescuento = precioListaBase * (1 - (porcentajeDescuento / 100));
            }
          }

          // 3. Precio Sin IVA del Precio Lista Base
          const precioSinIvaCalculado = precioListaBase / 1.21;

          const datosMapeados = {
            descripcion: item.Descripcion || 'SIN DESCRIPCIÓN',
            fecha: item.FechaPrecio ? formatearFecha(item.FechaPrecio) : new Date().toLocaleDateString('es-AR'),
            codigoInterno: item.IDArticulo || '—',
            codigoBarras: item.Scanner || item.IDArticulo || '—',
            scanner: item.Scanner || '—',
            
            // DERECHA: Precio Lista Base ($249,00)
            precioUnitario: precioListaBase.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            
            // DERECHA: Precio Sin IVA ($205,79)
            precioSinImpuesto: precioSinIvaCalculado.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            
            // ETIQUETA PACK
            CantUni: item.CantUni || 1,

            // IZQUIERDA: Precio con Descuento ($212,00)
            precioCantidad: tieneCondicion 
              ? precioConDescuento.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
              : '',
              
            // IZQUIERDA: Compra mínima
            compraMinima: tieneCondicion ? (condicionAsociada.Desde || '') : ''
          };

          return (
            <Etiqueta 
              key={index} 
              tipo={tipoEtiquetaCalculado} 
              datos={datosMapeados} 
            />
          );
        })}
      </div>
    </>
  );
}

export default CambiosPrecios;