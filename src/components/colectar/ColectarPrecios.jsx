import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Etiqueta from "../etiqueta/Etiqueta";
import styles from "./ColectarPrecios.module.css";

const JSON_URL = "https://exterior-breath-assessing-php.trycloudflare.com/api/productos_cache.json";
const CACHE_KEY = "colector_precios_cache_v1";
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const IVA = 1.21;
const CANTIDAD_MAX = 99; // 🆕 límite por producto

// ---------- helpers ----------
const formatoPrecio = (n) =>
  Number(n || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const esPackPorDescripcion = (desc = "") =>
  /(^|\s)PACK(\s|$|\s?X\s?\d+)/i.test(desc);

const extraerCantidadMinima = (texto = "") => {
  const m = texto.match(/LLEVANDO\s+(\d+)/i);
  return m ? m[1] : "";
};

const hoy = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()}`;
};

const mapearAEtiqueta = (item) => {
  const esPack = esPackPorDescripcion(item.articulo);
  const precioFinal = Number(item.precioFinal || item.precioLista5 || 0);
  const precioSinImp = precioFinal / IVA;

  return {
    tipo: esPack ? "PACK" : "NORMAL",
    datos: {
      descripcion: item.articulo,
      fecha: item.vigenciaHasta || hoy(),
      codigoInterno: item.scanner,
      codigoBarras: item.scanner,
      precioUnitario: formatoPrecio(precioFinal),
      precioSinImpuesto: formatoPrecio(precioSinImp),
      precioCantidad:
        item.tieneCondicion && item.precioCondicion > 0
          ? formatoPrecio(item.precioCondicion)
          : "",
      compraMinima: item.tieneCondicion
        ? extraerCantidadMinima(item.condicionTexto)
        : "",
      CantUni: esPack ? extraerCantidadMinima(item.articulo) || 1 : 1,
    },
  };
};

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ============================================================
// COMPONENTE
// ============================================================
const ColectarPrecios = () => {
  const [cache, setCache] = useState(null);
  const [cargandoCache, setCargandoCache] = useState(true);
  const [errorCache, setErrorCache] = useState(null);

  const [codigoInput, setCodigoInput] = useState("");
  const [items, setItems] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [confirmarVaciar, setConfirmarVaciar] = useState(false);

  const inputRef = useRef(null);

  // ---------- Toast ----------
  const pushToast = useCallback((tipo, titulo, mensaje) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, tipo, titulo, mensaje }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  // ---------- Cargar JSON ----------
  const cargarJSON = useCallback(
    async (forzar = false) => {
      setCargandoCache(true);
      setErrorCache(null);

      if (!forzar) {
        try {
          const raw = localStorage.getItem(CACHE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.ts && Date.now() - parsed.ts < CACHE_TTL_MS) {
              setCache(parsed.data);
              setCargandoCache(false);
              pushToast(
                "info",
                "Cache cargado",
                `${parsed.data.total_productos} productos disponibles`
              );
              return;
            }
          }
        } catch {
          /* cache corrupto → ignorar */
        }
      }

      try {
        const res = await fetch(`${JSON_URL}?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();

        if (!data?.items) throw new Error("JSON sin campo 'items'");

        setCache(data);
        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ ts: Date.now(), data })
          );
        } catch {
          /* localStorage lleno → no pasa nada */
        }
        pushToast(
          "success",
          "Precios cargados",
          `${data.total_productos} productos · actualizado ${data.ultima_actualizacion}`
        );
      } catch (e) {
        setErrorCache(e.message || "Error al cargar precios");
        pushToast("error", "Error al cargar precios", e.message);
      } finally {
        setCargandoCache(false);
      }
    },
    [pushToast]
  );

  useEffect(() => {
    cargarJSON(false);
  }, [cargarJSON]);

  useEffect(() => {
    if (!cargandoCache && cache) inputRef.current?.focus();
  }, [cargandoCache, cache]);

  // ---------- Submit del input ----------
  const handleSubmit = (e) => {
    e.preventDefault();
    const codigo = codigoInput.trim();
    if (!codigo) return;

    if (!cache) {
      pushToast("warning", "Precios no cargados", "Esperá a que cargue el JSON");
      return;
    }

    // 🆕 Si ya está en la lista, incrementamos la cantidad
    const existente = items.find(
      (i) => i.scanner === codigo && !i.error
    );
    if (existente) {
      setItems((prev) =>
        prev.map((i) =>
          i.scanner === codigo && !i.error
            ? { ...i, cantidad: Math.min((i.cantidad || 1) + 1, CANTIDAD_MAX) }
            : i
        )
      );
      pushToast(
        "info",
        "Cantidad aumentada",
        `${existente.articulo} → ${(existente.cantidad || 1) + 1} etiquetas`
      );
      setCodigoInput("");
      inputRef.current?.focus();
      return;
    }

    const prod = cache.items[codigo];

    if (!prod) {
      setItems((prev) => [
        ...prev,
        {
          scanner: codigo,
          articulo: "Código no encontrado",
          error: true,
          cantidad: 1,
        },
      ]);
      pushToast("error", "No encontrado", `El código ${codigo} no existe`);
    } else {
      setItems((prev) => [...prev, { ...prod, cantidad: 1 }]); // 🆕 cantidad inicial
      pushToast("success", "Agregado", prod.articulo);
    }

    setCodigoInput("");
    inputRef.current?.focus();
  };

  // ---------- Acciones ----------
  const eliminarItem = (scanner) =>
    setItems((prev) => prev.filter((i) => i.scanner !== scanner));

  // 🆕 Cambiar cantidad de un producto
  const cambiarCantidad = (scanner, delta) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.scanner !== scanner || i.error) return i;
        const nueva = Math.max(1, Math.min((i.cantidad || 1) + delta, CANTIDAD_MAX));
        return { ...i, cantidad: nueva };
      })
    );
  };

  // 🆕 Setear cantidad directamente (por si escriben el número)
  const setearCantidad = (scanner, valor) => {
    const num = parseInt(valor, 10);
    if (isNaN(num)) return;
    const nueva = Math.max(1, Math.min(num, CANTIDAD_MAX));
    setItems((prev) =>
      prev.map((i) =>
        i.scanner === scanner && !i.error ? { ...i, cantidad: nueva } : i
      )
    );
  };

  const limpiarLista = () => {
    if (!items.length) return;
    setConfirmarVaciar(true);
  };

  const confirmarLimpiar = () => {
    setItems([]);
    setConfirmarVaciar(false);
    pushToast("info", "Lista vaciada", "Se eliminaron todos los códigos");
  };

  const imprimir = () => {
    if (!items.filter((i) => !i.error).length) {
      pushToast(
        "warning",
        "Nada para imprimir",
        "Escaneá al menos un código válido"
      );
      return;
    }
    window.print();
  };

  // ---------- Derivados ----------
  const itemsValidos = useMemo(() => items.filter((i) => !i.error), [items]);

  // 🆕 Total de etiquetas = suma de cantidades
  const totalEtiquetas = useMemo(
    () => itemsValidos.reduce((acc, i) => acc + (i.cantidad || 1), 0),
    [itemsValidos]
  );

  // 🆕 Para contar también los errores al vaciar
  const totalItems = useMemo(
    () => items.reduce((acc, i) => acc + (i.error ? 1 : i.cantidad || 1), 0),
    [items]
  );

  // 🆕 Genera las etiquetas repetidas según cantidad
  const etiquetasMapeadas = useMemo(() => {
    const result = [];
    itemsValidos.forEach((item) => {
      const cantidad = item.cantidad || 1;
      const etiqueta = mapearAEtiqueta(item);
      for (let i = 0; i < cantidad; i++) {
        result.push(etiqueta);
      }
    });
    return result;
  }, [itemsValidos]);

  // ============================================================
  // RENDER
  // ============================================================
  if (cargandoCache && !cache) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Colector de Precios</h1>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Cargando lista de precios...</p>
        </div>
      </div>
    );
  }

  if (errorCache && !cache) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Colector de Precios</h1>
        <div className={styles.errorState}>
          <p>❌ No se pudieron cargar los precios</p>
          <span>{errorCache}</span>
          <button className={styles.btnPrimary} onClick={() => cargarJSON(true)}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* ---------- HEADER ---------- */}
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Colector de Precios</h1>
        {cache && (
          <div className={styles.cacheBadge}>
            <span className={styles.cacheDot} />
            <div className={styles.cacheInfo}>
              <span className={styles.cacheLabel}>Última actualización</span>
              <span className={styles.cacheValue}>
                {cache.ultima_actualizacion}
              </span>
            </div>
            <span className={styles.cacheDivider} />
            <div className={styles.cacheInfo}>
              <span className={styles.cacheLabel}>Productos</span>
              <span className={styles.cacheValue}>
                {cache.total_productos.toLocaleString("es-AR")}
              </span>
            </div>
            <button
              className={styles.btnRefresh}
              onClick={() => cargarJSON(true)}
              disabled={cargandoCache}
              title="Recargar precios"
            >
              {cargandoCache ? "..." : "↻"}
            </button>
          </div>
        )}
      </div>

      {/* ---------- INPUT DE ESCANEO ---------- */}
      <form onSubmit={handleSubmit} className={styles.scanPanel}>
        <div className={styles.scanGroup}>
          <label className={styles.scanLabel} htmlFor="scanner-input">
            Escaneá o escribí el código de barras
          </label>
          <input
            id="scanner-input"
            ref={inputRef}
            type="text"
            value={codigoInput}
            onChange={(e) => setCodigoInput(e.target.value)}
            placeholder="Esperando lectura del scanner..."
            className={styles.scanInput}
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          className={styles.btnPrimary}
          disabled={!codigoInput.trim()}
        >
          Agregar
        </button>
      </form>

      {/* ---------- CABECERA DE LISTA ---------- */}
      <div className={styles.listHeader}>
        <h2 className={styles.listTitle}>
          Lista de etiquetas{" "}
          <span className={styles.counter}>{totalEtiquetas}</span>
        </h2>
        <div className={styles.listActions}>
          <button
            onClick={limpiarLista}
            className={styles.btnGhost}
            disabled={!items.length}
          >
            Vaciar
          </button>
          <button
            onClick={imprimir}
            className={styles.btnPrimary}
            disabled={!totalEtiquetas}
          >
            🖨️ Imprimir etiquetas
          </button>
        </div>
      </div>

      {/* ---------- LISTA ---------- */}
      {items.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Aún no escaneaste ningún código.</p>
          <span>Los productos aparecerán acá a medida que los escanees.</span>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>Código</th>
                <th className={styles.th}>Artículo</th>
                <th className={styles.th}>Precio final</th>
                <th className={styles.th}>Condición</th>
                <th className={styles.th}>Tipo</th>
                <th className={`${styles.th} ${styles.thCenter}`}>Cantidad</th>
                <th className={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.scanner}
                  className={`${styles.tr} ${item.error ? styles.trError : ""}`}
                >
                  <td className={`${styles.td} ${styles.tdBold}`}>
                    {item.scanner}
                  </td>
                  <td className={styles.td}>
                    {item.error ? (
                      <span className={styles.errorText}>
                        ❌ Código no encontrado
                      </span>
                    ) : (
                      item.articulo
                    )}
                  </td>
                  <td className={styles.td}>
                    {!item.error && (
                      <span className={styles.precioFinal}>
                        ${formatoPrecio(item.precioFinal)}
                      </span>
                    )}
                  </td>
                  <td className={styles.td}>
                    {!item.error && item.tieneCondicion && (
                      <span className={styles.badgeCondicion}>
                        {item.condicionTexto}
                      </span>
                    )}
                  </td>
                  <td className={styles.td}>
                    {!item.error && (
                      <span
                        className={
                          esPackPorDescripcion(item.articulo)
                            ? styles.badgePack
                            : styles.badgeNormal
                        }
                      >
                        {esPackPorDescripcion(item.articulo) ? "PACK" : "NORMAL"}
                      </span>
                    )}
                  </td>

                  {/* 🆕 CONTROLES DE CANTIDAD */}
                  <td className={styles.td}>
                    {!item.error && (
                      <div className={styles.cantidadControl}>
                        <button
                          type="button"
                          className={styles.cantidadBtn}
                          onClick={() => cambiarCantidad(item.scanner, -1)}
                          disabled={(item.cantidad || 1) <= 1}
                          title="Restar 1"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          className={styles.cantidadInput}
                          value={item.cantidad || 1}
                          onChange={(e) =>
                            setearCantidad(item.scanner, e.target.value)
                          }
                          min="1"
                          max={CANTIDAD_MAX}
                        />
                        <button
                          type="button"
                          className={styles.cantidadBtn}
                          onClick={() => cambiarCantidad(item.scanner, 1)}
                          disabled={(item.cantidad || 1) >= CANTIDAD_MAX}
                          title="Sumar 1"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </td>

                  <td className={styles.td}>
                    <button
                      className={styles.btnDelete}
                      onClick={() => eliminarItem(item.scanner)}
                      title="Eliminar"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ---------- SECCIÓN DE IMPRESIÓN ---------- */}
      <div className="seccion-impresion-etiquetas">
        {etiquetasMapeadas.map((e, i) => (
          <Etiqueta key={i} tipo={e.tipo} datos={e.datos} />
        ))}
      </div>

      {/* ---------- TOASTS ---------- */}
      <div className={styles.toastContainer}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${styles.toast} ${styles["toast" + capitalize(t.tipo)]}`}
          >
            <div className={styles.toastContent}>
              <span className={styles.toastTitle}>{t.titulo}</span>
              <span className={styles.toastMessage}>{t.mensaje}</span>
            </div>
            <button
              className={styles.toastClose}
              onClick={() => removeToast(t.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* ---------- MODAL CONFIRMAR VACIAR ---------- */}
      {confirmarVaciar && (
        <div
          className={styles.modalOverlay}
          onClick={() => setConfirmarVaciar(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>Confirmar acción</h2>
              <button
                className={styles.closeButton}
                onClick={() => setConfirmarVaciar(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalBlockFull}>
                <div className={styles.modalBlockLabel}>Vaciar lista</div>
                <div className={styles.modalBlockValue}>
                  ¿Estás seguro que querés eliminar los{" "}
                  <strong style={{ color: "#C41E3A" }}>{totalItems}</strong>{" "}
                  {totalItems === 1 ? "código cargado" : "códigos cargados"}?
                  Esta acción no se puede deshacer.
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.btnGhost}
                onClick={() => setConfirmarVaciar(false)}
              >
                Cancelar
              </button>
              <button className={styles.btnDanger} onClick={confirmarLimpiar}>
                Sí, vaciar lista
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColectarPrecios;