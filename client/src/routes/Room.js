import React, { useRef, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import styled from "styled-components";
import Canvas from "../components/Canvas/Canvas";
import CodeEditor from "../components/CodeEditor/CodeEditor";
import './Room.css'



const Room = (props) => {
  const peerRef = useRef();
  const socketRef = useRef();
  const otherUser = useRef();
  const sendChannel = useRef();
  const canvasChannel = useRef();
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [recievedCanvasData, setrecievedCanvasData] = useState();
  const { userRoomID } = useParams();

  useEffect(() => {
    socketRef.current = io.connect("http://localhost:8000");
    socketRef.current.emit("join room", userRoomID);

    socketRef.current.on("other user", (userID) => {
      callUser(userID);
      otherUser.current = userID;
    });

    socketRef.current.on("user joined", (userID) => {
      otherUser.current = userID;
    });

    socketRef.current.on("offer", handleOffer);

    socketRef.current.on("answer", handleAnswer);

    socketRef.current.on("ice-candidate", handleNewICECandidateMsg);
  }, []);

  function callUser(userID) {
    peerRef.current = createPeer(userID);
    // canvas
    canvasChannel.current = peerRef.current.createDataChannel("canvasChannel");
    canvasChannel.current.onmessage = handleReceiveCanvas;

    sendChannel.current = peerRef.current.createDataChannel("sendChannel");
    sendChannel.current.onmessage = handleReceiveMessage;
  }

  // canvas
  function handleReceiveCanvas(e) {
    // console.log(e.data, "handlerecieve");
    setrecievedCanvasData(e.data); // recievedCanvasData = e.data
  }

  function handleReceiveMessage(e) {
    setMessages((messages) => [...messages, { yours: false, value: e.data }]);
  }

  function createPeer(userID) {
    const peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.stunprotocol.org",
        },
        {
          urls: "turn:numb.viagenie.ca",
          credential: "muazkh",
          username: "webrtc@live.com",
        },
      ],
    });

    peer.onicecandidate = handleICECandidateEvent;
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(userID);

    return peer;
  }

  function handleNegotiationNeededEvent(userID) {
    peerRef.current
      .createOffer()
      .then((offer) => {
        return peerRef.current.setLocalDescription(offer);
      })
      .then(() => {
        const payload = {
          target: userID,
          caller: socketRef.current.id,
          sdp: peerRef.current.localDescription,
        };
        socketRef.current.emit("offer", payload);
      })
      .catch((e) => console.log(e));
  }

  function handleOffer(incoming) {
    peerRef.current = createPeer();
    peerRef.current.ondatachannel = (event) => {
      if (event.channel.label === "sendChannel") {
        sendChannel.current = event.channel;
        sendChannel.current.onmessage = handleReceiveMessage;
      } else if (event.channel.label === "canvasChannel") {
        canvasChannel.current = event.channel;
        canvasChannel.current.onmessage = handleReceiveCanvas;
      }
    };
    const desc = new RTCSessionDescription(incoming.sdp);
    peerRef.current
      .setRemoteDescription(desc)
      .then(() => {})
      .then(() => {
        return peerRef.current.createAnswer();
      })
      .then((answer) => {
        return peerRef.current.setLocalDescription(answer);
      })
      .then(() => {
        const payload = {
          target: incoming.caller,
          caller: socketRef.current.id,
          sdp: peerRef.current.localDescription,
        };
        socketRef.current.emit("answer", payload);
      });
  }

  function handleAnswer(message) {
    const desc = new RTCSessionDescription(message.sdp);
    peerRef.current.setRemoteDescription(desc).catch((e) => console.log(e));
  }

  function handleICECandidateEvent(e) {
    if (e.candidate) {
      const payload = {
        target: otherUser.current,
        candidate: e.candidate,
      };
      socketRef.current.emit("ice-candidate", payload);
    }
  }

  function handleNewICECandidateMsg(incoming) {
    const candidate = new RTCIceCandidate(incoming);

    peerRef.current.addIceCandidate(candidate).catch((e) => console.log(e));
  }

  function handleChange(e) {
    setText(e.target.value);
  }

  // Canvas
  function sendCanvas(canvasData) {
    canvasChannel.current.send(canvasData);
    // console.log(canvasData);
    setMessages(canvasData);
  }

  // received data from canvas component to room component
  function CanvasToRoom(sendFromCanvas) {
    // console.log(sendFromCanvas);
    sendCanvas(sendFromCanvas);
  }

  // function sendMessage() {
  //   sendChannel.current.send(text);
  //   setMessages((messages) => [...messages, { yours: true, value: text }]);
  //   setText("");
  // }

  // function renderMessage(message, index) {
  //   if (message.yours) {
  //     return (
  //       <MyRow key={index}>
  //         <MyMessage>{message.value}</MyMessage>
  //       </MyRow>
  //     );
  //   }

  //   return (
  //     <PartnerRow key={index}>
  //       <PartnerMessage>{message.value}</PartnerMessage>
  //     </PartnerRow>
  //   );
  // }

  return (
    <div>
      {/* <Messages>{messages.map(renderMessage)}</Messages> */}
      {/* <MessageBox
        value={text}
        onChange={handleChange}
        placeholder="Say something....."
      /> */}
      {/* <Button onClick={sendMessage}>Send..</Button> */}
      
      <Canvas
        recievedCanvasData={recievedCanvasData}
        CanvasToRoom={CanvasToRoom}
      />
      <CodeEditor />
    </div>
    
  );
};

export default Room;
