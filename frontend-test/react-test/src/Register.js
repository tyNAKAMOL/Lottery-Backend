import React, { useState } from "react";
import "./login.css";
import Button from "@mui/material/Button";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [draw, setDraw] = useState("0");
  const onChange1 = (e) => {
    setDraw(e.target.value + "|");
  };

  // const jsonData = {
  //   Username: username,
  //   Email: email,
  //   Password: password,
  //   FirstName: firstname,
  //   LastName: lastname,
  // };
  // function RSubmit() {
  //   fetch("http://localhost:3333/register", {
  //     method: "POST", // or 'PUT'
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify(jsonData),
  //   })
  //     .then((response) => response.json())
  //     .then((data) => {
  //       if (data.status === "ok") {
  //         //   localStorage.setItem("token", data.token);
  //         window.location = "/login";
  //         console.log("Success:", data);
  //       }
  //     })
  //     .catch((error) => {
  //       console.error("Error:", error);
  //     });
  // }

  return (
    <div className="container">
      <div className="form-box-r">
        <div className="header-form">
          <h4 className="text-primary text-center">
            <i className="bx bxs-user-circle" style={{ fontSize: "120px" }}></i>
          </h4>
          <div className="image"></div>
        </div>
        <div className="body-form">
          <form>
            <div className="password">
              <div className="input-group-prepend"></div>
              <h1>{draw}</h1>
              <input
                type="text"
                style={{ fontSize: "20px" }}
                className="form-control"
                placeholder="Firstname"
                // onChange={(e) => {
                //   onChange1(e.target.value);
                // }}
              />
            </div>
            <div className="password">
              <div className="input-group-prepend"></div>
              <input
                type="text"
                style={{ fontSize: "20px" }}
                className="form-control"
                placeholder="Lastname"
                // onChange={(e) => {
                //   onChange1(e.target.value);
                // }}
              />
            </div>
            <div className="user">
              <div className="input-group-prepend"></div>
              <input
                style={{ fontSize: "20px" }}
                type="text"
                className="form-control"
                placeholder="Username"
                // onChange={(e) => {
                //   onChange1(e.target.value);
                // }}
              />
            </div>
            <div className="password">
              <div className="input-group-prepend">
                {/* <span className="input-group-text"> */}

                {/* </span> */}
              </div>
              <input
                type="text"
                style={{ fontSize: "20px" }}
                className="form-control"
                placeholder="Password"
                // onChange={(e) => {
                //   onChange1(e.target.value);
                // }}
              />
            </div>

            <div className="password">
              <div className="input-group-prepend"></div>
              <input
                type="text"
                style={{ fontSize: "20px" }}
                className="form-control"
                placeholder="Email"
                onChange={onChange1}
              />
            </div>

            <div className="bo">
              <Button
                variant="contained"
                onClick={() => {
                  console.log(draw);
                }}
              >
                Register
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
export default Register;
