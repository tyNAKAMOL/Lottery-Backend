import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import "./login.css";

function Home() {
  const [username, setUsername] = useState("");
  useEffect(() => {
    const Token = localStorage.getItem("token");
    const fullToken = "Bearer " + Token;
    fetch("http://localhost:3333/authen", {
      method: "POST", // or 'PUT','GET'
      headers: {
        "Content-Type": "application/json",
        Authorization: fullToken,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "ok") {
          setUsername(data.decoded.username);
          console.log("Success:", data);
        } else {
          localStorage.removeItem("token");
          window.location = "/login";
          console.log("Failed:", data);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }, []);

  return (
    <div>
      <div className="br">
        <h1> Hello {username}!!</h1>
        <Button variant="contained">Logout</Button>
      </div>
    </div>
  );
}
export default Home;
