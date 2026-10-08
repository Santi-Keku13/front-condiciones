// src/config.js
export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

// Endpoints útiles
export const ENDPOINTS = {
  login: `${API_URL}/api/login`,
  condiciones: `${API_URL}/api/condiciones`,
  cambiosPrecios: `${API_URL}/api/cambios-precios`,
  productosCache: (sucursal = "acceso") =>
    `${API_URL}/api/productos_cache.json?sucursal=${sucursal}`,
  regenerarCache: `${API_URL}/api/regenerar-cache`,
};