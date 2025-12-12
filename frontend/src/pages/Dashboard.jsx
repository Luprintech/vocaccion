import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

// Simulación: aquí deberías obtener el rol del usuario desde el backend tras login
// Por ahora, lo simulamos con localStorage o una variable
const getUserRol = () => {
  // Ejemplo: return localStorage.getItem("rol") || "estudiante";
  // En producción, obtén el rol desde el backend
  return localStorage.getItem("rol") || "estudiante";
};

const Dashboard = () => {
  const [rol, setRol] = useState("estudiante");

  useEffect(() => {
    setRol(getUserRol());
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar rol={rol} />
      <main style={{ flex: 1, padding: "2rem" }}>
        <h1>Bienvenido al Dashboard</h1>
        <p>Tu rol actual es: <b>{rol}</b></p>
        {/* Aquí puedes renderizar el contenido según el rol */}
      </main>
    </div>
  );
};

export default Dashboard;
