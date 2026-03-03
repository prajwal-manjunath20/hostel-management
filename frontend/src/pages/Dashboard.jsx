import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div style={{ padding: 30 }}>
      <h2>Welcome, {user?.role.toUpperCase()}</h2>

      {user?.role === "admin" && <p>You can manage hostels and rooms.</p>}
      {user?.role === "resident" && <p>You can view and book rooms.</p>}
      {user?.role === "staff" && <p>You can manage maintenance tasks.</p>}
    </div>
  );
}
