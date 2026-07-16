import React, { useState, useEffect, useMemo } from 'react';
import styles from './Condiciones.module.css';
import CambiosPrecios from '../cambiosPrecios/CambiosPrecios'; 

function Condiciones() {
  const [pestanaActiva, setPestanaActiva] = useState('CONDICIONES');

  // Estados Datos
  const [datosCondiciones, setDatosCondiciones] = useState([]);
  const [datosPrecios, setDatosPrecios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Filtros Pestaña 1
  const [busquedaInput, setBusquedaInput] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [sucursal, setSucursal] = useState('ALAMEDA');
  const [filtroLista, setFiltroLista] = useState('TODAS'); // <--- NUEVO ESTADO PARA EL FILTRO DE LISTAS
  const [tipoFiltroFecha, setTipoFiltroFecha] = useState('FechaModif');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Paginación Pestaña 1
  const [paginaActual, setPaginaActual] = useState(1);
  const filasPorPagina = 50;

  // Estado Modal compartido
  const [modalData, setModalData] = useState(null);

  // Carga inicial paralela
  useEffect(() => {
    setCargando(true);
    Promise.all([
      fetch("https://criteria-maximize-stores-slightly.trycloudflare.com/api/condiciones").then(res => res.json()),
      fetch("https://criteria-maximize-stores-slightly.trycloudflare.com/api/cambios-precios").then(res => res.json()).catch(() => [])
    ])
    .then(([dataCondiciones, dataPrecios]) => {
      setDatosCondiciones(dataCondiciones);
      setDatosPrecios(dataPrecios);
      setCargando(false);
    })
    .catch((err) => {
      setError(err.message);
      setCargando(false);
    });
  }, []);

  // Reiniciar paginación al cambiar cualquier filtro
  useEffect(() => {
    setPaginaActual(1);
  }, [busquedaInput, filtroEstado, filtroLista, fechaDesde, fechaHasta, tipoFiltroFecha, sucursal, pestanaActiva]); // <--- AGREGADO filtroLista AQUÍ

  // Lógica Semáforo Pestaña 1
  const obtenerEstadoVigencia = (fechaLimite) => {
    if (!fechaLimite) return { id: 'SIN_LIMITE', texto: 'Sin Límite', clase: styles.statusSinLimite };
    const hoy = new Date();
    const fechaVence = new Date(fechaLimite);
    const diferenciaDias = Math.ceil((fechaVence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    if (diferenciaDias < 0) return { id: 'VENCIDO', texto: '🔴 Vencido', clase: styles.statusVencido };
    if (diferenciaDias <= 30) return { id: 'POR_VENCER', texto: `🟡 Por Vencer (${diferenciaDias}d)`, clase: styles.statusPorVencer };
    return { id: 'AL_DIA', texto: '🟢 Al Día', clase: styles.statusVigente };
  };

  // Lógica Precios Cascadas Pestaña 1
  const calcularPrecioSucursal = (item, suc) => {
    let precioBase = 0;
    let listaUtilizada = 'Lista 5';
    if (suc === 'ALAMEDA') {
      if (item.PrecioL12 > 0) { precioBase = item.PrecioL12; listaUtilizada = 'Lista 12'; } 
      else { precioBase = item.PrecioL5; listaUtilizada = 'Lista 5'; }
    } else if (suc === 'ACCESO') {
      if (item.PrecioL14 > 0) { precioBase = item.PrecioL14; listaUtilizada = 'Lista 14'; } 
      else if (item.PrecioL12 > 0) { precioBase = item.PrecioL12; listaUtilizada = 'Lista 12'; } 
      else { precioBase = item.PrecioL5; listaUtilizada = 'Lista 5'; }
    } else if (suc === 'BASTILLA') {
      if (item.PrecioL7 > 0) { precioBase = item.PrecioL7; listaUtilizada = 'Lista 7'; } 
      else if (item.PrecioL12 > 0) { precioBase = item.PrecioL12; listaUtilizada = 'Lista 12'; } 
      else { precioBase = item.PrecioL5; listaUtilizada = 'Lista 5'; }
    } else if (suc === 'ALBERDI') {
      if (item.PrecioL15 > 0) { precioBase = item.PrecioL15; listaUtilizada = 'Lista 15'; } 
      else if (item.PrecioL12 > 0) { precioBase = item.PrecioL12; listaUtilizada = 'Lista 12'; } 
      else { precioBase = item.PrecioL5; listaUtilizada = 'Lista 5'; }
    }
    return {
      base: precioBase,
      final: Math.round((precioBase * (1 - (item.PorDescRec / 100.0))) * 100) / 100,
      lista: listaUtilizada
    };
  };

  // Filtrado en RAM Pestaña 1
  const condicionesFiltradas = useMemo(() => {
    let res = [...datosCondiciones];
    const termino = busquedaInput.toLowerCase().trim();

    // 1. Filtro por término de búsqueda
    if (termino) {
      res = res.filter(i => 
        i.IDCondicionComercial?.toString().includes(termino) || 
        i.IDArticuloReal?.toString().includes(termino) ||
        i.Descripcion?.toLowerCase().includes(termino) || 
        i.DescripcionCondicion?.toLowerCase().includes(termino) ||
        i.ScannerReal?.toString().includes(termino)
      );
    }

    // 2. Filtro por Estado de Vigencia
    if (filtroEstado !== 'TODOS') {
      res = res.filter(i => obtenerEstadoVigencia(i.VigenciaHasta).id === filtroEstado);
    }

    // 3. 🌟 NUEVO FILTRO: Filtrado por la Lista recalculada según Sucursal
    if (filtroLista !== 'TODAS') {
      res = res.filter(i => {
        const calc = calcularPrecioSucursal(i, sucursal);
        return calc.lista === filtroLista;
      });
    }

    // 4. Filtros por rango de fechas
    if (fechaDesde) res = res.filter(i => i[tipoFiltroFecha] && i[tipoFiltroFecha].substring(0, 10) >= fechaDesde);
    if (fechaHasta) res = res.filter(i => i[tipoFiltroFecha] && i[tipoFiltroFecha].substring(0, 10) <= fechaHasta);
    
    res.sort((a, b) => new Date(b.FechaModif) - new Date(a.FechaModif));
    
    return {
      total: res.length,
      paginados: res.slice((paginaActual - 1) * filasPorPagina, paginaActual * filasPorPagina)
    };
  }, [datosCondiciones, busquedaInput, filtroEstado, filtroLista, fechaDesde, fechaHasta, tipoFiltroFecha, paginaActual, sucursal]); // <--- AGREGADOS filtroLista Y sucursal AL DEPENDENCY ARRAY

  const totalPaginasP1 = Math.ceil(condicionesFiltradas.total / filasPorPagina);

  return (
    <div className={styles.container}>
      
      {/* --- SELECTOR DE PESTAÑAS --- */}
      <div className={styles.tabsContainer}>
        <button 
          onClick={() => setPestanaActiva('CONDICIONES')}
          className={`${styles.tabLink} ${pestanaActiva === 'CONDICIONES' ? styles.tabLinkActive : ''}`}
        >
          Panel Supervisor de Condiciones Comerciales
        </button>
        <button 
          onClick={() => setPestanaActiva('CAMBIOS_DIA')}
          className={`${styles.tabLink} ${pestanaActiva === 'CAMBIOS_DIA' ? styles.tabLinkActive : ''}`}
        >
          Cambios de Precios del Día
        </button>
      </div>

      {/* --- CONTENIDO DE PESTAÑA 1 --- */}
      {pestanaActiva === 'CONDICIONES' && (
        <>
          <div className={styles.filterPanel}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>🏢 Sucursal:</label>
              <select className={styles.selectDropdown} value={sucursal} onChange={(e) => setSucursal(e.target.value)}>
                <option value="ALAMEDA"> Alameda (L12 ➔ L5)</option>
                <option value="ALBERDI"> Alberdi (L15 ➔ L12 ➔ L5)</option>
                <option value="ACCESO"> Acceso (L14 ➔ L12 ➔ L5)</option>
                <option value="BASTILLA"> Bastilla (L7 ➔ L12 ➔ L5)</option>
              </select>
            </div>

            {/* 🌟 NUEVO SELECTOR PARA FILTRAR POR LISTA */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>📋 Lista de Precios:</label>
              <select className={styles.selectDropdown} value={filtroLista} onChange={(e) => setFiltroLista(e.target.value)}>
                <option value="TODAS">Todas las Listas</option>
                <option value="Lista 5">Lista 5</option>
                <option value="Lista 7">Lista 7</option>
                <option value="Lista 12">Lista 12</option>
                <option value="Lista 14">Lista 14</option>
                <option value="Lista 15">Lista 15</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>🔍 Buscar Artículo:</label>
              <input type="text" placeholder="ID Condición, ID Artículo, nombre o scanner..." className={styles.searchInput} value={busquedaInput} onChange={(e) => setBusquedaInput(e.target.value)} />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>🚦 Filtra por Estados:</label>
              <select className={styles.selectDropdown} value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                <option value="TODOS">Todos los Estados</option>
                <option value="AL_DIA">🟢 Al Día</option>
                <option value="POR_VENCER">🟡 Por Vencer (≤30d)</option>
                <option value="VENCIDO">🔴 Vencidos</option>
                <option value="SIN_LIMITE">⚪ Sin Límite</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Fechas por:</label>
              <select className={styles.selectDropdown} value={tipoFiltroFecha} onChange={(e) => setTipoFiltroFecha(e.target.value)}>
                <option value="FechaModif">Modificación</option>
                <option value="VigenciaHasta">Vencimiento</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Desde:</label>
              <input type="date" className={styles.dateInput} value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Hasta:</label>
              <input type="date" className={styles.dateInput} value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
            </div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th className={styles.th}>Código</th>
                  <th className={styles.th}>Scanner (PLU)</th>
                  <th className={styles.th}>Descripción</th>
                  <th className={styles.th} style={{textAlign: 'center'}}>Mínimo</th>
                  <th className={styles.th}>Desc.</th>
                  <th className={styles.th}>Precio Base</th>
                  <th className={styles.th}>Precio Final</th>
                  <th className={styles.th}>Modificado</th>
                  <th className={styles.th}>Vence Hasta</th>
                  <th className={styles.th}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {condicionesFiltradas.paginados.map((item, idx) => {
                  const estado = obtenerEstadoVigencia(item.VigenciaHasta);
                  const calc = calcularPrecioSucursal(item, sucursal);
                  return (
                    <tr key={idx} className={styles.tr} onClick={() => setModalData({ type: 'CONDICION', data: item, calc })}>
                      <td className={styles.td}>{item.IDCondicionComercial}</td>
                      <td className={styles.td} style={{fontFamily: 'monospace'}}>{item.ScannerReal || '—'}</td>
                      <td className={`${styles.td} ${styles.tdBold}`}>{item.Descripcion || item.DescripcionCondicion}</td>
                      <td className={styles.td} style={{textAlign: 'center'}}>{item.Desde} un.</td>
                      <td className={styles.td} style={{color: '#d97706', fontWeight: 'bold'}}>{item.PorDescRec}%</td>
                      <td className={styles.td} style={{fontSize: '0.85rem'}}>
                        ${calc.base.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                        <span style={{display: 'block', fontSize: '0.7rem', color: '#C41E3A', fontWeight: 'bold'}}>{calc.lista}</span>
                      </td>
                      <td className={styles.td} style={{color: '#C41E3A', fontWeight: '700'}}>${calc.final.toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
                      <td className={styles.td}>{item.FechaModif && new Date(item.FechaModif).toLocaleDateString('es-AR')}</td>
                      <td className={styles.td}>{item.VigenciaHasta && new Date(item.VigenciaHasta).toLocaleDateString('es-AR')}</td>
                      <td className={styles.td}><span className={estado.clase}>{estado.texto}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPaginasP1 > 1 && (
            <div className={styles.paginationContainer}>
              <button disabled={paginaActual === 1} onClick={() => setPaginaActual(p => p - 1)} className={styles.pageButton}>◀ Anterior</button>
              <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '600' }}>
                Página {paginaActual} de {totalPaginasP1} ({condicionesFiltradas.total} registros)
              </span>
              <button disabled={paginaActual === totalPaginasP1} onClick={() => setPaginaActual(p => p + 1)} className={styles.pageButton}>Siguiente ▶</button>
            </div>
          )}
        </>
      )}

      {/* --- CONTENIDO DE PESTAÑA 2 --- */}
      {pestanaActiva === 'CAMBIOS_DIA' && (
        <CambiosPrecios 
          datosPrecios={datosPrecios} 
          cargando={cargando} 
          error={error} 
          onOpenModal={setModalData} 
        />
      )}

      {/* --- MODAL COMPARTIDO Y DINÁMICO --- */}
      {modalData && (
        <div className={styles.modalOverlay} onClick={() => setModalData(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{modalData.type === 'CONDICION' ? `Ficha Condición - ${sucursal}` : 'Auditoría de Cambio de Precios'}</h2>
              <button className={styles.closeButton} onClick={() => setModalData(null)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalBlockFull}>
                <div className={styles.modalBlockLabel}>Artículo Comercial</div>
                <div className={styles.modalBlockValue}>
                  {modalData.data.Descripcion || modalData.data.DescripcionCondicion} 
                  <span className={styles.badgePlu}>
                    ID Art: {modalData.data.IDArticuloReal || '—'} | Ref PLU: {modalData.data.ScannerReal || modalData.data.PLU || '—'}
                  </span>
                </div>
              </div>
              
              {modalData.type === 'CONDICION' ? (
                <div className={styles.modalGrid}>
                  <div className={styles.modalBlock}><div className={styles.modalBlockLabel}>Lista Base</div><div className={styles.modalBlockValue}>{modalData.calc.lista}</div></div>
                  <div className={styles.modalBlock}><div className={styles.modalBlockLabel}>Precio Lista</div><div className={styles.modalBlockValue}>${modalData.calc.base}</div></div>
                  <div className={styles.modalBlock}><div className={styles.modalBlockLabel}>Descuento</div><div className={styles.modalBlockValue} style={{color: '#dc2626'}}>{modalData.data.PorDescRec}%</div></div>
                  <div className={styles.modalBlock}><div className={styles.modalBlockLabel}>Precio Final</div><div className={styles.modalPrecioDestacado}>${modalData.calc.final}</div></div>
                </div>
              ) : (
                <div className={styles.modalGrid}>
                  <div className={styles.modalBlock}><div className={styles.modalBlockLabel}>Familia / Depto</div><div className={styles.modalBlockValue} style={{fontSize:'0.85rem'}}>{modalData.data.Familia} / {modalData.data.Departamento}</div></div>
                  <div className={styles.modalBlock}><div className={styles.modalBlockLabel}>N° Lista SQL</div><div className={styles.modalBlockValue}>Lista {modalData.data.Lista}</div></div>
                  <div className={styles.modalBlock}><div className={styles.modalBlockLabel}>Hora del Cambio</div><div className={styles.modalBlockValue}>{new Date(modalData.data.FechaPrecio).toLocaleTimeString('es-AR')} hs</div></div>
                  <div className={styles.modalBlock}><div className={styles.modalBlockLabel}>Precio Venta Final</div><div className={styles.modalPrecioDestacado} style={{color: '#16a34a'}}>${modalData.data.PrecioVentaTotal}</div></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Condiciones;