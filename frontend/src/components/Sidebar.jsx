import { Link } from "react-router-dom";
import { Box, Typography } from "@mui/material";

export default function Sidebar() {
  const user = JSON.parse(localStorage.getItem("user"));
  const items = [];

  if (user?.role === "admin") {
  items.push({ text: "Manage Hostels", path: "/dashboard" });
}

if (user?.role === "resident") {
  items.push({ text: "View Hostels", path: "/dashboard" });
}

if (user?.role === "staff") {
  items.push({ text: "Maintenance", path: "/dashboard" });
}


  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" mb={2}>
        Hostel Management
      </Typography>

      {items.map((item) => (
        <Box key={item.path} mb={1}>
          <Link to={item.path}>{item.text}</Link>
        </Box>
      ))}
    </Box>
  );
}
