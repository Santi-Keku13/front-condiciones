import React, { useState, useMemo, useEffect } from 'react';
import styles from '../condiciones/Condiciones.module.css';

function CambiosPrecios({ datosPrecios, cargando, error, onOpenModal }) {
  const [busquedaPrecios, setBusquedaPrecios] = useState('');
  // Fecha por defecto: Hoy (YYYY-MM-DD)
  const [fechaFiltroPrecio, setFechaFiltroPrecio] = useState(new Date().toISOString().substring(0, 10));
  
  // --- NUEVOS ESTADOS PARA FILTROS PARTICULARES ---
  const [filtroLista, setFiltroLista] = useState('TODOS');
  const [filtroDepto, setFiltroDepto] = useState('TODOS');
  const [filtroFamilia, setFiltroFamilia] = useState('TODOS');
  const [filtroSubFamilia, setFiltroSubFamilia] = useState('TODOS');

  const [paginaActual, setPaginaActual] = useState(1);
  const filasPorPagina = 50;

  // Resetear a la página 1 si cambia cualquier filtro
  useEffect(() => {
    setPaginaActual(1);
  }, [busquedaPrecios, fechaFiltroPrecio, filtroLista, filtroDepto, filtroFamilia, filtroSubFamilia]);

  // --- RENDIMIENTO: EXTRACCIÓN DE OPCIONES ÚNICAS PARA LOS DROPDOWNS ---
  // Esto analiza los datos que vienen del backend y arma las opciones dinámicamente
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
      listas: Array.from(listas).sort(),
      deptos: Array.from(deptos).sort(),
      familias: Array.from(familias).sort(),
      subFamilias: Array.from(subFamilias).sort()
    };
  }, [datosPrecios]);

  // --- LÓGICA DE FILTRADO EN MEMORIA RAM (INCLUYE NUEVOS FILTROS) ---
  const datosFiltradosYPagina = useMemo(() => {
    let res = [...datosPrecios];
    const termino = busquedaPrecios.toLowerCase().trim();

    // 1. Filtro estricto por fecha seleccionada
    if (fechaFiltroPrecio) {
      res = res.filter(i => i.FechaPrecio && i.FechaPrecio.substring(0, 10) === fechaFiltroPrecio);
    }
    // 2. Filtro por Lista
    if (filtroLista !== 'TODOS') {
      res = res.filter(i => i.Lista?.toString() === filtroLista.toString());
    }
    // 3. Filtro por Departamento
    if (filtroDepto !== 'TODOS') {
      res = res.filter(i => i.Departamento === filtroDepto);
    }
    // 4. Filtro por Familia
    if (filtroFamilia !== 'TODOS') {
      res = res.filter(i => i.Familia === filtroFamilia);
    }
    // 5. Filtro por SubFamilia
    if (filtroSubFamilia !== 'TODOS') {
      res = res.filter(i => i.SubFamilia === filtroSubFamilia);
    }
    // 6. Filtro por término por texto (ID, descripción o scanner)
    if (termino) {
      res = res.filter(i => 
        i.IDArticulo?.toString().includes(termino) || 
        i.Descripcion?.toLowerCase().includes(termino) || 
        i.Scanner?.toString().includes(termino)
      );
    }

    const total = res.length;
    const paginados = res.slice((paginaActual - 1) * filasPorPagina, paginaActual * filasPorPagina);
    
    return { total, paginados };
  }, [datosPrecios, busquedaPrecios, fechaFiltroPrecio, filtroLista, filtroDepto, filtroFamilia, filtroSubFamilia, paginaActual]);

  const totalPaginas = Math.ceil(datosFiltradosYPagina.total / filasPorPagina);

  const formatearFecha = (strFecha) => {
    if (!strFecha) return '—';
    return new Date(strFecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (cargando) return <div className={styles.centerMessage}>Cargando datos multidimensionales Blow Max...</div>;
  if (error) return <div className={styles.centerMessage} style={{color: 'red'}}>Error: {error}</div>;

  return (
    <>
      {/* --- PANEL DE FILTROS EXPANDIDO (GRID ADAPTATIVO BLOW MAX) --- */}
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

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>📋 Filtrar Lista:</label>
          <select className={styles.selectDropdown} value={filtroLista} onChange={(e) => setFiltroLista(e.target.value)}>
            <option value="TODOS">Todas las Listas</option>
            {opcionesFiltros.listas.map((l, idx) => <option key={idx} value={l}>{l.includes('Lista') ? l : `Lista ${l}`}</option>)}
          </select>
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
                  ${item.PrecioVentaTotal?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
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
    </>
  );
}

export default CambiosPrecios;