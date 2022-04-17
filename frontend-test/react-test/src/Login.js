import React, { useState } from "react";
import "./login.css";
import Button from "@mui/material/Button";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const jsonData = {
    Username: username,
    Password: password,
  };
  let token="sdjkhfslhdfkjsldhf"
  function LoginSubmit() {
    fetch("http://localhost:3333/login"+token, {
      method: "POST", // or 'PUT'
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jsonData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "200OK") {
          localStorage.setItem("token", data.token);
          window.location = "/home";
          console.log("Success:", data);
        } else {
          console.log("Failed", data);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  return (
    <div className="container">
      <div className="form-box">
        <div className="header-form">
          <h4 className="text-primary text-center">
            <i className="bx bxs-user-circle" style={{ fontSize: "120px" }}></i>
          </h4>
          <div className="image"></div>
        </div>
        <div className="body-form">
          <form>
            <div className="user">
              <div className="input-group-prepend">
                <span className="input-group-text">
                  <i className="bx bx-user" style={{ margin: "0px 10px" }}></i>
                </span>
              </div>
              <input
                style={{ fontSize: "20px" }}
                type="text"
                className="form-control"
                placeholder="Username"
                onChange={(e) => {
                  setUsername(e.target.value);
                }}
              />
            </div>
            <div className="password">
              <div className="input-group-prepend">
                {/* <span className="input-group-text"> */}
                <i
                  className="bx bxs-lock-alt"
                  style={{ margin: "0px 10px" }}
                ></i>
                {/* </span> */}
              </div>
              <input
                type="text"
                style={{ fontSize: "20px" }}
                className="form-control"
                placeholder="Password"
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
              />
            </div>
            <div className="bo">
              <Button variant="contained" onClick={LoginSubmit}>
                Login
              </Button>
            </div>
            <div className="message">
              <div>
                <input type="checkbox" /> Remember ME
              </div>
              <div>
                <a href="/#">Forgot your password</a>
              </div>
            </div>
          </form>
          <div className="social">
            <a href="/#">
              <i className="devicon-google-plain"></i>
            </a>
            <a href="/#">
              <i className="devicon-facebook-plain"></i>
            </a>
            <a href="/#">
              <i className="devicon-apple-original"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Login;
