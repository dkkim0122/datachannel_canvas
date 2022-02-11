import React, { useEffect, useRef, useState } from "react";
// import io from "socket.io-client";
import "./Canvas.css";

const Canvas = ({ recievedCanvasData, CanvasToRoom }) => {
  const { current: canvasDetails } = useRef({ color: "green"});

  const changeColor = (newColor) => {
    canvasDetails.color = newColor;
  };

  useEffect(() => {
    // console.log("client env", process.env.NODE_ENV);
    // if (process.env.NODE_ENV === "development") {
    //   canvasDetails.socketUrl = "http://143.248.196.85:4000";
    // }
    // console.log("socketUrl", canvasDetails.socketUrl);
    // canvasDetails.socket = io.connect(canvasDetails.socketUrl, () => {
    //   console.log("connecting to server");
    // });
    // canvasDetails.socket.on('image-data', (data) => {
    //     const image = new Image()
    //     const canvas = document.getElementById('canvas');
    //     const context = canvas.getContext('2d');
    //     image.src = data;
    //     image.addEventListener('load', () => {
    //         context.drawImage(image, 0, 0);
    //     });
    // })

    // LOAD CANVAS DATA
    const image = new Image();
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    image.src = recievedCanvasData;
    console.log(recievedCanvasData, "recieve!");
    
    image.addEventListener("load", () => {
      context.drawImage(image, 0, 0);
    });
  });

  

  useEffect(() => {
    const mouseMoveHandler = (e, type) => {
      const event = type === "touch" ? e.touches[0] : e;
      findxy("move", event);
    };
    const mouseDownHandler = (e, type) => {
      const event = type === "touch" ? e.touches[0] : e;
      findxy("down", event);
    };
    const mouseUpHandler = (e, type) => {
      const event = type === "touch" ? e.touches[0] : e;
      findxy("up", event);
    };

    let prevX = 0,
      currX = 0,
      prevY = 0,
      currY = 0,
      flag = false;

    const canvas = document.getElementById("canvas");
    canvas.height = window.innerHeight - 30;
    canvas.width = window.innerWidth;
    const context = canvas.getContext("2d");

    const onSave = () => {
      if (!canvasDetails.waiting) {
        const base64EncodedUrl = canvas.toDataURL("image/png");
        // canvasDetails.socket.emit("image-data", base64EncodedUrl);
        CanvasToRoom(base64EncodedUrl);
        canvasDetails.waiting = true;
        setTimeout(() => {
          canvasDetails.waiting = false;
        }, 100);
      }
    };

    const draw = (e) => {
      // START- DRAW
      context.beginPath();
      context.moveTo(prevX, prevY);
      context.lineTo(currX, currY);
      context.strokeStyle = canvasDetails.color;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = 2;
      context.stroke();
      context.closePath();
      // END- DRAW

      onSave();
    };

    const findxy = (res, e) => {
      if (res === "down") {
        prevX = currX;
        prevY = currY;
        currX = e.clientX - canvas.offsetLeft;
        currY = e.clientY - canvas.offsetTop;
        flag = true;
      }
      if (res === "up" || res === "out") {
        flag = false;
      }
      if (res === "move") {
        if (flag) {
          prevX = currX;
          prevY = currY;
          currX = e.clientX - canvas.offsetLeft;
          currY = e.clientY - canvas.offsetTop;
          draw(e);
        }
      }
    };

    canvas.addEventListener("mousemove", mouseMoveHandler);
    canvas.addEventListener("mousedown", mouseDownHandler);
    canvas.addEventListener("mouseup", mouseUpHandler);
    canvas.addEventListener("touchmove", (e) => mouseMoveHandler(e, "touch"), {
      passive: true,
    });
    canvas.addEventListener("touchstart", (e) => mouseDownHandler(e, "touch"), {
      passive: true,
    });
    canvas.addEventListener("touchend", (e) => mouseUpHandler(e, "touch"));
    canvas.addEventListener("dblclick", onSave);

    return () => {
      canvas.removeEventListener("mousemove", mouseMoveHandler);
      canvas.removeEventListener("mousedown", mouseDownHandler);
      canvas.removeEventListener("mouseup", mouseUpHandler);
      canvas.removeEventListener("dblclick", onSave);
    };
  }, []);

  return (
    <div className="canvas-wrapper">
      <div className="color-picker-wrapper">
        <input
          className="color-picker"
          type="color"
          defaultValue="#00FF00"
          onChange={(e) => changeColor(e.target.value)}
        />
      </div>
      <canvas className="canvas" id="canvas"></canvas>
    </div>
  );
};

export default Canvas;
